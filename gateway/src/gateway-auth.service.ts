import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

type JwtPayload = {
  sub?: string | number;
  tokenVersion?: string | number;
  roles?: string[];
  // The sign-in session the token belongs to; absent on tokens issued before sessions were tracked.
  sid?: string | number;
};

export class GatewayAuthError extends Error {
  constructor(
    readonly statusCode: number,
    readonly message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class GatewayAuthService implements OnModuleDestroy {
  private readonly jwtSecret = process.env.JWT_SECRET;

  private readonly pool = new Pool({
    host: process.env.DB_AUTH_HOST || process.env.DB_HOST,
    port: Number(process.env.DB_AUTH_PORT ?? process.env.DB_PORT ?? 5432),
    user: process.env.DB_AUTH_USER || process.env.DB_USER,
    password: process.env.DB_AUTH_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_AUTH_NAME || 'tidbits_auth',
  });

  async authorizeRequest(request: Request, routePrefix: string): Promise<void> {
    if (request.method === 'OPTIONS') {
      return;
    }

    const token = this.extractBearerToken(request.headers.authorization);
    const payload = this.verifyToken(token);
    const userId = this.parseIntegerClaim(payload.sub, 'subject', 401);
    const role = payload.roles?.[0];
    const tokenVersion = this.parseIntegerClaim(payload.tokenVersion, 'tokenVersion', 401);
    const sessionId = payload.sid == null ? null : this.parseIntegerClaim(payload.sid, 'sid', 401);

    const persisted = await this.lookupTokenState(userId, sessionId);
    if (persisted.tokenVersion !== tokenVersion || !persisted.sessionActive) {
      throw new GatewayAuthError(401, 'Unauthorized');
    }

    if ((routePrefix === "/audit" || routePrefix === "/metrics") && !["ADMIN", "AUDITOR", "REPORTER"].includes(role || "")) {
      throw new GatewayAuthError(403, 'Forbidden');
    }

    if (routePrefix === "/client" && role !== "CLIENT") {
      throw new GatewayAuthError(403, 'Forbidden');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  private extractBearerToken(headerValue: string | undefined): string {
    if (!headerValue) {
      throw new GatewayAuthError(401, 'Unauthorized');
    }

    const [scheme, token] = headerValue.split(' ', 2);
    if (scheme !== 'Bearer' || !token) {
      throw new GatewayAuthError(401, 'Unauthorized');
    }

    return token;
  }

  private verifyToken(token: string): JwtPayload {
    if (!this.jwtSecret) {
      throw new GatewayAuthError(500, 'JWT_SECRET is not configured');
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      });

      if (typeof payload === 'string') {
        throw new GatewayAuthError(401, 'Unauthorized');
      }

      return payload as JwtPayload;
    } catch (error) {
      if (error instanceof GatewayAuthError) {
        throw error;
      }

      throw new GatewayAuthError(401, 'Unauthorized');
    }
  }

  private parseIntegerClaim(value: string | number | undefined, claimName: string, statusCode: number): number {
    if (typeof value === 'number' && Number.isInteger(value)) {
      return value;
    }

    if (typeof value === 'string' && value.length > 0) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    throw new GatewayAuthError(statusCode, 'Unauthorized');
  }

  // The user's current token version, and whether the token's session is still live (signing out, or signing out
  // other devices, deletes it). A token without a session id has nothing to check.
  private async lookupTokenState(userId: number, sessionId: number | null): Promise<{ tokenVersion: number; sessionActive: boolean }> {
    try {
      const result = await this.pool.query<{ token_version: number | null; session_active: boolean }>(
        `SELECT u.token_version,
                ($2::int IS NULL OR EXISTS (
                  SELECT 1 FROM refresh_tokens r WHERE r.token_id = $2 AND r.user_id = u.user_id AND r.expires_at > NOW()
                )) AS session_active
         FROM users u WHERE u.user_id = $1`,
        [userId, sessionId],
      );

      if (result.rows.length === 0) {
        throw new GatewayAuthError(401, 'Unauthorized');
      }

      return { tokenVersion: result.rows[0]?.token_version ?? 0, sessionActive: result.rows[0]?.session_active === true };
    } catch (error) {
      if (error instanceof GatewayAuthError) {
        throw error;
      }

      throw new GatewayAuthError(502, 'Unable to validate JWT token version');
    }
  }
}