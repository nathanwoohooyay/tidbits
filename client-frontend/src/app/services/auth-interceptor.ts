import {inject} from '@angular/core';
import {HttpInterceptorFn} from '@angular/common/http';
import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn =
  (req, next) => {
    const tokenStore = inject(SessionService);
    const token = tokenStore.getAuthToken();
    if (token && !req.url.endsWith('login')) {
      const authedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      console.log(authedReq);
      return next(authedReq);
    }
    return next(req);
  };
