import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}

