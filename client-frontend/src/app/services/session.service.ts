import { computed, Injectable, signal } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

export interface SessionUser {
  userId: number;
  username: string;
  email: string;
  phoneNumber?: string;
  reward_points: number;
}

export interface SessionAccount {
  account_id: number;
  user_id: number;
  nickname: string;
  cash_balance: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenStorageKey = 'tidbits_auth_token';

  authToken = signal<string | null>(localStorage.getItem(this.tokenStorageKey));
  currentUser = signal<SessionUser | null>(null);
  accounts = signal<SessionAccount[]>([]);
  selectedAccountId = signal<number>(0);
  private expiresAt: number | null = null;

  constructor() {
    this.updateExpiryFromToken(this.authToken());
  }

  readonly isAuthenticated = computed(() => this.authToken() !== null && !this.isTokenExpired());

  selectedAccount = computed(() =>
    this.accounts().find(a => a.account_id === this.selectedAccountId()) ?? null
  );

  setAuthToken(token: string) {
    this.authToken.set(token);
    localStorage.setItem(this.tokenStorageKey, token);
    this.updateExpiryFromToken(token);
  }

  private updateExpiryFromToken(token: string | null) {
    const helper = new JwtHelperService();
    const decodedToken = token ? helper.decodeToken(token) : null;
    this.expiresAt = decodedToken?.exp ? decodedToken.exp * 1000 : null;
  }

  getAuthToken() {
    return this.authToken();
  }

  getAuthenticatedUserId(): number | null {
    const token = this.authToken();
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string | number };
      const userId = Number(payload.sub);
      return Number.isInteger(userId) && userId > 0 ? userId : null;
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    if (!this.expiresAt) {
      return true;
    }
    return Date.now() > this.expiresAt;
  }

  clearAuthToken() {
    this.authToken.set(null);
    localStorage.removeItem(this.tokenStorageKey);
  }

  setCurrentUser(user: SessionUser | null) {
    this.currentUser.set(user);
  }

  setAccounts(accounts: SessionAccount[]) {
    this.accounts.set(accounts);
  }

  setSelectedAccountId(accountId: number) {
    this.selectedAccountId.set(accountId);
  }

  clearSession() {
    this.clearAuthToken();
    this.currentUser.set(null);
    this.accounts.set([]);
    this.selectedAccountId.set(0);
  }
}

