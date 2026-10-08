import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

type JwtPayload = {
  sub?: string | number;
  tokenVersion?: string | number;
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
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  async authorizeRequest(request: Request, routePrefix: string): Promise<void> {

    const token = this.extractBearerToken(request.headers.authorization);
    const payload = this.verifyToken(token);
    const userId = this.parseIntegerClaim(payload.sub, 'subject', 401);
    const tokenVersion = this.parseIntegerClaim(payload.tokenVersion, 'tokenVersion', 401);

    const persistedTokenVersion = await this.lookupTokenVersion(userId);
    if (persistedTokenVersion !== tokenVersion) {
      throw new GatewayAuthError(401, 'Unauthorized');
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

  private async lookupTokenVersion(userId: number): Promise<number> {
    try {
      const result = await this.pool.query<{ token_version: number | null }>(
        'SELECT token_version FROM users WHERE user_id = $1',
        [userId],
      );

      if (result.rows.length === 0) {
        throw new GatewayAuthError(401, 'Unauthorized');
      }

      return result.rows[0]?.token_version ?? 0;
    } catch (error) {
      if (error instanceof GatewayAuthError) {
        throw error;
      }

      throw new GatewayAuthError(502, 'Unable to validate JWT token version');
    }
  }
}