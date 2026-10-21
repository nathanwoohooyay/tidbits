import {inject} from '@angular/core';
import {HttpInterceptorFn, HttpErrorResponse} from '@angular/common/http';
import { SessionService } from './session.service';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn =
  (req, next) => {
    const session = inject(SessionService);
    const router = inject(Router);
    const token = session.getAuthToken();

    if (token && !req.url.endsWith('login')&& !req.url.endsWith('signup')) {
      const authedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      console.log(authedReq);
      return next(authedReq).pipe(
        catchError((error) => {
          if (error.status === 401) {
            session.clearAuthToken();
            router.navigateByUrl('/login');
          }
      return throwError(() => error); // required: return ObservableInput
        })
    );
    }
    return next(req)
  };
