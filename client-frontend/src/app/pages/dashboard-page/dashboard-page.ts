import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SessionService } from '../../services/session.service';
import { buildMockChartData, getMockDashboardData } from '../../components/dashboard/dashboard.mock-data';
import {
  DashboardNotices,
  Holding,
  Instrument,
  Order,
  QuickTradeSelection,
  ThemeMode,
  TradeExecution,
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
import {AccountDto, AccountHoldingDto, AccountService} from '../../services/account.service';
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

  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly accountApi = inject(AccountService);
  private readonly orderApi = inject(OrderService);
  private readonly themeStorageKey = 'tidbits_theme_mode';
  private readonly mockData = getMockDashboardData();
  private readonly userService = inject(UserService);

  currentUser = signal<UserDTO | null>(null);
  cashAmount: number | null = null;
  cashLoading = false;
  cashError = '';
  cashSuccess = '';

  accounts = signal<AccountDto[]>([]);
  selectedAccountId = signal(0);
  instruments = signal(this.mockData.instruments);
  holdingsByAccount = signal(this.mockData.holdingsByAccount);
  ordersByAccount = signal<Record<number, Order[]>>({});
  reportingOverview = signal(this.mockData.reportingOverview);
  usingPlaceholderMarketData = signal(this.mockData.usingPlaceholderMarketData);
  themeMode = signal<ThemeMode>('light');
  trendFilter = signal<TrendFilter>('trending');
  chartTimeframe = signal<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  quickTradeSelection = signal<QuickTradeSelection | null>(null);

  selectedAccount = computed(() =>
    this.accounts().find(account => account.accountId === this.selectedAccountId()) ?? null
  );

  holdings = computed(() => this.holdingsByAccount()[this.selectedAccountId()] ?? []);
  orders = computed(() => this.ordersByAccount()[this.selectedAccountId()] ?? []);
  cashBalance = computed(() => this.selectedAccount()?.cashBalance ?? 0);
  portfolioValue = computed(() => this.holdings().reduce((sum, holding) => sum + holding.totalValue, 0));
  portfolioGainLoss = computed(() => this.holdings().reduce((sum, holding) => sum + holding.unrealizedGain, 0));
  totalNetWorth = computed(() => this.portfolioValue() + this.cashBalance());

  chartData = computed(() => buildMockChartData(this.totalNetWorth()));
  instrumentLabels = computed(() =>
    Object.fromEntries(this.instruments().map(instrument => [instrument.instrument_id, instrument.ticker])) as Record<number, string>
  );

  notices = computed<DashboardNotices>(() => ({
    marketNotice: 'Market data is currently sample data. Account balances are loaded from the client service.',
    holdingsNotice: this.holdings().length === 0 ? 'No holdings were returned for this sample account yet.' : '',
    ordersNotice: this.orders().length === 0 ? 'No orders were returned for this sample account yet.' : '',
    accountNotice: '',
    reportingNotice: this.reportingOverview() ? '' : 'Reporting insight feed is temporarily unavailable.',
  }));

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

  setChartTimeframe(timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL') {
    this.chartTimeframe.set(timeframe);
  }

  setTrendFilter(filter: TrendFilter) {
    this.trendFilter.set(filter);
  }

  onAccountChange(accountId: number) {
    this.selectedAccountId.set(accountId);
    this.session.setSelectedAccountId(accountId);
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

  onTradeExecuted(execution: TradeExecution) {
    const instrument = this.instruments().find(item => item.instrument_id === execution.instrumentId);
    const accountId = this.selectedAccountId();
    if (!instrument || !accountId) {
      return;
    }

    this.addOrder(accountId, instrument, execution);
    this.updateAccountCash(accountId, execution);
    this.updateHoldings(accountId, instrument, execution);
    this.syncSessionAccounts();
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

  private addOrder(accountId: number, instrument: Instrument, execution: TradeExecution) {
    const newOrder = {
      order_id: Date.now(),
      account_id: accountId,
      instrument_id: instrument.instrument_id,
      quantity: execution.quantity,
      stock_price: execution.stockPrice,
      order_type: execution.orderType,
      status: 'filled',
      ticker: instrument.ticker,
      name: instrument.name,
      created_at: new Date().toISOString(),
    };

    this.ordersByAccount.update(existing => ({
      ...existing,
      [accountId]: [newOrder, ...(existing[accountId] ?? [])],
    }));
  }

  private updateAccountCash(accountId: number, execution: TradeExecution) {
    const delta = execution.quantity * execution.stockPrice * (execution.orderType === 'buy' ? -1 : 1);
    this.accounts.update(accounts =>
      accounts.map(account =>
        account.accountId === accountId
          ? { ...account, cashBalance: Number((account.cashBalance + delta).toFixed(2)) }
          : account
      )
    );
    this.syncSessionAccounts();
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
        this.loadOrders(accounts);
        this.loadHoldings(accounts);
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

  private loadOrders(accounts: AccountDto[]) {
    if (!accounts.length) {
      this.ordersByAccount.set({});
      return;
    }

    forkJoin(accounts.map(account => this.orderApi.getOrders(account.accountId))).subscribe({
      next: orderLists => {
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
        this.cashError = err?.error?.message ?? err?.error?.error ?? 'Failed to load your order history.';
      },
    });
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


  private loadHoldings(accounts: AccountDto[]) {
    if (!accounts.length) {
      this.holdingsByAccount.set({});
      return;
    }

    forkJoin(accounts.map(account => this.accountApi.listHoldings(account.accountId))).subscribe({
      next: holdingLists => {
        const holdingsByAccount = Object.fromEntries(
          accounts.map((account, index) => [
            account.accountId,
            holdingLists[index].map(holding => this.toDashboardHolding(account.accountId, holding)),
          ])
        );
        this.holdingsByAccount.set(holdingsByAccount);
      },
      error: err => {
        this.holdingsByAccount.set({});
        this.cashError = err?.error?.message ?? err?.error?.error ?? 'Failed to load your holdings.';
      },
    });
  }

  private toDashboardHolding(accountId: number, holding: AccountHoldingDto): Holding {
    const instrument = this.instruments().find(item => item.instrument_id === holding.instrumentId) ?? {
      instrument_id: holding.instrumentId,
      ticker: `Instrument ${holding.instrumentId}`,
      name: `Instrument ${holding.instrumentId}`,
      type: 'EQUITY',
      market: 'UNKNOWN',
      price: 0,
      changePercent: 0,
      changeAmount: 0,
      volume: 0,
      volumeFormatted: '0',
      marketCap: 'N/A',
      dayHigh: 0,
      dayLow: 0,
      sparkline: [],
    };

    return this.recalculateHolding({
      account_id: accountId,
      instrument_id: holding.instrumentId,
      quantity: holding.quantity,
      amount_invested: holding.amountInvested,
      ticker: instrument.ticker,
      name: instrument.name,
      type: instrument.type,
      market: instrument.market,
      currentPrice: instrument.price,
      changePercent: instrument.changePercent,
      totalValue: 0,
      avgCost: 0,
      unrealizedGain: 0,
      unrealizedGainPct: 0,
    }, instrument);
  }
  private updateHoldings(accountId: number, instrument: Instrument, execution: TradeExecution) {
    const currentHoldings = [...(this.holdingsByAccount()[accountId] ?? [])];
    const existingIndex = currentHoldings.findIndex(holding => holding.instrument_id === instrument.instrument_id);

    if (execution.orderType === 'buy') {
      if (existingIndex >= 0) {
        const existing = currentHoldings[existingIndex];
        currentHoldings[existingIndex] = this.recalculateHolding({
          ...existing,
          quantity: existing.quantity + execution.quantity,
          amount_invested: Number((existing.amount_invested + execution.quantity * execution.stockPrice).toFixed(2)),
        }, instrument);
      } else {
        currentHoldings.push(this.recalculateHolding({
          account_id: accountId,
          instrument_id: instrument.instrument_id,
          quantity: execution.quantity,
          amount_invested: Number((execution.quantity * execution.stockPrice).toFixed(2)),
          ticker: instrument.ticker,
          name: instrument.name,
          type: instrument.type,
          market: instrument.market,
          currentPrice: instrument.price,
          changePercent: instrument.changePercent,
          totalValue: 0,
          avgCost: 0,
          unrealizedGain: 0,
          unrealizedGainPct: 0,
        }, instrument));
      }
    } else if (existingIndex >= 0) {
      const existing = currentHoldings[existingIndex];
      const avgCost = existing.quantity > 0 ? existing.amount_invested / existing.quantity : 0;
      const nextQuantity = Number((existing.quantity - execution.quantity).toFixed(4));
      const nextAmountInvested = Number(Math.max(0, existing.amount_invested - (avgCost * execution.quantity)).toFixed(2));

      if (nextQuantity <= 0) {
        currentHoldings.splice(existingIndex, 1);
      } else {
        currentHoldings[existingIndex] = this.recalculateHolding({
          ...existing,
          quantity: nextQuantity,
          amount_invested: nextAmountInvested,
        }, instrument);
      }
    }

    this.holdingsByAccount.update(existing => ({
      ...existing,
      [accountId]: currentHoldings,
    }));
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

  private recalculateHolding(holding: Holding, instrument: Instrument): Holding {
    const totalValue = Number((holding.quantity * instrument.price).toFixed(2));
    const avgCost = holding.quantity > 0 ? Number((holding.amount_invested / holding.quantity).toFixed(2)) : 0;
    const unrealizedGain = Number((totalValue - holding.amount_invested).toFixed(2));
    const unrealizedGainPct = holding.amount_invested > 0
      ? Number(((unrealizedGain / holding.amount_invested) * 100).toFixed(2))
      : 0;

    return {
      ...holding,
      ticker: instrument.ticker,
      name: instrument.name,
      type: instrument.type,
      market: instrument.market,
      currentPrice: instrument.price,
      changePercent: instrument.changePercent,
      totalValue,
      avgCost,
      unrealizedGain,
      unrealizedGainPct,
    };
  }
}

