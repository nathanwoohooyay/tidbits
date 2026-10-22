import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal, viewChild, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, interval } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionService } from '../../services/session.service';
import { getMockDashboardData } from '../../components/dashboard/dashboard.mock-data';
import {
  ChartPoint,
  DashboardNotices,
  Instrument,
  Order,
  QuickTradeSelection,
  ThemeMode,
  TrendFilter,
} from '../../components/dashboard/dashboard.models';
import { DashboardHeaderComponent } from '../../components/dashboard/dashboard-header.component';
import { DashboardGreetingComponent } from '../../components/dashboard/dashboard-greeting.component';
import { DashboardNoticesComponent } from '../../components/dashboard/dashboard-notices.component';
import { DashboardMetricsComponent } from '../../components/dashboard/dashboard-metrics.component';
import { DashboardInsightFeedComponent } from '../../components/dashboard/dashboard-insight-feed.component';
import { DashboardChartComponent } from '../../components/dashboard/dashboard-chart.component';
import { DashboardMarketSnapshotComponent } from '../../components/dashboard/dashboard-market-snapshot.component';
import { DashboardHoldingsComponent } from '../../components/dashboard/dashboard-holdings.component';
import { DashboardTradeDeskComponent } from '../../components/dashboard/dashboard-trade-desk.component';
import { DashboardTradeHistoryComponent } from '../../components/dashboard/dashboard-trade-history.component';
import { DashboardCashPanelComponent } from '../../components/dashboard/dashboard-cash-panel.component';
import {UserDTO, UserService} from '../../services/user.service';
import {AccountDto, AccountHoldingDto, AccountService, PortfolioSnapshotDto} from '../../services/account.service';
import { SessionAccount } from '../../services/session.service';
import { OrderService, placedOrderDTO } from '../../services/order.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    DashboardCashPanelComponent,
    DashboardHeaderComponent,
    DashboardGreetingComponent,
    DashboardNoticesComponent,
    DashboardMetricsComponent,
    DashboardInsightFeedComponent,
    DashboardChartComponent,
    DashboardMarketSnapshotComponent,
    DashboardHoldingsComponent,
    DashboardTradeDeskComponent,
    DashboardTradeHistoryComponent,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPageComponent implements OnInit {
  readonly today = new Date();

  readonly tradeHistoryRef = viewChild(DashboardTradeHistoryComponent);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly accountApi = inject(AccountService);
  private readonly orderApi = inject(OrderService);
  private readonly themeStorageKey = 'tidbits_theme_mode';
  private readonly mockData = getMockDashboardData();
  private readonly marketSnapshotSymbols = ['AAPL', 'MSFT'];
  private readonly userService = inject(UserService);

  private readonly destroyRef = inject(DestroyRef);

  currentUser = signal<UserDTO | null>(null);
  cashAmount: number | null = null;
  cashLoading = false;
  cashError = '';
  cashSuccess = '';

  accounts = signal<AccountDto[]>([]);
  selectedAccountId = signal(0);
  instruments = signal<Instrument[]>([]);
  ordersByAccount = signal<Record<number, Order[]>>({});
  reportingOverview = signal(this.mockData.reportingOverview);
  usingPlaceholderMarketData = signal(false);
  themeMode = signal<ThemeMode>('light');
  trendFilter = signal<TrendFilter>('trending');
  chartTimeframe = signal<'1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  quickTradeSelection = signal<QuickTradeSelection | null>(null);
  holdingsRefreshToken = signal(0);
  portfolioValue = signal(0);
  portfolioChange = signal(0);
  portfolioSnapshotPoints = signal<ChartPoint[]>([]);

  selectedAccount = computed(() =>
    this.accounts().find(account => account.accountId === this.selectedAccountId()) ?? null
  );

  // orders = computed(() => this.ordersByAccount()[this.selectedAccountId()] ?? []);
  cashBalance = computed(() => this.selectedAccount()?.cashBalance ?? 0);

  totalNetWorth = computed(() => this.portfolioValue() + this.cashBalance());

  chartDataPoints = computed(() => this.portfolioSnapshotPoints());
  instrumentLabels = computed(() =>
    Object.fromEntries(this.instruments().map(instrument => [instrument.instrument_id, instrument.ticker])) as Record<number, string>
  );

  // notices = computed<DashboardNotices>(() => ({
  //   marketNotice: 'Market prices are loaded from the pricing service.',
  //   holdingsNotice: this.holdings().length === 0 ? 'No holdings were returned for this sample account yet.' : '',
  //   ordersNotice: this.orders().length === 0 ? 'No orders were returned for this sample account yet.' : '',
  //   accountNotice: '',
  //   reportingNotice: this.reportingOverview() ? '' : 'Reporting insight feed is temporarily unavailable.',
  // }));

setPortfolioValue(value: number) {
    this.portfolioValue.set(value);
  }

  setPortfolioChange(value: number) {
    this.portfolioChange.set(value);
  }

  ngOnInit() {
    this.restoreThemePreference();
    const authenticatedUserId = this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId();
    if (!authenticatedUserId) {
      void this.router.navigateByUrl('/login');
      return;
    }

    this.userService.getUser(authenticatedUserId).subscribe({
      next: user => {
        this.currentUser.set(user);
        this.session.setCurrentUser(user);
        this.loadAccounts(user.userId);
        this.startPolling();
      },
      error: err => {
        this.cashError = err?.error?.message ?? err?.error?.error ?? 'Failed to load your profile.';
      },
    });
  }

  toggleTheme() {
    const nextMode = this.themeMode() === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextMode);
  }

  setChartTimeframe(timeframe: '1W' | '1M' | '3M' | '1Y' | 'ALL') {
    this.chartTimeframe.set(timeframe);
  }

  setTrendFilter(filter: TrendFilter) {
    this.trendFilter.set(filter);
  }

  onAccountChange(accountId: number) {
    this.selectedAccountId.set(accountId);
    this.session.setSelectedAccountId(accountId);

    const userId = this.currentUser()?.userId ?? this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId();
    if (userId) {
      this.loadPortfolioSnapshotChart(userId, accountId || null);
    }

    this.quickTradeSelection.set(null);
    this.clearCashMessages();
  }

  depositToSelectedAccount() {
    this.submitCashMovement('deposit');
  }

  withdrawFromSelectedAccount() {
    this.submitCashMovement('withdraw');
  }

  onQuickTrade(selection: QuickTradeSelection) {
    this.quickTradeSelection.set(selection);
    setTimeout(() => document.getElementById('trade-section')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  onTradeExecuted(execution: placedOrderDTO) {
    const tradeHistory = this.tradeHistoryRef();
    if (tradeHistory) {
      const placedOrder: placedOrderDTO = {
        ...execution,
        status: 'PLACED',
      };
      tradeHistory.ordersArray.update(existing => [placedOrder, ...existing]);
      tradeHistory.setDateSort('desc');
    }

    const accountId = this.selectedAccountId();
    if (accountId > 0) {
      this.refreshSelectedAccount(accountId);
    }
  }

    private startPolling() {
        console.log("\nStarting polling");
      interval(30_000).pipe(
        startWith(0),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        const accountId = this.selectedAccountId();
        if (accountId > 0) {
          this.refreshData(accountId);
        }
      });
    }
  refreshData(accountId: number){
      console.log("\nRefreshing data for accountId:", accountId);
      this.holdingsRefreshToken.update(token => token + 1);
      this.refreshSelectedAccount(accountId);
      const userId = this.currentUser()?.userId ?? this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId();
      if (userId) {
        this.loadPortfolioSnapshotChart(userId, accountId || null);
      }
      const tradeHistory = this.tradeHistoryRef();
      if (tradeHistory) {
        tradeHistory.loadHistory(accountId);
        }

  }

  goToAccount() {
    void this.router.navigateByUrl('/account');
  }

  goToAccountManagement() {
    void this.router.navigateByUrl('/account-management');
  }

  signOut() {
    this.session.clearSession();
    void this.router.navigateByUrl('/login');
  }

  private restoreThemePreference() {
    const saved = localStorage.getItem(this.themeStorageKey);
    const mode = saved === 'dark' ? 'dark' : 'light';
    this.applyTheme(mode);
  }

  private applyTheme(mode: ThemeMode) {
    this.themeMode.set(mode);
    localStorage.setItem(this.themeStorageKey, mode);
    document.body.classList.toggle('dark-mode', mode === 'dark');
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
        this.refreshSelectedAccount(accountId);
      },
      error: err => {
        this.cashLoading = false;
        this.cashError = err?.error?.error ?? err?.error?.message ?? `Failed to ${direction} funds.`;
      }
    });
  }

  private refreshSelectedAccount(accountId: number) {
    const userId = this.currentUser()?.userId
      ?? this.session.currentUser()?.userId
      ?? this.session.getAuthenticatedUserId();

    if (!userId) {
      this.cashError = 'Your session has expired. Please sign in again.';
      return;
    }

    this.accountApi.getAccount(userId, accountId).subscribe({
      next: account => {
        this.accounts.update(accounts => {
          const nextAccount = account;
          const existingIndex = accounts.findIndex(existing => existing.accountId === nextAccount.accountId);

          if (existingIndex >= 0) {
            return accounts.map(existing =>
              existing.accountId === nextAccount.accountId ? nextAccount : existing
            );
          }

          return [...accounts, nextAccount];
        });

        this.syncSessionAccounts();
        this.selectedAccountId.set(account.accountId);
        this.session.setSelectedAccountId(account.accountId);
      },
      error: err => {
        this.cashError = err?.error?.error ?? err?.error?.message ?? 'Failed to refresh account balance.';
      }
    });
  }

  private clearCashMessages() {
    this.cashAmount = null;
    this.cashError = '';
    this.cashSuccess = '';
  }

  private loadAccounts(userId: number) {
    const preferredAccountId = this.session.selectedAccountId();

    this.accountApi.listAccounts(userId).subscribe({
      next: accounts => {
        this.accounts.set(accounts);

        const nextAccountId = accounts.some(account => account.accountId === preferredAccountId)
          ? preferredAccountId
          : accounts[0]?.accountId ?? 0;

        this.selectedAccountId.set(nextAccountId);
        this.session.setAccounts(accounts.map(account => this.toSessionAccount(account)));
        this.session.setSelectedAccountId(nextAccountId);
        this.loadPortfolioSnapshotChart(userId, nextAccountId || null);
        this.calculateOrderOverview(accounts);
      },
      error: err => {
        this.accounts.set([]);
        this.selectedAccountId.set(0);
        this.session.setAccounts([]);
        this.session.setSelectedAccountId(0);
        this.cashError = err?.error?.message ?? err?.error?.error ?? 'Failed to load your accounts.';
      },
    });
  }

  private calculateOrderOverview(accounts: AccountDto[]) {
    if (!accounts.length) {
      this.ordersByAccount.set({});
      this.updateReportingOrderCounts([]);
      return;
    }

    forkJoin(accounts.map(account => this.orderApi.getOrders(account.accountId))).subscribe({
      next: orderLists => {
        const allOrders = orderLists.flat();
        this.updateReportingOrderCounts(allOrders);

        const ordersByAccount = Object.fromEntries(
          accounts.map((account, index) => [
            account.accountId,
            orderLists[index].map(order => this.toDashboardOrder(account.accountId, order)),
          ])
        );
        this.ordersByAccount.set(ordersByAccount);
      },
      error: err => {
        this.ordersByAccount.set({});
        this.updateReportingOrderCounts([]);
        this.cashError = err?.error?.message ?? err?.error?.error ?? 'Failed to load your order history.';
      },
    });
  }

  private updateReportingOrderCounts(orders: placedOrderDTO[]) {
    const volumeBySide = ['buy', 'sell'].map(side => {
      const sideOrders = orders.filter(order => order.orderType.toLowerCase() === side);

      return {
        side,
        total_value: sideOrders.reduce((total, order) => total + order.quantity * order.price, 0),
        order_count: sideOrders.length,
      };
    }).filter(item => item.order_count > 0);

    this.reportingOverview.update(overview => ({
      ...overview,
      generatedAt: new Date().toISOString(),
      liveSummary: {
        ...overview.liveSummary,
        totalOrders: orders.length,
        filledOrders: orders.filter(order => order.status.toLowerCase() === 'filled').length,
        placedOrders: orders.filter(order => order.status.toLowerCase() === 'placed').length,
      },
      offlineMetrics: {
        ...overview.offlineMetrics,
        data: {
          ...overview.offlineMetrics.data,
          trade_volume_by_side: volumeBySide,
        },
      },
    }));
  }

  private toDashboardOrder(accountId: number, order: placedOrderDTO): Order {
    return {
      order_id: order.orderId,
      account_id: accountId,
      instrument_id: order.instrument.instrumentId,
      quantity: order.quantity,
      stock_price: order.price,
      order_type: order.orderType.toLowerCase(),
      status: order.status.toLowerCase(),
      ticker: order.instrument.ticker,
      name: order.instrument.name,
      created_at: order.statusHistory[0]?.changedAt ?? new Date().toISOString(),
    };
  }


  private syncSessionAccounts() {
    this.session.setAccounts(this.accounts().map(account => this.toSessionAccount(account)));
  }

  private toAccountDto(account: {
    account_id: number;
    user_id: number;
    nickname: string;
    cash_balance: number;
  }): AccountDto {
    return {
      accountId: account.account_id,
      userId: account.user_id,
      nickname: account.nickname,
      cashBalance: account.cash_balance,
    };
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

  private loadPortfolioSnapshotChart(userId: number, accountId: number | null = null) {
    const request$ = accountId
      ? this.accountApi.listPortfolioSnapshotsByAccount(accountId)
      : this.accountApi.listPortfolioSnapshotsByUser(userId);

    request$.subscribe({
      next: snapshots => {
        this.portfolioSnapshotPoints.set(this.aggregateSnapshotsByDay(snapshots));
      },
      error: err => {
        this.portfolioSnapshotPoints.set([]);
        this.cashError = err?.error?.message ?? err?.error?.error ?? 'Failed to load portfolio history.';
      },
    });
  }

  private aggregateSnapshotsByDay(snapshots: PortfolioSnapshotDto[]): ChartPoint[] {
    const latestByAccountDay = new Map<string, PortfolioSnapshotDto>();
    const totalsByDay = new Map<string, number>();

    for (const snapshot of snapshots) {
      const day = snapshot.createdAt?.slice(0, 10);
      if (!day || !Number.isFinite(snapshot.totalValue)) {
        continue;
      }

      const accountDayKey = `${snapshot.accountId}:${day}`;
      const current = latestByAccountDay.get(accountDayKey);

      if (!current || snapshot.createdAt > current.createdAt) {
        latestByAccountDay.set(accountDayKey, snapshot);
      }
    }

    for (const snapshot of latestByAccountDay.values()) {
      const day = snapshot.createdAt.slice(0, 10);
      totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + snapshot.totalValue);
    }

    return Array.from(totalsByDay.entries())
      .sort(([leftDay], [rightDay]) => leftDay.localeCompare(rightDay))
      .map(([day, totalValue]) => ({
        date: `${day}T00:00:00`,
        value: Number(totalValue.toFixed(2)),
      }));
  }

}

