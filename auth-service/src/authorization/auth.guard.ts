import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/errorResponse';
import { AuthService } from '../auth/auth.service';

type GuardJwtPayload = jwt.JwtPayload & {
  sub?: string | number;
  roles?: unknown;
  sid?: string | number;
};

export type AuthenticatedUser = { userId: number; roles: string[]; sessionId: number | null };

// Requires a valid access token whose session is still live. Tokens issued before sessions were tracked carry no
// session id and are accepted until they expire (at most 15 minutes).
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret = process.env.JWT_SECRET;

  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
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

      const sessionId = payload.sid == null ? null : Number(payload.sid);
      if (sessionId != null && !(Number.isInteger(sessionId) && await this.authService.isSessionActive(userId, sessionId))) {
        sendError(response, request, 401, 'SESSION_ENDED', 'this session has been signed out');
        return false;
      }

      request.user = {
        userId,
        roles,
        sessionId,
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