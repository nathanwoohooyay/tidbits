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

const SALT_ROUNDS = 10;
const DEFAULT_SIGNUP_ROLE = 'client';
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly secret = process.env.JWT_SECRET as string;

  private readonly pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  async onModuleDestroy() {
    await this.pool.end();
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

    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await this.pool.query(
        `
        INSERT INTO users (role_id, username, email, password_hash, phone_number, date_of_birth)
        VALUES (
          (SELECT role_id FROM roles WHERE name = $1),
          $2,
          $3,
          $4,
          $5,
          $6
        )
        RETURNING user_id, username, email, phone_number AS "phoneNumber", created_at
        `,
        [DEFAULT_SIGNUP_ROLE, normalizedUsername, normalizedEmail, passwordHash, normalizedPhoneNumber, dateOfBirth],
      );

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
      const result = await this.pool.query(
        `
        SELECT u.user_id, u.password_hash, u.token_version, r.name AS role_name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE u.username = $1
        `,
        [normalizedUsername],
      );

      if (result.rows.length === 0) {
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

      const user = result.rows[0];
      const passwordMatches = await bcrypt.compare(password || '', user.password_hash);
      if (!passwordMatches) {
        await publishUserAuditEvent({
          eventType: 'LOGIN',
          userId: user.user_id,
          username: (body as Record<string, unknown> | undefined)?.username,
          status: 'FAILURE',
          ipAddress: resolveIpAddress(req),
          details: 'INVALID_LOGIN',
        });
        return sendError(res, req, 401, 'INVALID_LOGIN', 'invalid username or password');
      }

      const token = this.createAccessToken(user.user_id, user.role_name, user.token_version);
      const refreshToken = this.generateRefreshToken();
      const refreshTokenHash = this.hashRefreshToken(refreshToken);
      const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

      await this.pool.query(
        `
        INSERT INTO refresh_tokens (user_id, refresh_token, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id)
        DO UPDATE SET
          refresh_token = EXCLUDED.refresh_token,
          expires_at = EXCLUDED.expires_at
        `,
        [user.user_id, refreshTokenHash, refreshTokenExpiresAt],
      );

      await this.pool.query(
        `
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE user_id = $1
        `,
        [user.user_id],
      );

      await publishUserAuditEvent({
        eventType: 'LOGIN',
        userId: user.user_id,
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
      const result = await this.pool.query(
        `
        SELECT r.user_id, r.expires_at, u.token_version, role.name AS role_name
        FROM refresh_tokens r
        JOIN users u ON r.user_id = u.user_id
        JOIN roles role ON role.role_id = u.role_id
        WHERE r.refresh_token = $1
        `,
        [refreshTokenHash],
      );

      if (result.rows.length === 0) {
        return sendError(res, req, 401, 'INVALID_REFRESH_TOKEN', 'invalid refresh token');
      }

      const { user_id: userId, expires_at: tokenExpiresAt, role_name: roleName, token_version: tokenVersion } = result.rows[0];
      if (new Date(tokenExpiresAt) < new Date()) {
        return sendError(res, req, 401, 'EXPIRED_REFRESH_TOKEN', 'refresh token has expired');
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
      await this.pool.query(
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
      userId = this.getUserId(String(req.headers.authorization).split(' ')[1]);

      const result = await this.pool.query(
        `
        SELECT password_hash, username
        FROM users
        WHERE user_id = $1
        `,
        [userId],
      );

      if (result.rows.length === 0) {
        return sendError(res, req, 404, 'USER_NOT_FOUND', 'user not found');
      }

      const { password_hash: storedPassword, username: resolvedUsername } = result.rows[0];
      username = resolvedUsername;

      if (!(await bcrypt.compare(currentPassword, storedPassword))) {
        return sendError(res, req, 422, 'INVALID_CURRENT_PASSWORD', 'current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await this.pool.query(
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

  private getUserId(token: string) {
    const payload = jwt.verify(token, this.secret) as jwt.JwtPayload;
    return Number(payload.sub);
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