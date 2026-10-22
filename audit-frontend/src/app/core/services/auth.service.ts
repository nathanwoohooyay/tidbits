import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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
  readonly canViewAnalytics = computed(() => ['ADMIN', 'REPORTER'].includes(this.userRole() || ''));
  readonly canViewAuditLogs = computed(() => ['ADMIN', 'AUDITOR'].includes(this.userRole() || ''));
  readonly roleBadgeClass = computed(() => {
    switch (this.userRole()) {
      case 'ADMIN':
        return 'badge-admin';
      case 'AUDITOR':
        return 'badge-auditor';
      case 'REPORTER':
        return 'badge-reporter';
      default:
        return 'badge-user';
    }
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: { username: string; password?: string }): Observable<LoginResponse> {
    const url = `${environment.authApiUrl}/auth/login`;
    return this.http.post<LoginResponse>(url, credentials).pipe(
      tap(res => {
        const token = res?.accessToken || res?.token;
        if (token) {
          this.handleAuthSuccess(token, credentials.username);
        }
      })
    );
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

    let parsedRole: UserRole | null = explicitRole || null;
    let userId: number | undefined;
    let username = usernameFallback || 'user';
    let expiresAt: number | undefined;

    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const decoded = JSON.parse(atob(parts[1]));
        if (decoded.sub !== undefined && decoded.sub !== null) {
          const parsedUserId = Number(decoded.sub);
          if (Number.isInteger(parsedUserId) && parsedUserId > 0) {
            userId = parsedUserId;
          }
        }
        if (decoded.roles && Array.isArray(decoded.roles)) {
          if (decoded.roles.includes('ADMIN') || decoded.roles.includes('ROLE_ADMIN')) {
            parsedRole = 'ADMIN';
          } else if (decoded.roles.includes('AUDITOR') || decoded.roles.includes('ROLE_AUDITOR')) {
            parsedRole = 'AUDITOR';
          } else if (decoded.roles.includes('REPORTER') || decoded.roles.includes('ROLE_REPORTER')) {
            parsedRole = 'REPORTER';
          }
        }
        username = usernameFallback || username;
        expiresAt = decoded.exp ? decoded.exp * 1000 : undefined;
      }
    } catch (e) {
      console.warn('Could not decode JWT payload:', e);
    }

    if (!parsedRole || !['ADMIN', 'AUDITOR', 'REPORTER'].includes(parsedRole)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      this.currentUser.set(null);
      throw new Error('AUDIT_ROLE_REQUIRED');
    }

    const authUser: AuthUser = {
      userId,
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
    } else if (targetRole === 'AUDITOR') {
      this.router.navigate(['/auditor/logs']);
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
