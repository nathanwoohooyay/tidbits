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

  // If auditor, redirect to auditor dashboard instead of login
  if (authService.isAuthenticated()) {
    router.navigate(['/auditor/analytics']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};

export const auditorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAuditor()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
