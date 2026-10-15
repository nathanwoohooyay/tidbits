import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/errorResponse';

type GuardJwtPayload = jwt.JwtPayload & {
  sub?: string | number;
  roles?: unknown;
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret = process.env.JWT_SECRET;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: { userId: number; roles: string[] } }>();
    const response = context.switchToHttp().getResponse<Response>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token || !this.jwtSecret) {
      sendError(response, request, 401, 'UNAUTHORIZED', 'unauthorized');
      return false;
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret, { algorithms: ['HS256'] }) as GuardJwtPayload;
      if (typeof payload === 'string') {
        sendError(response, request, 401, 'UNAUTHORIZED', 'unauthorized');
        return false;
      }

      const userId = Number(payload.sub);
      if (!Number.isInteger(userId) || userId <= 0) {
        sendError(response, request, 401, 'UNAUTHORIZED', 'unauthorized');
        return false;
      }

      const roles = Array.isArray(payload.roles)
        ? payload.roles.map((role: unknown) => String(role).toUpperCase())
        : [];

      request.user = {
        userId,
        roles,
      };

      return true;
    } catch {
      sendError(response, request, 401, 'UNAUTHORIZED', 'unauthorized');
      return false;
    }
  }

  private extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}