import { Component, OnInit, AfterViewInit, OnDestroy, signal, computed, ViewChild, ElementRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

/* ── Interfaces ────────────────────────────────────────── */
interface SampleUser { user_id: number; username: string; password_hash: string; email: string; account_count: number; }
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
export class App implements OnInit, AfterViewInit, OnDestroy {
  readonly Math = Math;
  readonly today = new Date();
  private http = inject(HttpClient);

  /* Auth */
  view = signal<'login' | 'dashboard'>('login');
  loginUsername = '';
  loginPasswordHash = '';
  loginError = '';
  loginLoading = false;
  sampleUsers: SampleUser[] = [];

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

  ngOnInit() {
    this.loadSampleUsers();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.portfolioChart?.destroy();
  }

  /* ── Auth ─────────────────────────────────────────────── */
  loadSampleUsers() {
    this.http.get<SampleUser[]>('/api/users/sample').subscribe({
      next: users => this.sampleUsers = users,
      error: () => this.sampleUsers = []
    });
  }

  fillSampleUser(u: SampleUser) {
    this.loginUsername = u.username;
    this.loginPasswordHash = u.password_hash;
    this.loginError = '';
  }

  login() {
    if (!this.loginUsername.trim() || !this.loginPasswordHash.trim()) {
      this.loginError = 'Please enter username and password hash.';
      return;
    }
    this.loginLoading = true;
    this.loginError = '';
    this.http.post<{ success: boolean; user: User; accounts: Account[]; error?: string }>('/api/login', {
      username: this.loginUsername.trim(),
      password_hash: this.loginPasswordHash.trim()
    }).subscribe({
      next: res => {
        this.loginLoading = false;
        if (res.success) {
          this.currentUser.set(res.user);
          this.accounts.set(res.accounts);
          const firstAccount = res.accounts[0];
          if (firstAccount) {
            this.selectedAccountId.set(firstAccount.account_id);
            this.view.set('dashboard');
            this.loadDashboard();
          } else {
            this.loginError = 'No accounts found for this user.';
          }
        }
      },
      error: err => {
        this.loginLoading = false;
        this.loginError = err.error?.error ?? 'Login failed. Check credentials.';
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
    this.loginPasswordHash = '';
    this.tradeInstrumentId = null;
    this.tradeQuantity = null;
    this.tradeError = '';
    this.tradeSuccess = '';
    this.chartData = {};
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
    this.http.get<Instrument[]>('/api/instruments').subscribe({
      next: data => {
        this.instruments.set(data);
        this.buildChartData();
        this.loadAccountData(this.selectedAccountId());
      },
      error: () => { this.loading.set(false); }
    });
  }

  loadAccountData(accountId: number) {
    Promise.all([
      this.http.get<Holding[]>(`/api/accounts/${accountId}/holdings`).toPromise(),
      this.http.get<Order[]>(`/api/accounts/${accountId}/orders`).toPromise(),
      this.http.get<Account>(`/api/accounts/${accountId}`).toPromise(),
    ]).then(([holdings, orders, account]) => {
      if (holdings) this.holdings.set(holdings);
      if (orders)   this.orders.set(orders);
      if (account) {
        this.accounts.update(accs =>
          accs.map(a => a.account_id === accountId ? { ...a, cash_balance: account.cash_balance } : a)
        );
      }
      this.loading.set(false);
      this.buildChartData();
      setTimeout(() => this.renderPortfolioChart(), 100);
    }).catch(() => this.loading.set(false));
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
    this.http.post<any>('/api/orders', {
      accountId: this.selectedAccountId(),
      instrumentId: this.tradeInstrumentId,
      orderType: this.tradeMode,
      quantity: this.tradeQuantity,
      stockPrice: this.selectedInstrument()?.price
    }).subscribe({
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
        this.tradeError = err.error?.error ?? 'Trade execution failed.';
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

  trackByInstrument(_: number, item: Instrument): number { return item.instrument_id; }
  trackByHolding(_: number, item: Holding): number { return item.instrument_id; }
  trackByOrder(_: number, item: Order): number { return item.order_id; }
}
