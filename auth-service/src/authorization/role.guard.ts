import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { sendError } from '../utils/errorResponse';
import { ROLES_KEY } from './roles.decorator';

type AuthenticatedRequest = Request & {
  user?: {
    roles?: string[];
  };
};

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const userRoles = request.user?.roles ?? [];
    const hasRole = requiredRoles.some((requiredRole: string) => userRoles.includes(requiredRole));

    if (!hasRole) {
      sendError(response, request, 403, 'FORBIDDEN', 'forbidden');
      return false;
    }

    return true;
  }
}