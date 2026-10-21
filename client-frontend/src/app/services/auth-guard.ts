import {inject} from '@angular/core';
import { SessionService } from './session.service';
import {CanActivateFn, Router} from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const tokenStore = inject(SessionService);
  const router = inject(Router);
  if (tokenStore.isAuthenticated()) return true;
  router.navigate(['/login']);
  return false;
};
