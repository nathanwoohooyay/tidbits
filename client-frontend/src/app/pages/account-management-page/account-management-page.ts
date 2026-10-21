import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountDto, AccountService } from '../../services/account.service';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-account-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-management-page.html',
  styleUrl: './account-management-page.css'
})
export class AccountManagementPageComponent implements OnInit {
  private readonly session = inject(SessionService);
  private readonly accountApi = inject(AccountService);
  private readonly router = inject(Router);
  private readonly userApi = inject(UserService);

  accounts: AccountDto[] = [];
  accountsLoading = false;
  accountsError = '';
  accountsSuccess = '';
  selectedManagedAccountId = this.session.selectedAccountId() || 0;
  newAccountNickname = '';
  createAccountLoading = false;
  renameNickname = '';
  renameLoading = false;
  cashAmount: number | null = null;
  cashLoading = false;
  cashError = '';
  cashSuccess = '';
  showTradingDeleteConfirm = false;
  tradingDeleteConfirmation = '';
  tradingDeleteLoading = false;
  tradingDeleteError = '';

  ngOnInit() {
    const userId = this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId();
    if (!userId) {
      void this.router.navigateByUrl('/login');
      return;
    }

    const currentUser = this.session.currentUser();
    if (currentUser) {
      this.loadAccounts();
      return;
    }

    this.userApi.getUser(userId).subscribe({
      next: user => {
        this.session.setCurrentUser(user);
        this.loadAccounts();
      },
      error: err => {
        this.accountsError = err?.error?.message ?? err?.error?.error ?? 'Failed to load your profile.';
      },
    });
  }

  get selectedManagedAccount() {
    return this.accounts.find(account => account.accountId === this.selectedManagedAccountId) ?? null;
  }

  selectManagedAccount(accountId: number) {
    this.selectedManagedAccountId = accountId;
    this.session.setSelectedAccountId(accountId);
    this.renameNickname = this.selectedManagedAccount?.nickname ?? '';
    this.cashAmount = null;
    this.cashError = '';
    this.cashSuccess = '';
    this.showTradingDeleteConfirm = false;
    this.tradingDeleteConfirmation = '';
    this.tradingDeleteError = '';

    this.loadSelectedAccount(accountId);
  }

  createTradingAccount() {
    const user = this.session.currentUser();
    if (!user) return;

    const nickname = this.newAccountNickname.trim();
    if (!nickname) {
      this.accountsError = 'Account nickname is required.';
      this.accountsSuccess = '';
      return;
    }

    this.createAccountLoading = true;
    this.accountsError = '';
    this.accountsSuccess = '';

    this.accountApi.createAccount(user.userId, nickname).subscribe({
      next: (account) => {
        this.createAccountLoading = false;
        this.newAccountNickname = '';
        this.accounts = [...this.accounts, account];
        this.syncAccountsState(this.accounts, account.accountId);
        this.accountsSuccess = 'Trading account created successfully.';
        this.loadSelectedAccount(account.accountId);
      },
      error: err => {
        this.createAccountLoading = false;
        this.accountsError = err?.error?.error ?? err?.error?.message ?? 'Failed to create trading account.';
      }
    });
  }

  renameTradingAccount() {
    const user = this.session.currentUser();
    const account = this.selectedManagedAccount;
    if (!user || !account) return;

    const nickname = this.renameNickname.trim();
    if (!nickname) {
      this.accountsError = 'Account nickname is required.';
      this.accountsSuccess = '';
      return;
    }

    this.renameLoading = true;
    this.accountsError = '';
    this.accountsSuccess = '';

    this.accountApi.updateAccount(user.userId, account.accountId, nickname).subscribe({
      next: () => {
        this.renameLoading = false;
        this.accounts = this.accounts.map(existing =>
          existing.accountId === account.accountId
            ? { ...existing, nickname }
            : existing
        );
        this.syncAccountsState(this.accounts, account.accountId);
        this.accountsSuccess = 'Trading account updated successfully.';
        this.loadSelectedAccount(account.accountId);
      },
      error: err => {
        this.renameLoading = false;
        this.accountsError = err?.error?.error ?? err?.error?.message ?? 'Failed to update trading account.';
      }
    });
  }

  depositToAccount() {
    this.submitCashMovement('deposit');
  }

  withdrawFromAccount() {
    this.submitCashMovement('withdraw');
  }

  toggleTradingDeleteConfirm() {
    this.showTradingDeleteConfirm = !this.showTradingDeleteConfirm;
    this.tradingDeleteConfirmation = '';
    this.tradingDeleteError = '';
  }

