import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QueryClient, injectQuery } from '@tanstack/angular-query-experimental';
import { AccountService } from '../../services/account.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { PortfolioQueries, REFRESH_INTERVAL_MS } from '../../services/portfolio-queries';
import { DashboardCashModalComponent, TRANSFER_DONE_MS, transferToast } from '../dashboard/dashboard-cash-modal.component';
import { TickerLogoComponent } from '../dashboard/ticker-logo.component';
import { formatCurrency } from '../dashboard/dashboard.utils';
import { MODAL_EXIT_MS, lockPageScroll, unlockPageScroll } from '../dashboard/page-scroll-lock';
import { RollingNumberComponent } from '../rolling-number.component';
import { SkeletonRowsComponent } from '../skeleton-rows.component';
import { ErrorStateComponent } from '../error-state.component';

interface AccountSummary {
  accountId: number;
  nickname: string;
  cashBalance: number;
  netWorth: number;
  // Largest positions, for the row's logo stack.
  topTickers: string[];
  positionCount: number;
}

type HttpError = { error?: { message?: string; error?: string } } | null;

const errorText = (err: unknown, fallback: string) => {
  const e = err as HttpError;
  return e?.error?.error ?? e?.error?.message ?? fallback;
};

// How long the panel takes to slide out (see .drawer in styles.css); a little longer than a centred pop-up.
const DRAWER_EXIT_MS = MODAL_EXIT_MS + 120;


// "Manage accounts": a panel that slides in from the right over the Overview, for creating, renaming, moving cash in
// and out of, and deleting trading accounts (what the old Trading accounts page did). Clicking an account opens it on
// the dashboard.
@Component({
  selector: 'app-accounts-panel',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RollingNumberComponent, SkeletonRowsComponent, ErrorStateComponent, DashboardCashModalComponent,
    TickerLogoComponent,
  ],
  templateUrl: './accounts-panel.component.html',
  styleUrl: './accounts-panel.component.css',
})
export class AccountsPanelComponent implements OnDestroy {
  readonly open = input(false);
  readonly closed = output<void>();
  readonly openAccount = output<number>();

