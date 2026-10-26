import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QueryClient, injectQuery } from '@tanstack/angular-query-experimental';
import { SessionService } from '../../services/session.service';
import { AccountService, PortfolioSnapshotDto } from '../../services/account.service';
import { DashboardChartComponent } from '../../components/dashboard/dashboard-chart.component';
import { ChartTimeframe } from '../../components/dashboard/dashboard.models';
import { DashboardHeaderComponent } from '../../components/dashboard/dashboard-header.component';
import { DashboardCashModalComponent, TRANSFER_DONE_MS, transferToast } from '../../components/dashboard/dashboard-cash-modal.component';
import { ToastService } from '../../services/toast.service';
import { AllocationBarComponent } from '../../components/dashboard/allocation-bar.component';
import { TickerLogoComponent } from '../../components/dashboard/ticker-logo.component';
import { TrendLineComponent } from '../../components/dashboard/trend-line.component';
import { formatCurrency, formatPercent } from '../../components/dashboard/dashboard.utils';
import { RollingNumberComponent } from '../../components/rolling-number.component';
import { SkeletonRowsComponent } from '../../components/skeleton-rows.component';
import { ChartSkeletonComponent } from '../../components/dashboard/chart-skeleton.component';
import { ErrorStateComponent } from '../../components/error-state.component';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { AccountsPanelComponent } from '../../components/accounts-panel/accounts-panel.component';
import {
  HoldingDTO, PortfolioQueries, REFRESH_INTERVAL_MS, aggregateSnapshotsByDay, snapshotSeriesByAccount
} from '../../services/portfolio-queries';

interface AccountSummary {
  accountId: number;
  nickname: string;
  cashBalance: number;
  portfolioValue: number;
  portfolioChangePct: number;
  netWorth: number;
  dayChange: number;
  dayChangePct: number;
  // Largest positions, for the row's logo stack.
  topTickers: string[];
  positionCount: number;
  trend: number[];
}

type HttpError = { error?: { message?: string; error?: string } } | null;

// Today's move as a share of yesterday's value.
const dayPercent = (change: number, current: number) => {
  const previous = current - change;
  return previous > 0 ? (change / previous) * 100 : 0;
};

