import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionService } from './session.service';
import { AuthSessionService } from './auth-session.service';

// Signed-in pages need a valid access token. One that has expired (they last 15 minutes) is renewed with the
// refresh cookie before giving up and sending the user to sign in.
export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  if (session.isAuthenticated()) {
    return true;
  }
  return authSession.refresh().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
