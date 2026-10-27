import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import '../env';
import { checkKafka, publishUserAuditEvent } from '../audit/userAuditPublisher';
import { sendError } from '../utils/errorResponse';
import { clientIp } from '../utils/clientIp';
import { timedCheck } from '../utils/healthCheck';
import { ensureAuthSchema } from './auth-schema';
import { LoginThrottle } from './login-throttle';
import {
  getSignupConflictError,
  validateLoginInput,
  validateSignupInput,
} from '../validation/authValidation';

const SALT_ROUNDS = 10;
const DEFAULT_SIGNUP_ROLE = 'client';
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Oldest sessions beyond this many per user are ended when another starts.
const MAX_SESSIONS_PER_USER = 20;
const THROTTLE_PRUNE_INTERVAL_MS = 60 * 60 * 1000;
const SCHEMA_RETRY_MS = 10_000;

// Where an audited request came from: the caller's IP (see utils/clientIp) and browser.
function auditSource(req: Request) {
  const agent = req.headers?.['user-agent'];
  return { ipAddress: clientIp(req), userAgent: typeof agent === 'string' && agent.trim() ? agent.trim().slice(0, 512) : null };
}

// One signed-in device, as listed on the Settings page.
export type SessionSummary = {
  sessionId: number;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
};

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type WhoAmIUser = {
  userId: number;
  username: string;
  email: string;
  phoneNumber: string | null;
  rewardPoints: number;
  dateOfBirth: string;
  lastLogin: string;
  role: string;
};

type WhoAmIProfileRow = Omit<WhoAmIUser, 'role'>;

