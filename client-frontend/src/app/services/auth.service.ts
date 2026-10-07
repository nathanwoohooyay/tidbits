import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

type AuthFlow = 'login' | 'signup';

export interface LoginResponse {
  token?: string;
  error?: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface SignupResponse {
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly authBase = '/api/auth';

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authBase}/login`, {
      username,
      password
    });
  }

  signup(payload: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.authBase}/signup`, payload);
  }

  getLoginErrorMessage(error: unknown): string {
    return this.getAuthErrorMessage(error, 'login');
  }

  getSignupErrorMessage(error: unknown): string {
    return this.getAuthErrorMessage(error, 'signup');
  }

  private getAuthErrorMessage(error: unknown, flow: AuthFlow): string {
    const fallbackMessage = flow === 'login'
      ? 'Login failed. Check credentials.'
      : 'Registration failed. Please review your details and try again.';

    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const serverMessage = this.extractServerMessage(error);
    if (serverMessage) {
      return serverMessage;
    }

    if (error.status === 0) {
      return 'Unable to reach the server. Check your connection and try again.';
    }

    if (flow === 'login' && (error.status === 401 || error.status === 403)) {
      return 'Invalid username or password.';
    }

    if (flow === 'signup' && error.status === 409) {
      return 'An account with those details already exists.';
    }

    if (error.status >= 500) {
      return 'The service is temporarily unavailable. Please try again shortly.';
    }

    return fallbackMessage;
  }

  private extractServerMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }

    if (!error.error || typeof error.error !== 'object') {
      return null;
    }

    const payload = error.error as Record<string, unknown>;
    for (const key of ['error', 'message', 'detail']) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }
}

