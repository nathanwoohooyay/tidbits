import { Component, AfterViewInit, OnDestroy, OnInit, signal, computed, ViewChild, ElementRef, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

/* ── Interfaces ────────────────────────────────────────── */
interface User { user_id: number; username: string; email: string; role_id: number; reward_points: number; }
interface Account { account_id: number; user_id: number; nickname: string; cash_balance: number; created_at: string; }
interface Instrument {
  instrument_id: number; ticker: string; name: string; type: string; market: string;
  price: number; changePercent: number; changeAmount: number; volume: number; volumeFormatted: string;
  marketCap: string; dayHigh: number; dayLow: number; sparkline: number[];
}
interface Holding {
  account_id: number; instrument_id: number; quantity: number; amount_invested: number;
  ticker: string; name: string; type: string; market: string;
  currentPrice: number; changePercent: number; totalValue: number;
  avgCost: number; unrealizedGain: number; unrealizedGainPct: number;
}
interface Order {
  order_id: number; account_id: number; instrument_id: number; quantity: number;
  stock_price: number; order_type: string; status: string;
  ticker: string; name: string; created_at: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy, OnInit {
  readonly Math = Math;
  readonly today = new Date();
  private http = inject(HttpClient);
  private readonly apiBase = '/api';
  private readonly tokenStorageKey = 'tidbits_auth_token';

  /* Auth */
  view = signal<'login' | 'dashboard'>('login');
  loginUsername = '';
  loginPassword = '';
  loginError = '';
  loginLoading = false;
  authToken = signal<string | null>(null);

  /* Session */
  currentUser = signal<User | null>(null);
  accounts = signal<Account[]>([]);
  selectedAccountId = signal<number>(0);

  selectedAccount = computed(() =>
    this.accounts().find(a => a.account_id === this.selectedAccountId()) ?? null
  );

  /* Dashboard Data */
  instruments = signal<Instrument[]>([]);
  holdings = signal<Holding[]>([]);
  orders = signal<Order[]>([]);
  loading = signal(false);
  marketNotice = '';
  holdingsNotice = '';
  ordersNotice = '';
  accountNotice = '';

  /* Trending filter */
  trendFilter: 'trending' | 'gainers' | 'losers' | 'volume' = 'trending';
  trendingStocks = computed(() => {
    const all = [...this.instruments()];
    switch (this.trendFilter) {
      case 'gainers': return all.sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
      case 'losers':  return all.sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);
      case 'volume':  return all.sort((a, b) => b.volume - a.volume).slice(0, 10);
      default:        return all.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 10);
    }
  });

  /* Portfolio Metrics */
  portfolioValue = computed(() =>
    this.holdings().reduce((s, h) => s + h.totalValue, 0)
  );
  cashBalance = computed(() => this.selectedAccount()?.cash_balance ?? 0);
  totalNetWorth = computed(() => this.portfolioValue() + this.cashBalance());
  portfolioGainLoss = computed(() =>
    this.holdings().reduce((s, h) => s + h.unrealizedGain, 0)
  );

  /* Chart */
  @ViewChild('portfolioChartRef') portfolioChartRef!: ElementRef<HTMLCanvasElement>;
  private portfolioChart: Chart | null = null;
  chartTimeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL' = '1M';
  private chartData: Record<string, { labels: string[]; values: number[] }> = {};

  /* Trade Desk */
  tradeMode: 'buy' | 'sell' = 'buy';
  tradeInstrumentId: number | null = null;
  tradeQuantity: number | null = null;
  tradeError = '';
  tradeSuccess = '';
  tradeLoading = false;
  tradeInProgress = false;

  selectedInstrument = computed(() =>
    this.instruments().find(i => i.instrument_id === this.tradeInstrumentId) ?? null
  );
  tradeTotalCost = computed(() => {
    const qty = this.tradeQuantity ?? 0;
    const price = this.selectedInstrument()?.price ?? 0;
    return qty * price;
  });
  canExecuteTrade = computed(() => {
    if (!this.selectedInstrument() || !this.tradeQuantity || this.tradeQuantity <= 0) return false;
    if (this.tradeMode === 'buy') {
      return this.tradeTotalCost() <= this.cashBalance();
    } else {
      const held = this.holdings().find(h => h.instrument_id === this.tradeInstrumentId);
      return !!held && (held.quantity >= (this.tradeQuantity ?? 0));
    }
  });

  heldQuantity = computed(() => {
    const held = this.holdings().find(h => h.instrument_id === this.tradeInstrumentId);
    return held?.quantity ?? 0;
  });

  ngAfterViewInit() {}

  ngOnInit() {
    void this.restoreSessionFromStorage();
  }

  ngOnDestroy() {
    this.portfolioChart?.destroy();
  }

  /* ── Auth ─────────────────────────────────────────────── */
  login() {
    if (!this.loginUsername.trim() || !this.loginPassword.trim()) {
      this.loginError = 'Please enter username and password.';
      return;
    }
    this.loginLoading = true;
    this.loginError = '';
    this.http.post<{ token?: string; error?: string }>(`${this.apiBase}/auth/login`, {
      username: this.loginUsername.trim(),
      password: this.loginPassword.trim()
    }).subscribe({
      next: async res => {
        if (!res?.token) {
          this.loginLoading = false;
          this.loginError = res?.error ?? 'Login failed. Check credentials.';
          return;
        }

        try {
          this.setAuthToken(res.token);
          await this.hydrateSessionFromToken(res.token);

          const firstAccount = this.accounts()[0];
          if (!firstAccount) {
            this.loginError = 'No accounts found for this user.';
            return;
          }

          this.clearDataNotices();
          this.selectedAccountId.set(firstAccount.account_id);
          this.view.set('dashboard');
          this.loadDashboard();
        } catch {
          this.loginError = 'Login succeeded, but account data could not be loaded.';
        } finally {
          this.loginLoading = false;
        }
      },
      error: err => {
        this.loginLoading = false;
        this.loginError = this.getApiError(err, 'Login failed. Check credentials.');
      }
    });
  }

  signOut() {
    this.view.set('login');
    this.currentUser.set(null);
    this.accounts.set([]);
    this.holdings.set([]);
    this.orders.set([]);
    this.instruments.set([]);
    this.loginUsername = '';
    this.loginPassword = '';
    this.clearAuthToken();
    this.tradeInstrumentId = null;
    this.tradeQuantity = null;
    this.tradeError = '';
    this.tradeSuccess = '';
    this.chartData = {};
    this.clearDataNotices();
    this.portfolioChart?.destroy();
    this.portfolioChart = null;
  }

  /* ── Account Switching ────────────────────────────────── */
  onAccountChange(event: Event) {
    const id = parseInt((event.target as HTMLSelectElement).value, 10);
    this.selectedAccountId.set(id);
    this.loadAccountData(id);
  }

  /* ── Data Loading ─────────────────────────────────────── */
  loadDashboard() {
    this.loading.set(true);
    this.http.get<any[]>(`${this.apiBase}/instruments`, this.authOptions()).subscribe({
      next: data => {
        const instruments = (data ?? []).map(item => this.mapInstrument(item));
        this.instruments.set(instruments);
        this.marketNotice = instruments.length === 0
          ? 'Market Snapshot is empty because /api/instruments returned no items. This may be temporary while backend endpoints are being completed.'
          : '';
        this.buildChartData();
        const accountId = this.selectedAccountId();
        if (!accountId) {
          this.accountNotice = 'No active account was selected after login.';
          this.loading.set(false);
          return;
        }
        this.loadAccountData(accountId);
      },
      error: () => {
        this.loading.set(false);
        this.marketNotice = 'Market Snapshot is unavailable because /api/instruments could not be loaded from Spring Boot.';
      }
    });
  }

  loadAccountData(accountId: number) {
    Promise.allSettled([
      firstValueFrom(this.http.get<any[]>(`${this.apiBase}/accounts/${accountId}/holdings/`, this.authOptions())),
      firstValueFrom(this.http.get<any[]>(`${this.apiBase}/accounts/${accountId}/orders`, this.authOptions())),
      firstValueFrom(this.http.get<any>(`${this.apiBase}/accounts/${accountId}`, this.authOptions())),
    ]).then(([holdingsResult, ordersResult, accountResult]) => {
      if (holdingsResult.status === 'fulfilled') {
        const mappedHoldings = (holdingsResult.value ?? []).map(item => this.mapHolding(item));
        this.holdings.set(mappedHoldings);
        this.holdingsNotice = mappedHoldings.length === 0
          ? 'No holdings were returned for this account. This can mean the account has no positions or the holdings endpoint is still being implemented.'
          : '';
      } else {
        this.holdings.set([]);
        this.holdingsNotice = `Could not load holdings from /api/accounts/${accountId}/holdings/.`;
      }

      if (ordersResult.status === 'fulfilled') {
        const mappedOrders = (ordersResult.value ?? []).map(item => this.mapOrder(item));
        this.orders.set(mappedOrders);
        this.ordersNotice = mappedOrders.length === 0
          ? 'No orders were returned for this account. This can be normal for new accounts or temporary while backend endpoints are being completed.'
          : '';
      } else {
        this.orders.set([]);
        this.ordersNotice = `Could not load trade history from /api/accounts/${accountId}/orders.`;
      }

      if (accountResult.status === 'fulfilled' && accountResult.value) {
        const mappedAccount = this.mapAccount(accountResult.value);
        this.accounts.update(accs =>
          accs.map(a => a.account_id === accountId ? { ...a, cash_balance: mappedAccount.cash_balance } : a)
        );
        this.accountNotice = '';
      } else {
        this.accountNotice = `Could not refresh account summary from /api/accounts/${accountId}.`;
      }

      this.loading.set(false);
      this.buildChartData();
      setTimeout(() => this.renderPortfolioChart(), 100);
    }).catch(() => {
      this.loading.set(false);
      this.accountNotice = 'Dashboard data could not be refreshed due to an unexpected client error.';
    });
  }

  /* ── Chart ────────────────────────────────────────────── */
  buildChartData() {
    const baseValue = this.totalNetWorth();
    const now = new Date();
    const configs: Record<string, { days: number; points: number }> = {
      '1D': { days: 1,   points: 24 },
      '1W': { days: 7,   points: 7 },
      '1M': { days: 30,  points: 30 },
      '3M': { days: 90,  points: 12 },
      '1Y': { days: 365, points: 12 },
      'ALL': { days: 730, points: 24 },
    };
    for (const [key, cfg] of Object.entries(configs)) {
      const labels: string[] = [];
      const values: number[] = [];
      let v = baseValue * (0.7 + Math.random() * 0.1);
      for (let i = cfg.points; i >= 0; i--) {
        const d = new Date(now.getTime() - (i / cfg.points) * cfg.days * 86400000);
        if (key === '1D') labels.push(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        else if (key === '1W' || key === '1M') labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        else labels.push(d.toLocaleDateString('en-US', { year: '2-digit', month: 'short' }));
        v = v * (1 + (Math.random() * 0.04 - 0.012));
        values.push(parseFloat(v.toFixed(2)));
      }
      // last point is always current total
      if (values.length > 0) values[values.length - 1] = baseValue;
      this.chartData[key] = { labels, values };
    }
  }

  setChartTimeframe(tf: typeof this.chartTimeframe) {
    this.chartTimeframe = tf;
    this.renderPortfolioChart();
  }

  renderPortfolioChart() {
    if (!this.portfolioChartRef?.nativeElement) return;
    const data = this.chartData[this.chartTimeframe];
    if (!data) return;
    const ctx = this.portfolioChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.portfolioChart) this.portfolioChart.destroy();
    const isPositive = (data.values[data.values.length - 1] ?? 0) >= (data.values[0] ?? 0);
    const lineColor = isPositive ? '#3D7A4A' : '#B84B3A';
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, isPositive ? 'rgba(61,122,74,.3)' : 'rgba(184,75,58,.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    this.portfolioChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          borderColor: lineColor,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2.5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2C1A0E',
            titleColor: '#C8813A',
            bodyColor: '#E8D5B7',
            callbacks: {
              label: (ctx: any) => {
                const v = typeof ctx.raw === 'number' ? ctx.raw.toFixed(2) : '0.00';
                const parts = v.split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                return '$' + parts.join('.');
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#7B4A2D', font: { size: 11 }, maxTicksLimit: 8 } },
          y: {
            grid: { color: 'rgba(221,208,184,.5)' },
            ticks: {
              color: '#7B4A2D',
              font: { size: 11 },
              callback: (v: any) => {
                const num = typeof v === 'number' ? v : parseFloat(String(v));
                const parts = Math.round(num).toString().split('');
                const result: string[] = [];
                parts.reverse().forEach((d, i) => { if (i > 0 && i % 3 === 0) result.push(','); result.push(d); });
                return '$' + result.reverse().join('');
              }
            }
          }
        }
      }
    });
  }

  /* ── Trade ────────────────────────────────────────────── */
  setTradeMode(mode: 'buy' | 'sell') {
    this.tradeMode = mode;
    this.tradeError = '';
    this.tradeSuccess = '';
  }

  onTradeInstrumentChange() {
    this.tradeError = '';
    this.tradeSuccess = '';
    this.tradeQuantity = null;
  }

  executeTrade() {
    if (!this.canExecuteTrade()) return;
    this.tradeLoading = true;
    this.tradeInProgress = true;
    this.tradeError = '';
    this.tradeSuccess = '';
    this.http.post<any>(`${this.apiBase}/orders`, {
      accountId: this.selectedAccountId(),
      instrumentId: this.tradeInstrumentId,
      orderType: this.tradeMode,
      quantity: this.tradeQuantity,
      stockPrice: this.selectedInstrument()?.price
    }, this.authOptions()).subscribe({
      next: res => {
        this.tradeLoading = false;
        this.tradeInProgress = false;
        const inst = this.selectedInstrument();
        const q = this.tradeQuantity;
        this.tradeSuccess = `✓ ${this.tradeMode === 'buy' ? 'Bought' : 'Sold'} ${q} share${(q??0) > 1 ? 's' : ''} of ${inst?.ticker} at $${inst?.price.toFixed(2)}`;
        this.tradeQuantity = null;
        this.loadAccountData(this.selectedAccountId());
      },
      error: err => {
        this.tradeLoading = false;
        this.tradeInProgress = false;
        this.tradeError = this.getApiError(err, 'Trade execution failed.');
      }
    });
  }

  quickTrade(instrumentId: number, mode: 'buy' | 'sell') {
    this.tradeInstrumentId = instrumentId;
    this.tradeMode = mode;
    this.tradeError = '';
    this.tradeSuccess = '';
    this.tradeQuantity = null;
    document.getElementById('trade-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  /* ── Helpers ──────────────────────────────────────────── */
  setTrendFilter(f: typeof this.trendFilter) { this.trendFilter = f; }

  formatCurrency(val: number): string {
    const absVal = val < 0 ? -val : val;
    const parts = absVal.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (val < 0 ? '-$' : '$') + parts.join('.');
  }

  formatPercent(val: number): string {
    return (val >= 0 ? '+' : '') + val.toFixed(2) + '%';
  }

  statusClass(status: string): string {
    return 'status-' + status.toLowerCase();
  }

  private clearDataNotices() {
    this.marketNotice = '';
    this.holdingsNotice = '';
    this.ordersNotice = '';
    this.accountNotice = '';
  }

  private async restoreSessionFromStorage() {
    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token) {
      return;
    }

    if (this.isTokenExpired(token)) {
      this.clearAuthToken();
      return;
    }

    this.loginLoading = true;
    this.loginError = '';

    try {
      this.setAuthToken(token);
      await this.hydrateSessionFromToken(token);

      const firstAccount = this.accounts()[0];
      if (!firstAccount) {
        this.loginError = 'No accounts found for this user.';
        return;
      }

      this.clearDataNotices();
      this.selectedAccountId.set(firstAccount.account_id);
      this.view.set('dashboard');
      this.loadDashboard();
    } catch {
      this.loginError = 'Existing login token could not be used to restore account data.';
    } finally {
      this.loginLoading = false;
    }
  }

  private setAuthToken(token: string) {
    this.authToken.set(token);
    localStorage.setItem(this.tokenStorageKey, token);
  }

  private clearAuthToken() {
    this.authToken.set(null);
    localStorage.removeItem(this.tokenStorageKey);
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.parseJwtPayload(token);
    const exp = this.asNumber(payload['exp']);
    if (!exp) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return nowInSeconds >= exp;
  }

  private authOptions() {
    const token = this.authToken();
    if (!token) {
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  private async hydrateSessionFromToken(token: string) {
    const payload = this.parseJwtPayload(token);
    const userId = this.asNumber(payload['sub']);
    if (!userId) {
      throw new Error('Token subject was missing.');
    }

    const [userRaw, accountRows] = await Promise.all([
      firstValueFrom(this.http.get<any>(`${this.apiBase}/users/${userId}`, this.authOptions())),
      firstValueFrom(this.http.get<any[]>(`${this.apiBase}/users/${userId}/accounts`, this.authOptions())),
    ]);

    this.currentUser.set(this.mapUser(userRaw));
    this.accounts.set((accountRows ?? []).map(row => this.mapAccount(row)));
  }

  private parseJwtPayload(token: string): Record<string, unknown> {
    const parts = token.split('.');
    if (parts.length < 2) {
      return {};
    }

    try {
      const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }

  private mapUser(raw: any): User {
    return {
      user_id: this.asNumber(raw?.user_id ?? raw?.userId),
      username: String(raw?.username ?? ''),
      email: String(raw?.email ?? ''),
      role_id: this.asNumber(raw?.role_id ?? raw?.roleId),
      reward_points: this.asNumber(raw?.reward_points ?? raw?.rewardPoints)
    };
  }

  private mapAccount(raw: any): Account {
    return {
      account_id: this.asNumber(raw?.account_id ?? raw?.accountId),
      user_id: this.asNumber(raw?.user_id ?? raw?.userId),
      nickname: String(raw?.nickname ?? ''),
      cash_balance: this.asNumber(raw?.cash_balance ?? raw?.cashBalance),
      created_at: String(raw?.created_at ?? raw?.createdAt ?? '')
    };
  }

  private mapInstrument(raw: any): Instrument {
    const price = this.asNumber(raw?.price, 100);
    const changePercent = this.asNumber(raw?.changePercent ?? raw?.change_percent, 0);
    const changeAmount = this.asNumber(raw?.changeAmount ?? raw?.change_amount, price * (changePercent / 100));
    const volume = this.asNumber(raw?.volume, 0);

    return {
      instrument_id: this.asNumber(raw?.instrument_id ?? raw?.instrumentId),
      ticker: String(raw?.ticker ?? ''),
      name: String(raw?.name ?? ''),
      type: String(raw?.type ?? ''),
      market: String(raw?.market ?? ''),
      price,
      changePercent,
      changeAmount,
      volume,
      volumeFormatted: String(raw?.volumeFormatted ?? raw?.volume_formatted ?? this.formatCompactNumber(volume)),
      marketCap: String(raw?.marketCap ?? raw?.market_cap ?? 'N/A'),
      dayHigh: this.asNumber(raw?.dayHigh ?? raw?.day_high, price),
      dayLow: this.asNumber(raw?.dayLow ?? raw?.day_low, price),
      sparkline: this.mapSparkline(raw?.sparkline, price)
    };
  }

  private mapHolding(raw: any): Holding {
    const quantity = this.asNumber(raw?.quantity);
    const amountInvested = this.asNumber(raw?.amount_invested ?? raw?.amountInvested);
    const currentPrice = this.asNumber(raw?.currentPrice ?? raw?.current_price, this.asNumber(raw?.stockPrice ?? raw?.stock_price, 0));
    const totalValue = this.asNumber(raw?.totalValue ?? raw?.total_value, quantity * currentPrice);
    const avgCost = this.asNumber(raw?.avgCost ?? raw?.avg_cost, quantity > 0 ? amountInvested / quantity : 0);
    const unrealizedGain = this.asNumber(raw?.unrealizedGain ?? raw?.unrealized_gain, totalValue - amountInvested);

    return {
      account_id: this.asNumber(raw?.account_id ?? raw?.accountId),
      instrument_id: this.asNumber(raw?.instrument_id ?? raw?.instrumentId),
      quantity,
      amount_invested: amountInvested,
      ticker: String(raw?.ticker ?? ''),
      name: String(raw?.name ?? ''),
      type: String(raw?.type ?? ''),
      market: String(raw?.market ?? ''),
      currentPrice,
      changePercent: this.asNumber(raw?.changePercent ?? raw?.change_percent),
      totalValue,
      avgCost,
      unrealizedGain,
      unrealizedGainPct: this.asNumber(raw?.unrealizedGainPct ?? raw?.unrealized_gain_pct, amountInvested > 0 ? (unrealizedGain / amountInvested) * 100 : 0)
    };
  }

  private mapOrder(raw: any): Order {
    return {
      order_id: this.asNumber(raw?.order_id ?? raw?.orderId),
      account_id: this.asNumber(raw?.account_id ?? raw?.accountId),
      instrument_id: this.asNumber(raw?.instrument_id ?? raw?.instrumentId),
      quantity: this.asNumber(raw?.quantity),
      stock_price: this.asNumber(raw?.stock_price ?? raw?.stockPrice),
      order_type: String(raw?.order_type ?? raw?.orderType ?? '').toLowerCase(),
      status: String(raw?.status ?? '').toLowerCase(),
      ticker: String(raw?.ticker ?? ''),
      name: String(raw?.name ?? ''),
      created_at: String(raw?.created_at ?? raw?.createdAt ?? '')
    };
  }

  private mapSparkline(raw: any, price: number): number[] {
    if (!Array.isArray(raw) || raw.length === 0) {
      return [price * 0.97, price * 0.985, price];
    }

    return raw
      .map((v: any) => this.asNumber(v, price))
      .filter((v: number) => Number.isFinite(v));
  }

  private asNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private formatCompactNumber(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return '0';
    }
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  }

  private getApiError(error: any, fallback: string): string {
    const payloadError = error?.error?.error;
    if (typeof payloadError === 'string' && payloadError.trim()) {
      return payloadError;
    }
    return fallback;
  }

  trackByInstrument(_: number, item: Instrument): number { return item.instrument_id; }
  trackByHolding(_: number, item: Holding): number { return item.instrument_id; }
  trackByOrder(_: number, item: Order): number { return item.order_id; }
}
