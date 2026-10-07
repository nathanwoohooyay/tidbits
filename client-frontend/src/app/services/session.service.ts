import { computed, Injectable, signal } from '@angular/core';

export interface SessionUser {
  user_id: number;
  username: string;
  email: string;
  role_id: number;
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

  readonly isAuthenticated = computed(() => this.authToken() !== null);

  selectedAccount = computed(() =>
    this.accounts().find(a => a.account_id === this.selectedAccountId()) ?? null
  );

  setAuthToken(token: string) {
    this.authToken.set(token);
    localStorage.setItem(this.tokenStorageKey, token);
  }

  getAuthToken() {
    return this.authToken();
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