@Component({
  standalone: true,
  imports: [
    CommonModule, RollingNumberComponent, SkeletonRowsComponent, ChartSkeletonComponent, ErrorStateComponent, DashboardChartComponent, DashboardHeaderComponent, DashboardCashModalComponent,
    AllocationBarComponent, TickerLogoComponent, TrendLineComponent, RouterLink, AccountsPanelComponent, NotificationBellComponent],
  selector: 'app-maindashboard',
  styleUrl: './maindashboard.css',
  templateUrl: './maindashboard.html',
})
export class Maindashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly queries = inject(PortfolioQueries);
  private readonly queryClient = inject(QueryClient);
  private readonly accountApi = inject(AccountService);

  private readonly userId = this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId() ?? 0;

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;
  readonly Math = Math;
  readonly chartTimeframe = signal<ChartTimeframe>('1M');

  private readonly userQuery = injectQuery(() => ({
    ...this.queries.user(this.userId),
    enabled: this.userId > 0,
  }));
  private readonly accountsQuery = injectQuery(() => ({
    ...this.queries.accounts(this.userId),
    enabled: this.userId > 0,
    refetchInterval: REFRESH_INTERVAL_MS,
  }));
  // Every account's priced holdings, read through the same per-account cache entries the dashboard uses.
  private readonly holdingsQuery = injectQuery(() => {
    const accounts = this.accountsQuery.data() ?? [];
    return {
      queryKey: ['overview', this.userId, accounts.map(a => a.accountId).join(',')],
      queryFn: () => Promise.all(accounts.map(a => this.queryClient.fetchQuery(this.queries.holdings(a.accountId)))),
      enabled: this.accountsQuery.isSuccess(),
      refetchInterval: REFRESH_INTERVAL_MS,
    };
  });
  // One snapshot request feeds both the combined chart and each account's 30-day trend line.
  private readonly chartQuery = injectQuery(() => ({
    ...this.queries.userSnapshotsRaw(this.userId),
    enabled: this.userId > 0,
    refetchInterval: REFRESH_INTERVAL_MS,
    select: (snapshots: PortfolioSnapshotDto[]) => aggregateSnapshotsByDay(snapshots),
  }));
  private readonly trendQuery = injectQuery(() => ({
    ...this.queries.userSnapshotsRaw(this.userId),
    enabled: this.userId > 0,
    refetchInterval: REFRESH_INTERVAL_MS,
    select: (snapshots: PortfolioSnapshotDto[]) => snapshotSeriesByAccount(snapshots, 30),
  }));

  // Only the very first load shows a loading state; later refreshes swap data in place.
  readonly loading = computed(() => this.accountsQuery.isPending() || (this.holdingsQuery.isPending() && !!this.accountsQuery.data()?.length));
  readonly error = computed(() => {
    const err = (this.accountsQuery.error() ?? this.holdingsQuery.error()) as HttpError;
    return err ? err.error?.message ?? err.error?.error ?? 'Failed to load your portfolio.' : '';
  });

  readonly accountSummaries = computed<AccountSummary[]>(() => {
    const accounts = this.accountsQuery.data() ?? [];
    const holdingsByAccount = this.holdingsQuery.data() ?? [];
    const trends = this.trendQuery.data() ?? new Map<number, number[]>();
    return accounts.map((account, index) => {
      const holdings = holdingsByAccount[index] ?? [];
      const value = holdings.reduce((sum, h) => sum + h.totalValue, 0);
      const invested = holdings.reduce((sum, h) => sum + h.amount_invested, 0);
      const dayChange = holdings.reduce((sum, h) => sum + h.dayChange, 0);
      const netWorth = account.cashBalance + value;
      return {
        accountId: account.accountId,
        nickname: account.nickname,
        cashBalance: account.cashBalance,
        portfolioValue: value,
        portfolioChangePct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
        netWorth,
        dayChange,
        dayChangePct: dayPercent(dayChange, netWorth),
        topTickers: [...holdings].sort((a, b) => b.totalValue - a.totalValue).slice(0, 3).map(h => h.ticker),
        positionCount: holdings.length,
        trend: trends.get(account.accountId) ?? [],
      };
    });
  });

  readonly totalCashBalance = computed(() => this.accountSummaries().reduce((sum, a) => sum + a.cashBalance, 0));
  readonly totalPortfolioValue = computed(() => this.accountSummaries().reduce((sum, a) => sum + a.portfolioValue, 0));
  readonly totalPortfolioChangePct = computed(() => {
    const holdings = (this.holdingsQuery.data() ?? []).flat();
    const invested = holdings.reduce((sum, h) => sum + h.amount_invested, 0);
    return invested > 0 ? ((this.totalPortfolioValue() - invested) / invested) * 100 : 0;
  });
  readonly totalNetWorth = computed(() => this.totalCashBalance() + this.totalPortfolioValue());
  readonly totalDayChange = computed(() => this.accountSummaries().reduce((sum, a) => sum + a.dayChange, 0));
  readonly totalDayChangePct = computed(() => dayPercent(this.totalDayChange(), this.totalNetWorth()));

  // The same stock held in several accounts counts as one position in the combined allocation.
  readonly combinedHoldings = computed<HoldingDTO[]>(() => {
    const byTicker = new Map<string, HoldingDTO>();
    for (const h of (this.holdingsQuery.data() ?? []).flat()) {
      const existing = byTicker.get(h.ticker);
      byTicker.set(h.ticker, existing
        ? { ...existing, quantity: existing.quantity + h.quantity, totalValue: existing.totalValue + h.totalValue, amount_invested: existing.amount_invested + h.amount_invested, changeValue: existing.changeValue + h.changeValue, dayChange: existing.dayChange + h.dayChange }
        : { ...h });
    }
    return [...byTicker.values()];
  });

  readonly portfolioSnapshotPoints = computed(() => this.chartQuery.data() ?? []);
  readonly chartLoading = computed(() => this.chartQuery.isPending() && this.userId > 0);

  // The "Manage accounts" panel (create, rename, fund, delete) that slides in from the right.
  readonly manageOpen = signal(false);

  // Transfer pop-up, opened for one account at a time.
  readonly transferAccount = signal<AccountSummary | null>(null);
  readonly cashAmount = signal<number | null>(null);
  readonly cashLoading = signal(false);
  readonly cashError = signal('');
  readonly cashSuccess = signal('');
  private readonly toasts = inject(ToastService);

  constructor() {
    effect(() => {
      const user = this.userQuery.data();
      if (user) {
        this.session.setCurrentUser(user);
      }
    });
  }

  ngOnInit() {
    if (!this.userId) {
      void this.router.navigateByUrl('/login');
    }
  }

  openAccountDashboard(accountId: number) {
    this.session.setSelectedAccountId(accountId);
    void this.router.navigateByUrl('/dashboard');
  }

  retry() {
    void this.accountsQuery.refetch();
    void this.holdingsQuery.refetch();
  }

  setChartTimeframe(timeframe: ChartTimeframe) {
    this.chartTimeframe.set(timeframe);
  }

  openTransfer(account: AccountSummary) {
    this.cashAmount.set(null);
    this.cashError.set('');
    this.cashSuccess.set('');
    this.transferAccount.set(account);
  }

  closeTransfer() {
    this.transferAccount.set(null);
  }

  // Keeps the pop-up's balance current after the account refreshes.
  readonly transferBalance = computed(() => {
    const id = this.transferAccount()?.accountId;
    return this.accountSummaries().find(a => a.accountId === id)?.cashBalance ?? 0;
  });

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
        this.cashError.set(err?.error?.error ?? err?.error?.message ?? `Failed to ${direction} funds.`);
      },
    });
  }
}
