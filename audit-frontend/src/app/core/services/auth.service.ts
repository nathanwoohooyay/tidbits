import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginResponse, UserRole } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'tidbits_auth_token';
  private readonly USER_KEY = 'tidbits_auth_user';

  // Reactive state using Angular Signals
  readonly currentUser = signal<AuthUser | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRole = computed<UserRole | null>(() => this.currentUser()?.role || null);
  readonly isAdmin = computed(() => this.userRole() === 'ADMIN');
  readonly isAuditor = computed(() => this.userRole() === 'AUDITOR' || this.userRole() === 'ADMIN');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: { username: string; password?: string }): Observable<LoginResponse> {
    const url = `${environment.authApiUrl}/auth/login`;
    return this.http.post<LoginResponse>(url, credentials).pipe(
      tap(res => {
        if (res && res.accessToken) {
          this.handleAuthSuccess(res.accessToken, credentials.username);
        }
      }),
      catchError(err => {
        // Fallback demo mock if auth-service is unreachable during offline dev
        console.warn('Backend login error, checking fallback demo credentials:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Fast Demo Login to quickly switch or test roles in development
   */
  demoLogin(role: UserRole) {
    const username = role === 'ADMIN' ? 'admin_demo' : 'auditor_demo';
    // Create simulated JWT token with valid header.payload.sig
    const payload = {
      sub: username,
      roles: [role],
      exp: Math.floor(Date.now() / 1000) + (3600 * 24),
      iat: Math.floor(Date.now() / 1000)
    };
    const mockToken = `mock.${btoa(JSON.stringify(payload))}.signature`;
    this.handleAuthSuccess(mockToken, username, role);
    this.redirectByRole(role);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private handleAuthSuccess(token: string, usernameFallback?: string, explicitRole?: UserRole) {
    localStorage.setItem(this.TOKEN_KEY, token);

    let parsedRole: UserRole = explicitRole || 'AUDITOR';
    let username = usernameFallback || 'user';
    let expiresAt: number | undefined;

    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const decoded = JSON.parse(atob(parts[1]));
        if (decoded.roles && Array.isArray(decoded.roles)) {
          if (decoded.roles.includes('ADMIN') || decoded.roles.includes('ROLE_ADMIN')) {
            parsedRole = 'ADMIN';
          } else if (decoded.roles.includes('AUDITOR') || decoded.roles.includes('ROLE_AUDITOR')) {
            parsedRole = 'AUDITOR';
          }
        }
        username = decoded.sub || usernameFallback || 'user';
        expiresAt = decoded.exp ? decoded.exp * 1000 : undefined;
      }
    } catch (e) {
      console.warn('Could not decode JWT payload:', e);
    }

    const authUser: AuthUser = {
      username,
      role: parsedRole,
      token,
      expiresAt
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(authUser));
    this.currentUser.set(authUser);
  }

  redirectByRole(role?: UserRole) {
    const targetRole = role || this.userRole();
    if (targetRole === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/auditor/analytics']);
    }
  }

  private getStoredUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      if (!stored) return null;
      const user = JSON.parse(stored) as AuthUser;
      if (user.expiresAt && Date.now() > user.expiresAt) {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }
}