  private readonly session = inject(SessionService);
  private readonly queries = inject(PortfolioQueries);
  private readonly queryClient = inject(QueryClient);
  private readonly accountApi = inject(AccountService);
  private readonly toasts = inject(ToastService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  private readonly userId = this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId() ?? 0;

  readonly formatCurrency = formatCurrency;
  // Content stays rendered briefly after closing so it doesn't vanish mid-slide.
  readonly rendered = signal(false);

  // Only fetched while the panel is open; both share the Overview page's cache entries, so opening it is instant.
  private readonly active = computed(() => this.rendered() && this.userId > 0);
  private readonly accountsQuery = injectQuery(() => ({
    ...this.queries.accounts(this.userId),
    enabled: this.active(),
    refetchInterval: REFRESH_INTERVAL_MS,
  }));
  // Every account's priced holdings, read through the same per-account cache entries the dashboard uses.
  private readonly holdingsQuery = injectQuery(() => {
    const accounts = this.accountsQuery.data() ?? [];
    return {
      queryKey: ['overview', this.userId, accounts.map(a => a.accountId).join(',')],
      queryFn: () => Promise.all(accounts.map(a => this.queryClient.fetchQuery(this.queries.holdings(a.accountId)))),
      enabled: this.active() && this.accountsQuery.isSuccess(),
      refetchInterval: REFRESH_INTERVAL_MS,
    };
  });

  readonly loading = computed(() => this.accountsQuery.isPending() || (this.holdingsQuery.isPending() && !!this.accountsQuery.data()?.length));
  readonly error = computed(() => {
    const err = this.accountsQuery.error() ?? this.holdingsQuery.error();
    return err ? errorText(err, 'Failed to load your accounts.') : '';
  });

  readonly accountSummaries = computed<AccountSummary[]>(() => {
    const accounts = this.accountsQuery.data() ?? [];
    const holdingsByAccount = this.holdingsQuery.data() ?? [];
    return accounts.map((account, index) => {
      const holdings = holdingsByAccount[index] ?? [];
      return {
        accountId: account.accountId,
        nickname: account.nickname,
        cashBalance: account.cashBalance,
        netWorth: account.cashBalance + holdings.reduce((sum, h) => sum + h.totalValue, 0),
        topTickers: [...holdings].sort((a, b) => b.totalValue - a.totalValue).slice(0, 3).map(h => h.ticker),
        positionCount: holdings.length,
      };
    });
  });

  // Creating an account.
  readonly creating = signal(false);
  readonly newNickname = signal('');
  readonly createBusy = signal(false);
  readonly createError = signal('');

  // Renaming or deleting one account at a time, in an editor that opens under its row.
  readonly editingId = signal<number | null>(null);
  readonly renameValue = signal('');
  readonly renameBusy = signal(false);
  readonly confirmingDelete = signal(false);
  readonly deleteConfirmText = signal('');
  readonly deleteBusy = signal(false);
  readonly editError = signal('');

  // Transfer pop-up, opened for one account at a time on top of the panel.
  readonly transferAccount = signal<AccountSummary | null>(null);
  readonly cashAmount = signal<number | null>(null);
  readonly cashLoading = signal(false);
  readonly cashError = signal('');
  readonly cashSuccess = signal('');

  // Keeps the pop-up's balance current after the account refreshes.
  readonly transferBalance = computed(() => {
    const id = this.transferAccount()?.accountId;
    return this.accountSummaries().find(a => a.accountId === id)?.cashBalance ?? 0;
  });

  private previousFocus: HTMLElement | null = null;
  private scrollLocked = false;
  private unrenderTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => open ? this.show() : this.hide());
    });
  }

  ngOnDestroy() {
    this.releaseScroll();
  }

  retry() {
    void this.accountsQuery.refetch();
    void this.holdingsQuery.refetch();
  }

  // --- Creating -------------------------------------------------------------------------------------------------

  startCreate() {
    this.cancelEdit();
    this.creating.set(true);
    this.newNickname.set('');
    this.createError.set('');
  }

  cancelCreate() {
    this.creating.set(false);
    this.createError.set('');
  }

  createAccount() {
    const nickname = this.newNickname().trim();
    if (!nickname) {
      this.createError.set('Give the account a name.');
      return;
    }
    this.createBusy.set(true);
    this.createError.set('');
    this.accountApi.createAccount(this.userId, nickname).subscribe({
      next: account => {
        this.createBusy.set(false);
        this.creating.set(false);
        this.refreshAccounts();
        this.toasts.show({ kind: 'success', title: `Created ${account.nickname ?? nickname}`, message: 'Your new trading account is ready.' });
      },
      error: err => {
        this.createBusy.set(false);
        this.createError.set(errorText(err, 'Failed to create the account.'));
      },
    });
  }

  // --- Renaming and deleting ------------------------------------------------------------------------------------

  startEdit(account: AccountSummary) {
    if (this.editingId() === account.accountId) {
      this.cancelEdit();
      return;
    }
    this.creating.set(false);
    this.editingId.set(account.accountId);
    this.renameValue.set(account.nickname);
    this.confirmingDelete.set(false);
    this.deleteConfirmText.set('');
    this.editError.set('');
  }

  cancelEdit() {
    this.editingId.set(null);
    this.confirmingDelete.set(false);
    this.editError.set('');
  }

  rename(account: AccountSummary) {
    const nickname = this.renameValue().trim();
    if (!nickname) {
      this.editError.set('Give the account a name.');
      return;
    }
    if (nickname === account.nickname) {
      this.cancelEdit();
      return;
    }
    this.renameBusy.set(true);
    this.editError.set('');
    this.accountApi.updateAccount(this.userId, account.accountId, nickname).subscribe({
      next: () => {
        this.renameBusy.set(false);
        this.cancelEdit();
        this.refreshAccounts();
        this.toasts.show({ kind: 'success', title: `Renamed to ${nickname}`, message: `Was ${account.nickname}.` });
      },
      error: err => {
        this.renameBusy.set(false);
        this.editError.set(errorText(err, 'Failed to rename the account.'));
      },
    });
  }

  askDelete() {
    this.confirmingDelete.set(true);
    this.deleteConfirmText.set('');
    this.editError.set('');
  }

  // Deleting needs the account's name typed out, as on the old Trading accounts page.
  deleteAccount(account: AccountSummary) {
    if (this.deleteConfirmText().trim() !== account.nickname) {
      this.editError.set(`Type "${account.nickname}" to confirm.`);
      return;
    }
    this.deleteBusy.set(true);
    this.editError.set('');
    this.accountApi.deleteAccount(this.userId, account.accountId).subscribe({
      next: () => {
        this.deleteBusy.set(false);
        this.cancelEdit();
        this.refreshAccounts();
        this.toasts.show({ kind: 'success', title: `Deleted ${account.nickname}` });
      },
      error: err => {
        this.deleteBusy.set(false);
        this.editError.set(errorText(err, 'Failed to delete the account.'));
      },
    });
  }

  // --- Transfers ------------------------------------------------------------------------------------------------

  openTransfer(account: AccountSummary) {
    this.cashAmount.set(null);
    this.cashError.set('');
    this.cashSuccess.set('');
    this.transferAccount.set(account);
  }

  closeTransfer() {
    this.transferAccount.set(null);
  }

  submitTransfer(direction: 'deposit' | 'withdraw') {
    const account = this.transferAccount();
    const amount = Number(this.cashAmount());
    if (!account) {
      return;
    }
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
        this.cashSuccess.set(direction === 'deposit' ? 'Deposit completed successfully.' : 'Withdrawal completed successfully.');
        this.queries.invalidateAccount(this.userId, account.accountId);
        setTimeout(() => {
          this.toasts.show(transferToast(direction, amount, account.nickname));
          if (this.transferAccount()?.accountId === account.accountId) {
            this.closeTransfer();
          }
        }, TRANSFER_DONE_MS);
      },
      error: err => {
        this.cashLoading.set(false);
        this.cashError.set(errorText(err, `Failed to ${direction} funds.`));
      },
    });
  }

  // --- Panel ----------------------------------------------------------------------------------------------------

  choose(accountId: number) {
    this.openAccount.emit(accountId);
  }

  // Clicks on the backdrop land on the <dialog> element itself; clicks inside land on its content.
  onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog()?.nativeElement) {
      this.closed.emit();
    }
  }

  // Esc fires `cancel`; let the parent clear `open` so state stays in one place.
  onCancel(event: Event) {
    event.preventDefault();
    this.closed.emit();
  }

  // The Overview and dashboard read the same accounts cache, so they pick up new, renamed and deleted accounts too.
  private refreshAccounts() {
    void this.queryClient.invalidateQueries({ queryKey: ['accounts', this.userId] });
    void this.queryClient.invalidateQueries({ queryKey: ['overview', this.userId] });
    void this.queryClient.invalidateQueries({ queryKey: ['snapshots'] });
  }

  private show() {
    const dialog = this.dialog()?.nativeElement;
    if (dialog && !dialog.open) {
      if (this.unrenderTimer) {
        clearTimeout(this.unrenderTimer);
        this.unrenderTimer = null;
      }
      this.rendered.set(true);
      this.previousFocus = document.activeElement as HTMLElement | null;
      lockPageScroll();
      this.scrollLocked = true;
      dialog.showModal();
    }
  }

  private hide() {
    const dialog = this.dialog()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
      this.unrenderTimer = setTimeout(() => {
        this.rendered.set(false);
        this.cancelEdit();
        this.creating.set(false);
      }, DRAWER_EXIT_MS);
    }
    this.releaseScroll();
    this.previousFocus?.focus();
    this.previousFocus = null;
  }

  private releaseScroll() {
    if (this.scrollLocked) {
      unlockPageScroll();
      this.scrollLocked = false;
    }
  }
}
