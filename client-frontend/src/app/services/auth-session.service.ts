import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { Observable, catchError, finalize, map, of, shareReplay } from 'rxjs';
import { SessionService } from './session.service';

// Keeps the session alive and ends it. Access tokens last 15 minutes; the auth service's httpOnly refresh cookie
// (7 days) trades for a new one. Requests here skip the interceptors, so a failing refresh can't trigger another.
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly queryClient = inject(QueryClient);
  private readonly authBase = '/api/auth';

  private inFlight: Observable<string> | null = null;

  // A fresh access token (also stored in the session). Calls made while one is in flight share it.
  // Errors when there's no valid refresh cookie, i.e. the user has to sign in again.
  refresh(): Observable<string> {
    this.inFlight ??= this.http.post<{ accessToken?: string }>(`${this.authBase}/refresh`, {}, { withCredentials: true }).pipe(
      map(res => {
        if (!res?.accessToken) {
          throw new Error('No access token in refresh response');
        }
        this.session.setAuthToken(res.accessToken);
        return res.accessToken;
      }),
      finalize(() => { this.inFlight = null; }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.inFlight;
  }

  // Signs out on the server (revoking the refresh cookie), then locally. The server call is best-effort: the local
  // session ends either way.
  signOut() {
    this.http.post(`${this.authBase}/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.endSession();
  }

  // Forgets the user here: token, cached data (so the next person to sign in on this browser can't see it), and
  // back to sign-in.
  endSession() {
    this.session.clearSession();
    this.queryClient.clear();
    void this.router.navigateByUrl('/login');
  }
}
