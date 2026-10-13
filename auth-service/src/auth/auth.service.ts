import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import '../env';
import { publishUserAuditEvent, resolveIpAddress } from '../audit/userAuditPublisher';
import { sendError } from '../utils/errorResponse';
import {
  getSignupConflictError,
  validateLoginInput,
  validateSignupInput,
} from '../validation/authValidation';
import { isAuditLoginRole } from './rolePolicy';

const SALT_ROUNDS = 10;
const DEFAULT_SIGNUP_ROLE = 'client';
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type ProfileUserRow = {
  user_id: number;
  username: string;
};

type AuthUserRow = {
  password_hash: string;
  token_version: number;
  role_name?: string;
};

type RoleRow = {
  role_id: number;
  name: string;
};

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly secret = process.env.JWT_SECRET as string;

  private readonly profilePool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  private readonly authPool = new Pool({
    host: process.env.DB_AUTH_HOST || process.env.DB_HOST,
    port: Number(process.env.DB_AUTH_PORT || process.env.DB_PORT || 5432),
    user: process.env.DB_AUTH_USER || process.env.DB_USER,
    password: process.env.DB_AUTH_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_AUTH_NAME || 'tidbits_auth',
  });

  async onModuleDestroy() {
    await Promise.all([this.profilePool.end(), this.authPool.end()]);
  }

  async signup(req: Request, res: Response, body: unknown) {
    const validation = validateSignupInput(body);
    if (!validation.ok) {
      await publishUserAuditEvent({
        eventType: 'SIGNUP',
        userId: null,
        username: (body as Record<string, unknown> | undefined)?.username,
        status: 'FAILURE',
        ipAddress: resolveIpAddress(req),
        details: validation.errorCode,
      });
      return sendError(res, req, validation.status, validation.errorCode, validation.message);
    }

    const { normalizedUsername, normalizedEmail, normalizedPhoneNumber, password, dateOfBirth } = validation.data;

    let createdUserId: number | null = null;
    let authUserCreated = false;
    const profileClient = await this.profilePool.connect();

    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const defaultRole = await this.lookupRoleByName(DEFAULT_SIGNUP_ROLE);

      await profileClient.query('BEGIN');

      const result = await profileClient.query(
        `
        INSERT INTO users (username, email, phone_number, date_of_birth)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id, username, email, phone_number AS "phoneNumber", created_at
        `,
        [normalizedUsername, normalizedEmail, normalizedPhoneNumber, dateOfBirth],
      );

      createdUserId = result.rows[0].user_id;
      await this.authPool.query(
        `
        INSERT INTO users (user_id, password_hash, role_id)
        VALUES ($1, $2, $3)
        `,
        [createdUserId, passwordHash, defaultRole.role_id],
      );
      authUserCreated = true;
      await profileClient.query('COMMIT');

      await publishUserAuditEvent({
        eventType: 'SIGNUP',
        userId: result.rows[0].user_id,
        username: result.rows[0].username,
        status: 'SUCCESS',
        ipAddress: resolveIpAddress(req),
        details: null,
      });

      return res.status(201).json({
        message: 'user created',
        user: result.rows[0],
      });
    } catch (error) {
      await profileClient.query('ROLLBACK').catch(() => undefined);

      if (authUserCreated && createdUserId !== null) {
        await this.authPool.query('DELETE FROM users WHERE user_id = $1', [createdUserId]).catch(() => undefined);
      }

      const dbError = error as { code?: string; constraint?: string; detail?: string };

      if (dbError.code === '23505') {
        const conflict = getSignupConflictError(dbError);
        await publishUserAuditEvent({
          eventType: 'SIGNUP',
          userId: null,
          username: (body as Record<string, unknown> | undefined)?.username,
          status: 'FAILURE',
          ipAddress: resolveIpAddress(req),
          details: conflict.errorCode,
        });
        return sendError(res, req, 409, conflict.errorCode, conflict.message);
      }

      if (dbError.code === '23502') {
        await publishUserAuditEvent({
          eventType: 'SIGNUP',
          userId: null,
          username: (body as Record<string, unknown> | undefined)?.username,
          status: 'FAILURE',
          ipAddress: resolveIpAddress(req),
          details: 'DATABASE_CONSTRAINT_VIOLATION',
        });
        return sendError(res, req, 400, 'DATABASE_CONSTRAINT_VIOLATION', 'a required database constraint was violated');
      }

      await publishUserAuditEvent({
        eventType: 'SIGNUP',
        userId: null,
        username: (body as Record<string, unknown> | undefined)?.username,
        status: 'FAILURE',
        ipAddress: resolveIpAddress(req),
        details: 'INTERNAL_SERVER_ERROR',
      });
      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    } finally {
      profileClient.release();
    }
  }

  async login(req: Request, res: Response, body: unknown) {
    const validation = validateLoginInput(body);
    if (!validation.ok) {
      await publishUserAuditEvent({
        eventType: 'LOGIN',
        userId: null,
        username: (body as Record<string, unknown> | undefined)?.username,
        status: 'FAILURE',
        ipAddress: resolveIpAddress(req),
        details: validation.errorCode,
      });
      return sendError(res, req, validation.status, validation.errorCode, validation.message);
    }

    const { normalizedUsername, password } = validation.data;

    try {
      const profileResult = await this.profilePool.query<ProfileUserRow>(
        `
        SELECT u.user_id, u.username
        FROM users u
        WHERE u.username = $1
        `,
        [normalizedUsername],
      );

      if (profileResult.rows.length === 0) {
        await publishUserAuditEvent({
          eventType: 'LOGIN',
          userId: null,
          username: (body as Record<string, unknown> | undefined)?.username,
          status: 'FAILURE',
          ipAddress: resolveIpAddress(req),
          details: 'INVALID_LOGIN',
        });
        return sendError(res, req, 401, 'INVALID_LOGIN', 'invalid username or password');
      }

      const profileUser = profileResult.rows[0];
      const authResult = await this.authPool.query<AuthUserRow>(
        `
        SELECT u.password_hash, u.token_version, r.name::text AS role_name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE user_id = $1
        `,
        [profileUser.user_id],
      );

      if (authResult.rows.length === 0) {
        await publishUserAuditEvent({
          eventType: 'LOGIN',
          userId: profileUser.user_id,
          username: (body as Record<string, unknown> | undefined)?.username,
          status: 'FAILURE',
          ipAddress: resolveIpAddress(req),
          details: 'INVALID_LOGIN',
        });
        return sendError(res, req, 401, 'INVALID_LOGIN', 'invalid username or password');
      }

      const authUser = authResult.rows[0];
      const passwordMatches = await bcrypt.compare(password || '', authUser.password_hash);
      if (!passwordMatches) {
        await publishUserAuditEvent({
          eventType: 'LOGIN',
          userId: profileUser.user_id,
          username: (body as Record<string, unknown> | undefined)?.username,
          status: 'FAILURE',
          ipAddress: resolveIpAddress(req),
          details: 'INVALID_LOGIN',
        });
        return sendError(res, req, 401, 'INVALID_LOGIN', 'invalid username or password');
      }

      if (!isAuditLoginRole(authUser.role_name)) {
        await publishUserAuditEvent({
          eventType: 'LOGIN',
          userId: profileUser.user_id,
          username: (body as Record<string, unknown> | undefined)?.username,
          status: 'FAILURE',
          ipAddress: resolveIpAddress(req),
          details: 'ROLE_NOT_ALLOWED',
        });
        return sendError(res, req, 403, 'ROLE_NOT_ALLOWED', 'this account is not authorized to access the audit portal');
      }

      const token = this.createAccessToken(profileUser.user_id, authUser.role_name || DEFAULT_SIGNUP_ROLE, authUser.token_version);
      const refreshToken = this.generateRefreshToken();
      const refreshTokenHash = this.hashRefreshToken(refreshToken);
      const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

      await Promise.all([
        this.authPool.query(
          `
          INSERT INTO refresh_tokens (user_id, refresh_token, expires_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id)
          DO UPDATE SET
            refresh_token = EXCLUDED.refresh_token,
            expires_at = EXCLUDED.expires_at
          `,
          [profileUser.user_id, refreshTokenHash, refreshTokenExpiresAt],
        ),
        this.profilePool.query(
          `
          UPDATE users
          SET last_login = CURRENT_TIMESTAMP
          WHERE user_id = $1
          `,
          [profileUser.user_id],
        ),
      ]);

      await publishUserAuditEvent({
        eventType: 'LOGIN',
        userId: profileUser.user_id,
        username: (body as Record<string, unknown> | undefined)?.username,
        status: 'SUCCESS',
        ipAddress: resolveIpAddress(req),
        details: null,
      });

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, this.getRefreshCookieOptions());
      res.status(200);
      return res.json({ token });
    } catch {
      await publishUserAuditEvent({
        eventType: 'LOGIN',
        userId: null,
        username: (body as Record<string, unknown> | undefined)?.username,
        status: 'FAILURE',
        ipAddress: resolveIpAddress(req),
        details: 'INTERNAL_SERVER_ERROR',
      });
      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      return sendError(res, req, 401, 'MISSING_REFRESH_TOKEN', 'refresh token is required');
    }

    try {
      const refreshTokenHash = this.hashRefreshToken(refreshToken);
      const authResult = await this.authPool.query<{ user_id: number; expires_at: string; token_version: number }>(
        `
        SELECT r.user_id, r.expires_at, u.token_version
        FROM refresh_tokens r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.refresh_token = $1
        `,
        [refreshTokenHash],
      );

      if (authResult.rows.length === 0) {
        return sendError(res, req, 401, 'INVALID_REFRESH_TOKEN', 'invalid refresh token');
      }

      const { user_id: userId, expires_at: tokenExpiresAt, token_version: tokenVersion } = authResult.rows[0];
      if (new Date(tokenExpiresAt) < new Date()) {
        return sendError(res, req, 401, 'EXPIRED_REFRESH_TOKEN', 'refresh token has expired');
      }

      const roleResult = await this.authPool.query<{ role_name: string }>(
        `
        SELECT role.name::text AS role_name
        FROM users u
        JOIN roles role ON role.role_id = u.role_id
        WHERE u.user_id = $1
        `,
        [userId],
      );

      if (roleResult.rows.length === 0) {
        return sendError(res, req, 401, 'INVALID_REFRESH_TOKEN', 'invalid refresh token');
      }

      const roleName = roleResult.rows[0].role_name;
      if (!isAuditLoginRole(roleName)) {
        return sendError(res, req, 403, 'ROLE_NOT_ALLOWED', 'this account is not authorized to access the audit portal');
      }

      const newToken = this.createAccessToken(userId, roleName, tokenVersion);
      return res.json({ accessToken: newToken });
    } catch {
      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      res.clearCookie(REFRESH_COOKIE_NAME, this.getRefreshCookieOptions());
      return res.status(204).send();
    }

    try {
      const refreshTokenHash = this.hashRefreshToken(refreshToken);
      await this.authPool.query(
        `
        DELETE FROM refresh_tokens
        WHERE refresh_token = $1
        `,
        [refreshTokenHash],
      );

      res.clearCookie(REFRESH_COOKIE_NAME, this.getRefreshCookieOptions());
      return res.status(204).send();
    } catch {
      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  async changePassword(req: Request, res: Response, body: ChangePasswordBody) {
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return sendError(res, req, 400, 'MISSING_FIELDS', 'current password, new password, and confirm password are required');
    }

    if (newPassword !== confirmPassword) {
      return sendError(res, req, 400, 'PASSWORD_MISMATCH', 'new password and confirm password do not match');
    }

    let userId: number | null = null;
    let username: string | null = null;

    try {
      userId = this.getUser(String(req.headers.authorization).split(' ')[1]).userId;

      const [authResult, profileResult] = await Promise.all([
        this.authPool.query<{ password_hash: string }>(
          `
          SELECT password_hash
          FROM users
          WHERE user_id = $1
          `,
          [userId],
        ),
        this.profilePool.query<{ username: string }>(
          `
          SELECT username
          FROM users
          WHERE user_id = $1
          `,
          [userId],
        ),
      ]);

      if (authResult.rows.length === 0 || profileResult.rows.length === 0) {
        return sendError(res, req, 404, 'USER_NOT_FOUND', 'user not found');
      }

      const { password_hash: storedPassword } = authResult.rows[0];
      username = profileResult.rows[0].username;

      if (!(await bcrypt.compare(currentPassword, storedPassword))) {
        return sendError(res, req, 422, 'INVALID_CURRENT_PASSWORD', 'current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await this.authPool.query(
        `
        UPDATE users
        SET password_hash = $1, token_version = token_version + 1
        WHERE user_id = $2
        `,
        [hashedNewPassword, userId],
      );

      await publishUserAuditEvent({
        eventType: 'CHANGE_PASSWORD',
        userId,
        username,
        status: 'SUCCESS',
        ipAddress: resolveIpAddress(req),
        details: null,
      });

      return res.status(204).send();
    } catch (error) {
      await publishUserAuditEvent({
        eventType: 'CHANGE_PASSWORD',
        userId,
        username,
        status: 'FAILURE',
        ipAddress: resolveIpAddress(req),
        details: null,
      });

      if ((error as { name?: string }).name === 'TokenExpiredError') {
        return sendError(res, req, 401, 'UNAUTHORIZED', 'token has expired');
      }

      console.error(error);
      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  async revokeAccess(req: Request, res: Response, userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      return sendError(res, req, 400, 'INVALID_USER_ID', 'user id must be a positive integer');
    }

    try {
      const profileResult = await this.profilePool.query<{ username: string }>(
        `
        SELECT username
        FROM users
        WHERE user_id = $1
        `,
        [userId],
      );

      if (profileResult.rows.length === 0) {
        return sendError(res, req, 404, 'USER_NOT_FOUND', 'user not found');
      }

      const updateResult = await this.authPool.query(
        `
        UPDATE users
        SET token_version = token_version + 1
        WHERE user_id = $1
        `,
        [userId],
      );

      if ((updateResult.rowCount ?? 0) === 0) {
        return sendError(res, req, 404, 'USER_NOT_FOUND', 'user not found');
      }

      await this.authPool.query(
        `
        DELETE FROM refresh_tokens
        WHERE user_id = $1
        `,
        [userId],
      );

      await publishUserAuditEvent({
        eventType: 'ACCESS_REVOKED',
        userId,
        username: profileResult.rows[0].username,
        status: 'SUCCESS',
        ipAddress: resolveIpAddress(req),
        details: null,
      });

      return res.status(204).send();
    } catch (error) {
      if ((error as { name?: string }).name === 'TokenExpiredError') {
        return sendError(res, req, 401, 'UNAUTHORIZED', 'token has expired');
      }

      if (error instanceof Error && error.message === 'FORBIDDEN') {
        console.log("FORBIDDEN error here", error)
        return sendError(res, req, 403, 'FORBIDDEN', 'forbidden');
      }

      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  async getAllRoles(req: Request, res: Response) {
    try {
      const result = await this.authPool.query<RoleRow>(
        `
        SELECT role_id, UPPER(name::text) AS name
        FROM roles
        ORDER BY role_id
        `,
      );

      return res.json(result.rows.map((row) => ({ roleId: row.role_id, name: row.name })));
    } catch (error) {
      if ((error as { name?: string }).name === 'TokenExpiredError') {
        return sendError(res, req, 401, 'UNAUTHORIZED', 'token has expired');
      }

      if (error instanceof Error && error.message === 'FORBIDDEN') {
        return sendError(res, req, 403, 'FORBIDDEN', 'forbidden');
      }

      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  async getRoleById(req: Request, res: Response, roleId: number) {
    if (!Number.isInteger(roleId) || roleId <= 0) {
      return sendError(res, req, 400, 'INVALID_ROLE_ID', 'role id must be a positive integer');
    }

    try {
      const role = await this.lookupRoleById(roleId);
      return res.json({ roleId: role.role_id, name: role.name.toUpperCase() });
    } catch (error) {
      if ((error as { name?: string }).name === 'TokenExpiredError') {
        return sendError(res, req, 401, 'UNAUTHORIZED', 'token has expired');
      }

      if (error instanceof Error && error.message === 'FORBIDDEN') {
        return sendError(res, req, 403, 'FORBIDDEN', 'forbidden');
      }

      if (error instanceof Error && error.message === 'ROLE_NOT_FOUND') {
        return sendError(res, req, 404, 'ROLE_NOT_FOUND', 'role not found');
      }

      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  async getUserRole(req: Request, res: Response, userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      return sendError(res, req, 400, 'INVALID_USER_ID', 'user id must be a positive integer');
    }

    try {
      const result = await this.authPool.query<RoleRow>(
        `
        SELECT r.role_id, UPPER(r.name::text) AS name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = $1
        `,
        [userId],
      );

      if (result.rows.length === 0) {
        return sendError(res, req, 404, 'USER_NOT_FOUND', 'user not found');
      }

      const role = result.rows[0];
      return res.json({ roleId: role.role_id, name: role.name });
    } catch (error) {
      if ((error as { name?: string }).name === 'TokenExpiredError') {
        return sendError(res, req, 401, 'UNAUTHORIZED', 'token has expired');
      }

      if (error instanceof Error && error.message === 'FORBIDDEN') {
        return sendError(res, req, 403, 'FORBIDDEN', 'forbidden');
      }

      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  async updateUserRole(req: Request, res: Response, userId: number, body: unknown) {
    if (!Number.isInteger(userId) || userId <= 0) {
      return sendError(res, req, 400, 'INVALID_USER_ID', 'user id must be a positive integer');
    }

    const payload = body as { roleId?: number; roleName?: string } | null;
    const requestedRoleId = typeof payload?.roleId === 'number' ? payload.roleId : null;
    const requestedRoleName = typeof payload?.roleName === 'string' ? payload.roleName.trim() : '';

    if (requestedRoleId == null && requestedRoleName.length === 0) {
      return sendError(res, req, 400, 'MISSING_ROLE', 'either roleId or roleName is required');
    }

    try {

      const role = requestedRoleId != null
        ? await this.lookupRoleById(requestedRoleId)
        : await this.lookupRoleByName(requestedRoleName);

      const updateResult = await this.authPool.query(
        `
        UPDATE users
        SET role_id = $1
        WHERE user_id = $2
        `,
        [role.role_id, userId],
      );

      if ((updateResult.rowCount ?? 0) === 0) {
        return sendError(res, req, 404, 'USER_NOT_FOUND', 'user not found');
      }

      return res.json({ roleId: role.role_id, name: role.name.toUpperCase() });
    } catch (error) {
      if ((error as { name?: string }).name === 'TokenExpiredError') {
        return sendError(res, req, 401, 'UNAUTHORIZED', 'token has expired');
      }

      if (error instanceof Error && error.message === 'FORBIDDEN') {
        return sendError(res, req, 403, 'FORBIDDEN', 'forbidden');
      }

      if (error instanceof Error && error.message === 'ROLE_NOT_FOUND') {
        return sendError(res, req, 404, 'ROLE_NOT_FOUND', 'role not found');
      }

      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  health() {
    return { status: 'up' };
  }

  private hashRefreshToken(refreshToken: string) {
    return crypto.createHash('sha256').update(refreshToken).digest('hex');
  }

  private generateRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
  }

  private createAccessToken(userId: number, roleName: string, tokenVersion: number) {
    return jwt.sign(
      {
        sub: userId,
        roles: [String(roleName).toUpperCase()],
        tokenVersion,
      },
      this.secret,
      { algorithm: 'HS256', expiresIn: '15m' },
    );
  }

  private getUser(token: string) {
    const payload = jwt.verify(token, this.secret) as jwt.JwtPayload;
    return {
      userId: Number(payload.sub),
      roles: Array.isArray(payload.roles) ? payload.roles.map((role: unknown) => String(role).toUpperCase()) : [],
    };
  }

  private async lookupRoleById(roleId: number) {
    const result = await this.authPool.query<RoleRow>(
      `
      SELECT role_id, name::text AS name
      FROM roles
      WHERE role_id = $1
      `,
      [roleId],
    );

    if (result.rows.length === 0) {
      throw new Error('ROLE_NOT_FOUND');
    }

    return result.rows[0];
  }

  private async lookupRoleByName(roleName: string) {
    const normalizedRoleName = roleName.trim().toLowerCase();
    const result = await this.authPool.query<RoleRow>(
      `
      SELECT role_id, name::text AS name
      FROM roles
      WHERE name = $1::role_type
      `,
      [normalizedRoleName],
    );

    if (result.rows.length === 0) {
      throw new Error('ROLE_NOT_FOUND');
    }

    return result.rows[0];
  }

  private getRefreshCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: false,
      maxAge: REFRESH_TOKEN_TTL_MS,
      path: '/api/auth',
    };
  }
}