  deleteTradingAccount() {
    const user = this.session.currentUser();
    const account = this.selectedManagedAccount;
    if (!user || !account) return;

    if (this.tradingDeleteConfirmation.trim() !== account.nickname) {
      this.tradingDeleteError = 'Please type the account nickname to confirm deletion.';
      return;
    }

    this.tradingDeleteLoading = true;
    this.tradingDeleteError = '';
    this.accountsError = '';
    this.accountsSuccess = '';

    this.accountApi.deleteAccount(user.userId, account.accountId).subscribe({
      next: () => {
        this.tradingDeleteLoading = false;
        const remainingAccounts = this.accounts.filter(existing => existing.accountId !== account.accountId);
        this.syncAccountsState(remainingAccounts);
        this.showTradingDeleteConfirm = false;
        this.tradingDeleteConfirmation = '';
        this.accountsSuccess = 'Trading account deleted successfully.';
      },
      error: err => {
        this.tradingDeleteLoading = false;
        this.tradingDeleteError = err?.error?.error ?? err?.error?.message ?? 'Failed to delete trading account.';
      }
    });
  }

  goBack() {
    void this.router.navigateByUrl('/dashboard');
  }

  private loadAccounts() {
    const user = this.session.currentUser();
    if (!user) return;

    this.accountsLoading = true;
    this.accountsError = '';

    this.accountApi.listAccounts(user.userId).subscribe({
      next: (accounts) => {
        this.accountsLoading = false;
        this.syncAccountsState(accounts, this.selectedManagedAccountId || this.session.selectedAccountId());
        if (this.selectedManagedAccountId) {
          this.loadSelectedAccount(this.selectedManagedAccountId);
        }
      },
      error: err => {
        this.accountsLoading = false;
        this.accountsError = err?.error?.error ?? err?.error?.message ?? 'Failed to load trading accounts.';
      }
    });
  }

  private submitCashMovement(direction: 'deposit' | 'withdraw') {
    const account = this.selectedManagedAccount;
    if (!account) return;

    const amount = Number(this.cashAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.cashError = 'Enter a valid amount greater than zero.';
      this.cashSuccess = '';
      return;
    }

    this.cashLoading = true;
    this.cashError = '';
    this.cashSuccess = '';

    const request$ = direction === 'deposit'
      ? this.accountApi.depositCash(account.accountId, amount)
      : this.accountApi.withdrawCash(account.accountId, amount);

    request$.subscribe({
      next: () => {
        this.cashLoading = false;
        this.cashAmount = null;
        this.cashSuccess = direction === 'deposit'
          ? 'Deposit completed successfully.'
          : 'Withdrawal completed successfully.';
        this.loadSelectedAccount(account.accountId);
      },
      error: err => {
        this.cashLoading = false;
        this.cashError = err?.error?.error ?? err?.error?.message ?? `Failed to ${direction} funds.`;
      }
    });
  }

  private loadSelectedAccount(accountId: number) {
    const user = this.session.currentUser();
    if (!user || !accountId) return;

    this.accountApi.getAccount(user.userId, accountId).subscribe({
      next: (account) => {
        const existingIndex = this.accounts.findIndex(existing => existing.accountId === account.accountId);
        const nextAccounts = existingIndex >= 0
          ? this.accounts.map(existing => existing.accountId === account.accountId ? account : existing)
          : [...this.accounts, account];

        this.syncAccountsState(nextAccounts, account.accountId);
      },
      error: err => {
        this.accountsError = err?.error?.error ?? err?.error?.message ?? 'Failed to load the selected trading account.';
      }
    });
  }

  private syncAccountsState(accounts: AccountDto[], preferredAccountId?: number) {
    this.accounts = accounts;

    this.session.setAccounts(accounts.map(account => this.toSessionAccount(account)));

    const nextAccountId = accounts.some(account => account.accountId === preferredAccountId)
      ? preferredAccountId ?? 0
      : accounts[0]?.accountId ?? 0;

    this.selectedManagedAccountId = nextAccountId;
    this.session.setSelectedAccountId(nextAccountId);
    this.renameNickname = this.selectedManagedAccount?.nickname ?? '';

    if (!accounts.length) {
      this.cashAmount = null;
      this.showTradingDeleteConfirm = false;
      this.tradingDeleteConfirmation = '';
      this.tradingDeleteError = '';
    }
  }

  private toSessionAccount(account: AccountDto) {
    return {
      account_id: account.accountId,
      user_id: account.userId,
      nickname: account.nickname,
      cash_balance: account.cashBalance,
      created_at: new Date().toISOString(),
    };
  }
}

