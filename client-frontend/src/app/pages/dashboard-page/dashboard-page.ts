import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { buildMockChartData, getMockDashboardData } from '../../components/dashboard/dashboard.mock-data';
import {
  DashboardNotices,
  Holding,
  Instrument,
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

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
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
  private readonly themeStorageKey = 'tidbits_theme_mode';
  private readonly mockData = getMockDashboardData();

  currentUser = signal(this.mockData.user);
  accounts = signal(this.mockData.accounts);
  selectedAccountId = signal(this.mockData.accounts[0]?.account_id ?? 0);
  instruments = signal(this.mockData.instruments);
  holdingsByAccount = signal(this.mockData.holdingsByAccount);
  ordersByAccount = signal(this.mockData.ordersByAccount);
  reportingOverview = signal(this.mockData.reportingOverview);
  usingPlaceholderMarketData = signal(this.mockData.usingPlaceholderMarketData);
  themeMode = signal<ThemeMode>('light');
  trendFilter = signal<TrendFilter>('trending');
  chartTimeframe = signal<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  quickTradeSelection = signal<QuickTradeSelection | null>(null);

  selectedAccount = computed(() =>
    this.accounts().find(account => account.account_id === this.selectedAccountId()) ?? null
  );

  holdings = computed(() => this.holdingsByAccount()[this.selectedAccountId()] ?? []);
  orders = computed(() => this.ordersByAccount()[this.selectedAccountId()] ?? []);
  cashBalance = computed(() => this.selectedAccount()?.cash_balance ?? 0);
  portfolioValue = computed(() => this.holdings().reduce((sum, holding) => sum + holding.totalValue, 0));
  portfolioGainLoss = computed(() => this.holdings().reduce((sum, holding) => sum + holding.unrealizedGain, 0));
  totalNetWorth = computed(() => this.portfolioValue() + this.cashBalance());

  chartData = computed(() => buildMockChartData(this.totalNetWorth()));
  instrumentLabels = computed(() =>
    Object.fromEntries(this.instruments().map(instrument => [instrument.instrument_id, instrument.ticker])) as Record<number, string>
  );

  notices = computed<DashboardNotices>(() => ({
    marketNotice: 'Showing curated sample dashboard data. Replace this mock feed with a real service when backend APIs are ready.',
    holdingsNotice: this.holdings().length === 0 ? 'No holdings were returned for this sample account yet.' : '',
    ordersNotice: this.orders().length === 0 ? 'No orders were returned for this sample account yet.' : '',
    accountNotice: '',
    reportingNotice: this.reportingOverview() ? '' : 'Reporting insight feed is temporarily unavailable.',
  }));

  ngOnInit() {
    this.restoreThemePreference();
    this.session.setCurrentUser(this.currentUser());
    this.session.setAccounts(this.accounts());
    this.session.setSelectedAccountId(this.selectedAccountId());
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
    this.session.setAccounts(this.accounts());
  }

  goToAccount() {
    void this.router.navigateByUrl('/account');
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
        account.account_id === accountId
          ? { ...account, cash_balance: Number((account.cash_balance + delta).toFixed(2)) }
          : account
      )
    );
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

