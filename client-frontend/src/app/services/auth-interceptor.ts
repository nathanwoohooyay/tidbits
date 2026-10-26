import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from './session.service';
import { AuthSessionService } from './auth-session.service';

// Auth endpoints that take no access token (the rest of /api/auth, like sessions, do).
const PUBLIC_AUTH_URL = /\/api\/auth\/(login|signup|refresh|logout|health)$/;

// Adds the access token to API calls. When one comes back 401 because the token has expired, it gets a new token
// with the refresh cookie and retries once. If that fails too, the session has ended and the user signs in again.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const authSession = inject(AuthSessionService);
  const token = session.getAuthToken();

  if (!token || PUBLIC_AUTH_URL.test(req.url.split('?')[0])) {
    return next(req);
  }

  const withToken = (value: string) => req.clone({ setHeaders: { Authorization: `Bearer ${value}` } });
  const isUnauthorized = (error: unknown) => error instanceof HttpErrorResponse && error.status === 401;

  return next(withToken(token)).pipe(
    catchError(error => {
      if (!isUnauthorized(error)) {
        return throwError(() => error);
      }
      return authSession.refresh().pipe(
        catchError(() => {
          authSession.endSession();
          return throwError(() => error);
        }),
        switchMap(fresh => next(withToken(fresh)).pipe(
          catchError(retryError => {
            if (isUnauthorized(retryError)) {
              authSession.endSession();
            }
            return throwError(() => retryError);
          }),
        )),
      );
    }),
  );
};