type WhoAmIRoleRow = {
  role: string;
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
export class AuthService implements OnModuleInit, OnModuleDestroy {
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

  private readonly throttle = new LoginThrottle(this.authPool);

  constructor() {
    // Postgres dropping an idle connection (a restart, say) is reported on the pool; unhandled, it would crash the
    // service. The pool opens a new connection on the next query.
    for (const [name, pool] of [['profile', this.profilePool], ['auth', this.authPool]] as const) {
      pool.on('error', (error) => console.error(`${name} database connection lost`, error.message));
    }
  }
  private pruneTimer: NodeJS.Timeout | null = null;
  private schemaRetryTimer: NodeJS.Timeout | null = null;

  async onModuleInit() {
    this.pruneTimer = setInterval(() => void this.throttle.prune().catch(() => undefined), THROTTLE_PRUNE_INTERVAL_MS);
    this.pruneTimer.unref();
    await this.updateSchema();
  }

  async onModuleDestroy() {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
    }
    if (this.schemaRetryTimer) {
      clearTimeout(this.schemaRetryTimer);
    }
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
        ...auditSource(req),
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
        ...auditSource(req),
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
          ...auditSource(req),
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
          ...auditSource(req),
          details: 'DATABASE_CONSTRAINT_VIOLATION',
        });
        return sendError(res, req, 400, 'DATABASE_CONSTRAINT_VIOLATION', 'a required database constraint was violated');
      }

      await publishUserAuditEvent({
        eventType: 'SIGNUP',
        userId: null,
        username: (body as Record<string, unknown> | undefined)?.username,
        status: 'FAILURE',
        ...auditSource(req),
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
        ...auditSource(req),
        details: validation.errorCode,
      });
      return sendError(res, req, validation.status, validation.errorCode, validation.message);
    }

    const { normalizedUsername, password } = validation.data;
    const ipAddress = clientIp(req);
    const throttleKeys = LoginThrottle.keysFor(normalizedUsername, ipAddress);

    try {
      const retryAfter = await this.throttle.retryAfterSeconds(throttleKeys);
      if (retryAfter > 0) {
        // Its own event (the audit log keeps the event and status, not the details), so auditors can see lockouts.
        await publishUserAuditEvent({
          eventType: 'LOGIN_BLOCKED',
          userId: null,
          username: (body as Record<string, unknown> | undefined)?.username,
          status: 'FAILURE',
          ...auditSource(req),
          details: 'TOO_MANY_ATTEMPTS',
        });
        const minutes = Math.max(1, Math.ceil(retryAfter / 60));
        res.setHeader('Retry-After', String(retryAfter));
        return sendError(res, req, 429, 'TOO_MANY_ATTEMPTS',
          `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
      }

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
          ...auditSource(req),
          details: 'INVALID_LOGIN',
        });
        await this.throttle.recordFailure(throttleKeys);
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
          ...auditSource(req),
          details: 'INVALID_LOGIN',
        });
        await this.throttle.recordFailure(throttleKeys);
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
          ...auditSource(req),
          details: 'INVALID_LOGIN',
        });
        await this.throttle.recordFailure(throttleKeys);
        return sendError(res, req, 401, 'INVALID_LOGIN', 'invalid username or password');
      }

      await this.throttle.clear(throttleKeys);
      const refreshToken = this.generateRefreshToken();
      const refreshTokenHash = this.hashRefreshToken(refreshToken);
      const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
      const sessionId = await this.startSession(profileUser.user_id, refreshTokenHash, refreshTokenExpiresAt, req);
      const token = this.createAccessToken(profileUser.user_id, authUser.role_name || DEFAULT_SIGNUP_ROLE, authUser.token_version, sessionId);

      await Promise.all([
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
        ...auditSource(req),
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
        ...auditSource(req),
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
      const authResult = await this.authPool.query<{ token_id: number; user_id: number; expires_at: string; token_version: number }>(
        `
        SELECT r.token_id, r.user_id, r.expires_at, u.token_version
        FROM refresh_tokens r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.refresh_token = $1
        `,
        [refreshTokenHash],
      );

      if (authResult.rows.length === 0) {
        return sendError(res, req, 401, 'INVALID_REFRESH_TOKEN', 'invalid refresh token');
      }

      const { token_id: sessionId, user_id: userId, expires_at: tokenExpiresAt, token_version: tokenVersion } = authResult.rows[0];
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

      // Renewals are how a session shows as recently active (and from where) in the Sessions list.
      await this.authPool.query(
        `
        UPDATE refresh_tokens
        SET last_used_at = CURRENT_TIMESTAMP, ip_address = $2, user_agent = COALESCE($3, user_agent)
        WHERE token_id = $1
        `,
        [sessionId, clientIp(req), this.userAgent(req)],
      );

      const newToken = this.createAccessToken(userId, roleName, tokenVersion, sessionId);
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

  // The user's signed-in devices, most recently active first. `current` marks the one making the request.
  async listSessions(req: Request, res: Response, user: { userId: number; sessionId: number | null }) {
    try {
      const result = await this.authPool.query<{
        token_id: number; user_agent: string | null; ip_address: string | null; created_at: Date; last_used_at: Date;
      }>(
        `
        SELECT token_id, user_agent, ip_address, created_at, last_used_at
        FROM refresh_tokens
        WHERE user_id = $1 AND expires_at > NOW()
        ORDER BY last_used_at DESC, token_id DESC
        `,
        [user.userId],
      );
      const sessions: SessionSummary[] = result.rows.map((row) => ({
        sessionId: row.token_id,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
        createdAt: new Date(row.created_at).toISOString(),
        lastUsedAt: new Date(row.last_used_at).toISOString(),
        current: row.token_id === user.sessionId,
      }));
      return res.json({ sessions });
    } catch {
      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  // Ends every session but the one making the request. Their tokens stop working straight away: the gateway and the
  // auth guard reject tokens whose session is gone.
  async signOutOtherSessions(req: Request, res: Response, user: { userId: number; sessionId: number | null }) {
    if (user.sessionId == null) {
      return sendError(res, req, 400, 'SESSION_REQUIRED', 'sign in again to manage your sessions');
    }
    try {
      const result = await this.authPool.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1 AND token_id <> $2',
        [user.userId, user.sessionId],
      );
      const signedOut = result.rowCount ?? 0;
      await publishUserAuditEvent({
        eventType: 'SIGN_OUT_OTHER_SESSIONS',
        userId: user.userId,
        username: null,
        status: 'SUCCESS',
        ...auditSource(req),
        details: `${signedOut} session${signedOut === 1 ? '' : 's'} ended`,
      });
      return res.json({ signedOut });
    } catch {
      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  // Whether a token's session is still live (signing out, or signing out other devices, ends it).
  async isSessionActive(userId: number, sessionId: number): Promise<boolean> {
    const result = await this.authPool.query(
      'SELECT 1 FROM refresh_tokens WHERE token_id = $1 AND user_id = $2 AND expires_at > NOW()',
      [sessionId, userId],
    );
    return result.rows.length > 0;
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
        ...auditSource(req),
        details: null,
      });

      return res.status(204).send();
    } catch (error) {
      await publishUserAuditEvent({
        eventType: 'CHANGE_PASSWORD',
        userId,
        username,
        status: 'FAILURE',
        ...auditSource(req),
        details: null,
      });

      if ((error as { name?: string }).name === 'TokenExpiredError') {
        return sendError(res, req, 401, 'UNAUTHORIZED', 'token has expired');
      }

      console.error(error);
      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }
  }

  async whoAmI(req: Request, res: Response) {
    let userId: {userId: number, roles: string[] };

    try {
      userId = this.getUserFromAuthorizationHeader(req.headers.authorization);
    } catch (error) {
      const authErrorResponse = this.handleAuthenticationError(req, res, error);
      if (authErrorResponse) {
        return authErrorResponse;
      }

      return sendError(res, req, 500, 'INTERNAL_SERVER_ERROR', 'internal server error');
    }

    try {
      const [profileResult, roleResult] = await Promise.all([
        this.profilePool.query<WhoAmIProfileRow>(
          `
          SELECT
            u.user_id AS "userId",
            u.username,
            u.email,
            u.phone_number AS "phoneNumber",
            u.reward_points AS "rewardPoints",
            u.date_of_birth AS "dateOfBirth",
            u.last_login AS "lastLogin"
          FROM users u
          WHERE u.user_id = $1
          `,
          [userId.userId],
        ),
        this.authPool.query<WhoAmIRoleRow>(
          `
          SELECT UPPER(r.name::text) AS role
          FROM users u
          JOIN roles r ON r.role_id = u.role_id
          WHERE u.user_id = $1
          `,
          [userId.userId],
        ),
      ]);

      if (profileResult.rows.length === 0 || roleResult.rows.length === 0) {
        return sendError(res, req, 404, 'USER_NOT_FOUND', 'user not found');
      }

      return res.json({
        ...profileResult.rows[0],
        role: roleResult.rows[0].role,
      });
    } catch {
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
        ...auditSource(req),
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

  // Whether both databases and Kafka answer, for the gateway's service status.
  async health() {
    const [authDatabase, database, kafka] = await Promise.all([
      timedCheck(() => this.authPool.query('SELECT 1'), 'Auth database unreachable'),
      timedCheck(() => this.profilePool.query('SELECT 1'), 'Database unreachable'),
      checkKafka(),
    ]);
    const checks = { authDatabase, database, kafka };
    return { status: Object.values(checks).every((check) => check.status === 'up') ? 'up' : 'down', checks };
  }

  private hashRefreshToken(refreshToken: string) {
    return crypto.createHash('sha256').update(refreshToken).digest('hex');
  }

  private generateRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
  }

  // `sid` is the session (refresh_tokens row) the token belongs to, so ending the session ends the token too.
  private createAccessToken(userId: number, roleName: string, tokenVersion: number, sessionId: number) {
    return jwt.sign(
      {
        sub: userId,
        roles: [String(roleName).toUpperCase()],
        tokenVersion,
        sid: sessionId,
      },
      this.secret,
      { algorithm: 'HS256', expiresIn: '15m' },
    );
  }

  // Runs at startup. If the database isn't reachable yet, keeps retrying in the background rather than stopping the
  // service from starting.
  private async updateSchema(): Promise<void> {
    try {
      await ensureAuthSchema(this.authPool);
    } catch (error) {
      console.warn(`Auth schema update failed (${(error as Error).message}); retrying in ${SCHEMA_RETRY_MS / 1000}s`);
      this.schemaRetryTimer = setTimeout(() => void this.updateSchema(), SCHEMA_RETRY_MS);
      this.schemaRetryTimer.unref();
    }
  }

  // Records a new session and returns its id. Clears out the user's expired sessions, and the oldest ones beyond
  // MAX_SESSIONS_PER_USER.
  private async startSession(userId: number, refreshTokenHash: string, expiresAt: Date, req: Request): Promise<number> {
    const inserted = await this.authPool.query<{ token_id: number }>(
      `
      INSERT INTO refresh_tokens (user_id, refresh_token, expires_at, user_agent, ip_address, last_used_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING token_id
      `,
      [userId, refreshTokenHash, expiresAt, this.userAgent(req), clientIp(req)],
    );
    await this.authPool.query(
      `
      DELETE FROM refresh_tokens
      WHERE user_id = $1
        AND (expires_at <= NOW()
             OR token_id NOT IN (
               SELECT token_id FROM refresh_tokens
               WHERE user_id = $1 AND expires_at > NOW()
               ORDER BY last_used_at DESC, token_id DESC LIMIT $2
             ))
      `,
      [userId, MAX_SESSIONS_PER_USER],
    );
    return inserted.rows[0].token_id;
  }

  private userAgent(req: Request): string | null {
    return auditSource(req).userAgent;
  }

  private handleAuthenticationError(req: Request, res: Response, error: unknown) {
    if ((error as { name?: string }).name === 'TokenExpiredError') {
      return sendError(res, req, 401, 'UNAUTHORIZED', 'token has expired');
    }

    if (error instanceof Error && error.message === 'MISSING_AUTHORIZATION_HEADER') {
      return sendError(res, req, 401, 'UNAUTHORIZED', 'authorization token is required');
    }

    if (error instanceof Error && error.message === 'INVALID_AUTHORIZATION_HEADER') {
      return sendError(res, req, 401, 'UNAUTHORIZED', 'authorization header must use Bearer token');
    }

    if ((error as { name?: string }).name === 'JsonWebTokenError') {
      return sendError(res, req, 401, 'UNAUTHORIZED', 'invalid token');
    }

    return null;
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

  private getUserFromAuthorizationHeader(authorizationHeader: string | undefined) {
    if (!authorizationHeader) {
      throw new Error('MISSING_AUTHORIZATION_HEADER');
    }

    const [scheme, token] = authorizationHeader.split(' ', 2);
    if (scheme !== 'Bearer' || !token) {
      throw new Error('INVALID_AUTHORIZATION_HEADER');
    }

    return this.getUser(token);
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