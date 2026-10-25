import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { AccountDto, AccountService } from '../../services/account.service';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { DashboardHeaderComponent } from '../../components/dashboard/dashboard-header.component';

@Component({
  selector: 'app-account-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardHeaderComponent],
  templateUrl: './account-management-page.html',
  styleUrl: './account-management-page.css'
})
export class AccountManagementPageComponent implements OnInit {
  private readonly session = inject(SessionService);
  private readonly accountApi = inject(AccountService);
  private readonly router = inject(Router);
  private readonly userApi = inject(UserService);

  accounts = signal<AccountDto[]>([]);
  accountsLoading = signal(false);
  accountsError = signal('');
  accountsSuccess = signal('');
  selectedManagedAccountId = signal(this.session.selectedAccountId() || 0);
  newAccountNickname = signal('');
  createAccountLoading = signal(false);
  renameNickname = signal('');
  renameLoading = signal(false);
  cashAmount = signal<number | null>(null);
  cashLoading = signal(false);
  cashError = signal('');
  cashSuccess = signal('');
  showTradingDeleteConfirm = signal(false);
  tradingDeleteConfirmation = signal('');
  tradingDeleteLoading = signal(false);
  tradingDeleteError = signal('');

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
        this.accountsError.set(err?.error?.message ?? err?.error?.error ?? 'Failed to load your profile.');
      },
    });
  }

  get selectedManagedAccount() {
    return this.accounts().find(account => account.accountId === this.selectedManagedAccountId()) ?? null;
  }

  selectManagedAccount(accountId: number) {
    this.selectedManagedAccountId.set(accountId);
    this.session.setSelectedAccountId(accountId);
    this.renameNickname.set(this.selectedManagedAccount?.nickname ?? '');
    this.cashAmount.set(null);
    this.cashError.set('');
    this.cashSuccess.set('');
    this.showTradingDeleteConfirm.set(false);
    this.tradingDeleteConfirmation.set('');
    this.tradingDeleteError.set('');

    this.loadSelectedAccount(accountId);
  }

  createTradingAccount() {
    const user = this.session.currentUser();
    if (!user) return;

    const nickname = this.newAccountNickname().trim();
    if (!nickname) {
      this.accountsError.set('Account nickname is required.');
      this.accountsSuccess.set('');
      return;
    }

    this.createAccountLoading.set(true);
    this.accountsError.set('');
    this.accountsSuccess.set('');

    this.accountApi.createAccount(user.userId, nickname).subscribe({
      next: (account) => {
        this.createAccountLoading.set(false);
        this.newAccountNickname.set('');
        const nextAccounts = [...this.accounts(), account];
        this.syncAccountsState(nextAccounts, account.accountId);
        this.accountsSuccess.set('Trading account created successfully.');
        this.loadSelectedAccount(account.accountId);
      },
      error: err => {
        this.createAccountLoading.set(false);
        this.accountsError.set(err?.error?.error ?? err?.error?.message ?? 'Failed to create trading account.');
      }
    });
  }

  renameTradingAccount() {
    const user = this.session.currentUser();
    const account = this.selectedManagedAccount;
    if (!user || !account) return;

    const nickname = this.renameNickname().trim();
    if (!nickname) {
      this.accountsError.set('Account nickname is required.');
      this.accountsSuccess.set('');
      return;
    }

    this.renameLoading.set(true);
    this.accountsError.set('');
    this.accountsSuccess.set('');

    this.accountApi.updateAccount(user.userId, account.accountId, nickname).subscribe({
      next: () => {
        this.renameLoading.set(false);
        const nextAccounts = this.accounts().map(existing =>
          existing.accountId === account.accountId
            ? { ...existing, nickname }
            : existing
        );
        this.syncAccountsState(nextAccounts, account.accountId);
        this.accountsSuccess.set('Trading account updated successfully.');
        this.loadSelectedAccount(account.accountId);
      },
      error: err => {
        this.renameLoading.set(false);
        this.accountsError.set(err?.error?.error ?? err?.error?.message ?? 'Failed to update trading account.');
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
    this.showTradingDeleteConfirm.update(v => !v);
    this.tradingDeleteConfirmation.set('');
    this.tradingDeleteError.set('');
  }

  deleteTradingAccount() {
    const user = this.session.currentUser();
    const account = this.selectedManagedAccount;
    if (!user || !account) return;

    if (this.tradingDeleteConfirmation().trim() !== account.nickname) {
      this.tradingDeleteError.set('Please type the account nickname to confirm deletion.');
      return;
    }

    this.tradingDeleteLoading.set(true);
    this.tradingDeleteError.set('');
    this.accountsError.set('');
    this.accountsSuccess.set('');

    this.accountApi.deleteAccount(user.userId, account.accountId).subscribe({
      next: () => {
        this.tradingDeleteLoading.set(false);
        const remainingAccounts = this.accounts().filter(existing => existing.accountId !== account.accountId);
        this.syncAccountsState(remainingAccounts);
        this.showTradingDeleteConfirm.set(false);
        this.tradingDeleteConfirmation.set('');
        this.accountsSuccess.set('Trading account deleted successfully.');
      },
      error: err => {
        this.tradingDeleteLoading.set(false);
        this.tradingDeleteError.set(err?.error?.error ?? err?.error?.message ?? 'Failed to delete trading account.');
      }
    });
  }

  goBack() {
    void this.router.navigateByUrl('/dashboard');
  }

  private loadAccounts() {
    const user = this.session.currentUser();
    if (!user) return;

    this.accountsLoading.set(true);
    this.accountsError.set('');

    this.accountApi.listAccounts(user.userId).subscribe({
      next: (accounts) => {
        this.accountsLoading.set(false);
        this.syncAccountsState(accounts, this.selectedManagedAccountId() || this.session.selectedAccountId());
        if (this.selectedManagedAccountId()) {
          this.loadSelectedAccount(this.selectedManagedAccountId());
        }
      },
      error: err => {
        this.accountsLoading.set(false);
        this.accountsError.set(err?.error?.error ?? err?.error?.message ?? 'Failed to load trading accounts.');
      }
    });
  }

  private submitCashMovement(direction: 'deposit' | 'withdraw') {
    const account = this.selectedManagedAccount;
    if (!account) return;

    const amount = Number(this.cashAmount());
    if (!Number.isFinite(amount) || amount <= 0) {
      this.cashError.set('Enter a valid amount greater than zero.');
      this.cashSuccess.set('');
      return;
    }

    this.cashLoading.set(true);
    this.cashError.set('');
    this.cashSuccess.set('');

    const request$ = direction === 'deposit'
      ? this.accountApi.depositCash(account.accountId, amount)
      : this.accountApi.withdrawCash(account.accountId, amount);

    request$.subscribe({
      next: () => {
        this.cashLoading.set(false);
        this.cashAmount.set(null);
        this.cashSuccess.set(direction === 'deposit'
          ? 'Deposit completed successfully.'
          : 'Withdrawal completed successfully.');
        this.loadSelectedAccount(account.accountId);
      },
      error: err => {
        this.cashLoading.set(false);
        this.cashError.set(err?.error?.error ?? err?.error?.message ?? `Failed to ${direction} funds.`);
      }
    });
  }

  private loadSelectedAccount(accountId: number) {
    const user = this.session.currentUser();
    if (!user || !accountId) return;

    this.accountApi.getAccount(user.userId, accountId).subscribe({
      next: (account) => {
        const existingIndex = this.accounts().findIndex(existing => existing.accountId === account.accountId);
        const nextAccounts = existingIndex >= 0
          ? this.accounts().map(existing => existing.accountId === account.accountId ? account : existing)
          : [...this.accounts(), account];

        this.syncAccountsState(nextAccounts, account.accountId);
      },
      error: err => {
        this.accountsError.set(err?.error?.error ?? err?.error?.message ?? 'Failed to load the selected trading account.');
      }
    });
  }

  private syncAccountsState(accounts: AccountDto[], preferredAccountId?: number) {
    this.accounts.set(accounts);

    this.session.setAccounts(accounts.map(account => this.toSessionAccount(account)));

    const nextAccountId = accounts.some(account => account.accountId === preferredAccountId)
      ? preferredAccountId ?? 0
      : accounts[0]?.accountId ?? 0;

    this.selectedManagedAccountId.set(nextAccountId);
    this.session.setSelectedAccountId(nextAccountId);
    this.renameNickname.set(this.selectedManagedAccount?.nickname ?? '');

    if (!accounts.length) {
      this.cashAmount.set(null);
      this.showTradingDeleteConfirm.set(false);
      this.tradingDeleteConfirmation.set('');
      this.tradingDeleteError.set('');
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

