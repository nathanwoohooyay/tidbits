import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    authService.redirectByRole();
    return false;
  }

  router.navigate(['/login']);
  return false;
};

export const analyticsGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.canViewAnalytics()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    authService.redirectByRole();
    return false;
  }

  router.navigate(['/login']);
  return false;
};

export const auditLogsGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.canViewAuditLogs()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    authService.redirectByRole();
    return false;
  }

  router.navigate(['/login']);
  return false;
};
