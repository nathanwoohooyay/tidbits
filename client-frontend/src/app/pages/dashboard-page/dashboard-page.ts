import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { SessionService, SessionAccount } from '../../services/session.service';
import { ChartTimeframe, TradeTarget, TrendFilter } from '../../components/dashboard/dashboard.models';
import { DashboardHeaderComponent } from '../../components/dashboard/dashboard-header.component';
import { DashboardMetricsComponent } from '../../components/dashboard/dashboard-metrics.component';
import { DashboardChartComponent } from '../../components/dashboard/dashboard-chart.component';
import { DashboardMarketSnapshotComponent } from '../../components/dashboard/dashboard-market-snapshot.component';
import { DashboardHoldingsComponent } from '../../components/dashboard/dashboard-holdings.component';
import { DashboardStockSearchComponent } from '../../components/dashboard/dashboard-stock-search.component';
import { DashboardTradeModalComponent } from '../../components/dashboard/dashboard-trade-modal.component';
import { DashboardTradeHistoryComponent } from '../../components/dashboard/dashboard-trade-history.component';
import { DashboardCashModalComponent, TRANSFER_DONE_MS, transferToast } from '../../components/dashboard/dashboard-cash-modal.component';
import { ToastService } from '../../services/toast.service';
import { AllocationBarComponent } from '../../components/dashboard/allocation-bar.component';
import { ErrorStateComponent } from '../../components/error-state.component';
import { DashboardWatchlistComponent } from '../../components/dashboard/dashboard-watchlist.component';
import { AccountDto, AccountService } from '../../services/account.service';
import { PortfolioQueries, REFRESH_INTERVAL_MS } from '../../services/portfolio-queries';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    DashboardCashModalComponent,
    AllocationBarComponent,
    DashboardHeaderComponent,
    DashboardMetricsComponent,
    DashboardChartComponent,
    DashboardMarketSnapshotComponent,
    DashboardHoldingsComponent,
    DashboardStockSearchComponent,
    DashboardTradeModalComponent,
    DashboardTradeHistoryComponent,
    ErrorStateComponent,
    DashboardWatchlistComponent,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly accountApi = inject(AccountService);
  private readonly queries = inject(PortfolioQueries);
  private readonly toasts = inject(ToastService);

  private readonly userId = this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId() ?? 0;

  cashAmount: number | null = null;
  cashLoading = false;
  cashError = '';
  cashSuccess = '';

  trendFilter = signal<TrendFilter>('trending');
  chartTimeframe = signal<ChartTimeframe>('1M');
  tradeTarget = signal<TradeTarget | null>(null);
  cashOpen = signal(false);

  // Server data. Each query refetches in the background and keeps its last result on screen meanwhile.
  private readonly userQuery = injectQuery(() => ({
    ...this.queries.user(this.userId),
    enabled: this.userId > 0,
  }));
  private readonly accountsQuery = injectQuery(() => ({
    ...this.queries.accounts(this.userId),
    enabled: this.userId > 0,
    refetchInterval: REFRESH_INTERVAL_MS,
  }));

  currentUser = computed(() => this.userQuery.data() ?? null);
  accounts = computed(() => this.accountsQuery.data() ?? []);

  // Keeps the chosen account across refetches; falls back to the session's choice, then the first account.
  selectedAccountId = linkedSignal<AccountDto[], number>({
    source: this.accounts,
    computation: (accounts, previous) => {
      const preferred = previous?.value || this.session.selectedAccountId();
      return accounts.some(account => account.accountId === preferred) ? preferred : accounts[0]?.accountId ?? 0;
    },
  });

  private readonly holdingsQuery = injectQuery(() => ({
    ...this.queries.holdings(this.selectedAccountId()),
    enabled: this.selectedAccountId() > 0,
    refetchInterval: REFRESH_INTERVAL_MS,
  }));
  private readonly ordersQuery = injectQuery(() => ({
    ...this.queries.orders(this.selectedAccountId()),
    enabled: this.selectedAccountId() > 0,
    refetchInterval: REFRESH_INTERVAL_MS,
  }));
  private readonly snapshotsQuery = injectQuery(() => ({
    ...this.queries.snapshots('account', this.selectedAccountId()),
    enabled: this.selectedAccountId() > 0,
    refetchInterval: REFRESH_INTERVAL_MS,
  }));

  selectedAccount = computed(() =>
    this.accounts().find(account => account.accountId === this.selectedAccountId()) ?? null
  );
  cashBalance = computed(() => this.selectedAccount()?.cashBalance ?? 0);
  holdings = computed(() => this.holdingsQuery.data() ?? []);
  // Until the account list arrives no account is selected, so everything that depends on it is still loading.
  private readonly accountsLoading = computed(() => this.accountsQuery.isPending() && this.userId > 0);
  holdingsLoading = computed(() => this.accountsLoading() || (this.holdingsQuery.isPending() && this.selectedAccountId() > 0));
  ordersLoading = computed(() => this.accountsLoading() || (this.ordersQuery.isPending() && this.selectedAccountId() > 0));
  chartLoading = computed(() => this.accountsLoading() || (this.snapshotsQuery.isPending() && this.selectedAccountId() > 0));
  metricsLoading = computed(() => this.holdingsLoading());
  orders = computed(() => this.ordersQuery.data() ?? []);
  chartDataPoints = computed(() => this.snapshotsQuery.data() ?? []);

  portfolioValue = computed(() => this.holdings().reduce((sum, h) => sum + h.totalValue, 0));
  // Unrealized gain in dollars: market value minus cost basis.
  portfolioGainLoss = computed(() => this.holdings().reduce((sum, h) => sum + h.changeValue, 0));
  totalNetWorth = computed(() => this.portfolioValue() + this.cashBalance());
  // Today's move: holdings' change since the previous close, as a share of yesterday's net worth.
  dayChange = computed(() => this.holdings().reduce((sum, h) => sum + h.dayChange, 0));
  dayChangePercent = computed(() => {
    const previous = this.totalNetWorth() - this.dayChange();
    return previous > 0 ? (this.dayChange() / previous) * 100 : 0;
  });

  // Shares of the stock in the trade window already held in the selected account.
  ownedQuantity = computed(() => {
    const target = this.tradeTarget();
    return (target && this.holdings().find(h => h.ticker === target.ticker)?.quantity) ?? 0;
  });

  // Holdings need live prices, so a pricing outage shows here; cached holdings stay on screen if a refetch fails.
  holdingsError = computed(() => {
    const err = this.holdingsQuery.error() as { error?: { message?: string; error?: string } } | null;
    return err && !this.holdingsQuery.data() ? err.error?.message ?? err.error?.error ?? 'Prices are unavailable right now.' : '';
  });

  loadError = computed(() => {
    const error = this.userQuery.error() ?? this.accountsQuery.error();
    const err = error as { error?: { message?: string; error?: string } } | null;
    return error ? err?.error?.message ?? err?.error?.error ?? 'Failed to load your accounts.' : '';
  });

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.session.setCurrentUser(user);
      }
    });
    effect(() => this.session.setAccounts(this.accounts().map(account => this.toSessionAccount(account))));
    effect(() => this.session.setSelectedAccountId(this.selectedAccountId()));
  }

  ngOnInit() {
    if (!this.userId) {
      void this.router.navigateByUrl('/login');
    }
  }

  retryLoad() {
    void this.userQuery.refetch();
    void this.accountsQuery.refetch();
  }

  retryHoldings() {
    void this.holdingsQuery.refetch();
  }

  setChartTimeframe(timeframe: ChartTimeframe) {
    this.chartTimeframe.set(timeframe);
  }

  setTrendFilter(filter: TrendFilter) {
    this.trendFilter.set(filter);
  }

  onAccountChange(accountId: number) {
    this.selectedAccountId.set(accountId);
    this.tradeTarget.set(null);
    this.clearCashMessages();
  }

  depositToSelectedAccount() {
    this.submitCashMovement('deposit');
  }

  withdrawFromSelectedAccount() {
    this.submitCashMovement('withdraw');
  }

  openTrade(target: TradeTarget) {
    this.tradeTarget.set({ ...target });
  }

  closeTrade() {
    this.tradeTarget.set(null);
  }

  openCash() {
    this.clearCashMessages();
    this.cashOpen.set(true);
  }

  closeCash() {
    this.cashOpen.set(false);
  }

  onTradeExecuted() {
    const accountId = this.selectedAccountId();
    if (accountId > 0) {
      this.queries.invalidateAccount(this.userId, accountId);
      // Orders settle asynchronously after placement, so check again once they've had time to fill.
      setTimeout(() => this.queries.invalidateAccount(this.userId, accountId), 4000);
    }
  }

  private submitCashMovement(direction: 'deposit' | 'withdraw') {
    const accountId = this.selectedAccountId();
    if (!accountId) {
      this.cashError = 'Select an account before moving cash.';
      this.cashSuccess = '';
      return;
    }

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
      ? this.accountApi.depositCash(accountId, amount)
      : this.accountApi.withdrawCash(accountId, amount);

    request$.subscribe({
      next: () => {
        this.cashLoading = false;
        this.cashAmount = null;
        this.cashSuccess = direction === 'deposit'
          ? 'Deposit completed successfully.'
          : 'Withdrawal completed successfully.';
        this.queries.invalidateAccount(this.userId, accountId);
        const accountName = this.selectedAccount()?.nickname ?? '';
        setTimeout(() => {
          this.toasts.show(transferToast(direction, amount, accountName));
          this.closeCash();
        }, TRANSFER_DONE_MS);
      },
      error: err => {
        this.cashLoading = false;
        this.cashError = err?.error?.error ?? err?.error?.message ?? `Failed to ${direction} funds.`;
      }
    });
  }

  private clearCashMessages() {
    this.cashAmount = null;
    this.cashError = '';
    this.cashSuccess = '';
  }

  private toSessionAccount(account: AccountDto): SessionAccount {
    return {
      account_id: account.accountId,
      user_id: account.userId,
      nickname: account.nickname,
      cash_balance: account.cashBalance,
      created_at: new Date().toISOString(),
    };
  }
}
