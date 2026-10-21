import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

type AuthFlow = 'login' | 'signup';
export type SignupField = 'username' | 'email' | 'dateOfBirth' | 'phoneNumber' | 'password';

interface AuthErrorPayload {
  error?: string;
  errorCode?: string;
  message?: string;
  detail?: string;
}

export interface LoginResponse {
  token?: string;
  error?: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  dateOfBirth: string;
  phoneNumber: string;
  password: string;
}

export interface SignupResponse {
  message?: string;
}

export type SignupFieldErrors = Partial<Record<SignupField, string>>;

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

  getSignupFieldErrors(error: unknown): SignupFieldErrors {
    if (!(error instanceof HttpErrorResponse)) {
      return {};
    }

    const errorCode = this.getErrorCode(error);
    switch (errorCode) {
      case 'INVALID_USERNAME':
        return { username: 'Username must be 3-30 characters and use only letters, numbers, periods, underscores, or hyphens.' };
      case 'INVALID_EMAIL':
        return { email: 'Enter a valid email address.' };
      case 'INVALID_DATE_OF_BIRTH':
        return { dateOfBirth: 'Enter a valid date of birth.' };
      case 'INVALID_PHONE_NUMBER':
        return { phoneNumber: 'Enter a valid 10-digit US phone number.' };
      case 'INVALID_PASSWORD':
        return { password: 'Password must be 8-20 characters and include uppercase, lowercase, and a number.' };
      case 'USERNAME_ALREADY_EXISTS':
        return { username: 'That username is already in use.' };
      case 'EMAIL_ALREADY_EXISTS':
        return { email: 'That email address is already registered.' };
      case 'PHONE_NUMBER_ALREADY_EXISTS':
        return { phoneNumber: 'That phone number is already registered.' };
      default:
        return {};
    }
  }

  private getAuthErrorMessage(error: unknown, flow: AuthFlow): string {
    const fallbackMessage = flow === 'login'
      ? 'Login failed. Check credentials.'
      : 'Registration failed. Please review your details and try again.';

    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    if (flow === 'signup') {
      const signupFieldErrors = this.getSignupFieldErrors(error);
      const firstFieldError = Object.values(signupFieldErrors).find(Boolean);
      if (firstFieldError) {
        return firstFieldError;
      }
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
      const rawMessage = error.error.trim();
      return rawMessage.toLowerCase() === 'invalid username or password'
        ? 'Invalid username or password.'
        : rawMessage;
    }

    if (!error.error || typeof error.error !== 'object') {
      return null;
    }

    const payload = error.error as AuthErrorPayload;
    for (const key of ['error', 'message', 'detail']) {
      const value = payload[key as keyof AuthErrorPayload];
      if (typeof value === 'string' && value.trim()) {
        const trimmedValue = value.trim();
        if (trimmedValue.toLowerCase() === 'invalid username or password') {
          return 'Invalid username or password.';
        }

        return trimmedValue;
      }
    }

    return null;
  }

  private getErrorCode(error: HttpErrorResponse): string | null {
    if (!error.error || typeof error.error !== 'object') {
      return null;
    }

    const payload = error.error as AuthErrorPayload;
    return typeof payload.errorCode === 'string' && payload.errorCode.trim()
      ? payload.errorCode.trim().toUpperCase()
      : null;
  }
}

