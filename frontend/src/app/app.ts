import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { TradingService, TIMEFRAME_TEMPLATES } from './services/trading.service';
import { Instrument, Timeframe, TrendingFilter, Holding } from './models/trading.models';

Chart.register(...registerables);

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  readonly tradingService = inject(TradingService);

  // Tab & Filter States
  activeTab: 'dashboard' | 'holdings' | 'orders' | 'market' = 'dashboard';
  readonly timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  currentTimeframe: Timeframe = '1D';
  currentTrendingFilter: TrendingFilter = 'trending';

  // Trading Desk State
  tradeMode: 'BUY' | 'SELL' = 'BUY';
  searchQuery = '';
  searchDropdownOpen = false;
  selectedInstrument: Instrument | null = null;
  tradeShares = 1;

  // Modals & Notifications
  userSwitcherOpen = false;
  toasts: Toast[] = [];
  private toastCounter = 0;

  // Chart References
  @ViewChild('portfolioChartCanvas') portfolioCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendingChartCanvas') trendingCanvasRef!: ElementRef<HTMLCanvasElement>;
  private portfolioChartInstance: Chart | null = null;
  private trendingChartInstance: Chart | null = null;

  // Colors
  private readonly colors = {
    brownDark: '#3D2B1F',
    brownMedium: '#6F523D',
    brownLight: '#B5987F',
    tanGrid: 'rgba(205, 190, 172, 0.28)',
    earthyGreen: '#3B7A50',
    earthyGreenFill: 'rgba(59, 122, 80, 0.15)',
    earthyRed: '#B94B3C',
    earthyRedFill: 'rgba(185, 75, 60, 0.15)',
    tooltipBg: '#2C1E16',
    tooltipText: '#FAF7F2'
  };

  constructor() {
    // Whenever net worth or account changes, update portfolio chart
    effect(() => {
      // depend on active account and portfolio summary
      const summary = this.tradingService.portfolioSummary();
      if (this.portfolioChartInstance) {
        this.updatePortfolioChartData();
      }
    });
  }

  ngOnInit(): void {
    // Default select AAPL
    const insts = this.tradingService.instruments();
    if (insts.length > 0) {
      this.selectedInstrument = insts[0];
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.buildPortfolioChart();
      this.buildTrendingChart();
    }, 100);
  }

  ngOnDestroy(): void {
    this.portfolioChartInstance?.destroy();
    this.trendingChartInstance?.destroy();
  }

  // ==========================================================================
  // Charting Logic
  // ==========================================================================
  setTimeframe(tf: Timeframe): void {
    this.currentTimeframe = tf;
    this.updatePortfolioChartData();
  }

  private buildPortfolioChart(): void {
    if (!this.portfolioCanvasRef) return;
    const ctx = this.portfolioCanvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const template = TIMEFRAME_TEMPLATES[this.currentTimeframe];
    const summary = this.tradingService.portfolioSummary();
    const currentTotal = summary.totalNetWorth;

    const scaledPoints = this.calculateScaledCurve(template.points, currentTotal);

    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(59, 122, 80, 0.25)');
    gradient.addColorStop(1, 'rgba(59, 122, 80, 0.00)');

    this.portfolioChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: template.labels,
        datasets: [{
          label: 'Portfolio Value',
          data: scaledPoints,
          borderColor: this.colors.earthyGreen,
          borderWidth: 2.8,
          backgroundColor: gradient,
          fill: true,
          tension: 0.32,
          pointBackgroundColor: this.colors.earthyGreen,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: this.colors.brownDark
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: this.colors.tooltipBg,
            titleColor: this.colors.tooltipText,
            bodyColor: this.colors.tooltipText,
            borderColor: this.colors.brownLight,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
            bodyFont: { family: 'JetBrains Mono', size: 14, weight: 'bold' },
            callbacks: {
              label: (context) => ` Value: $${(context.parsed.y ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: this.colors.tanGrid
            },
            ticks: {
              color: this.colors.brownMedium,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' }
            }
          },
          y: {
            grid: {
              color: this.colors.tanGrid
            },
            ticks: {
              color: this.colors.brownMedium,
              font: { family: 'JetBrains Mono', size: 11, weight: 'bold' },
              callback: (val) => '$' + (Number(val) >= 1000 ? (Number(val) / 1000).toFixed(0) + 'k' : val)
            }
          }
        }
      }
    });
  }

  private updatePortfolioChartData(): void {
    if (!this.portfolioChartInstance) return;
    const template = TIMEFRAME_TEMPLATES[this.currentTimeframe];
    const summary = this.tradingService.portfolioSummary();
    const scaledPoints = this.calculateScaledCurve(template.points, summary.totalNetWorth);

    this.portfolioChartInstance.data.labels = template.labels;
    this.portfolioChartInstance.data.datasets[0].data = scaledPoints;
    this.portfolioChartInstance.update();
  }

  private calculateScaledCurve(basePoints: number[], currentTotal: number): number[] {
    const lastSeed = basePoints[basePoints.length - 1];
    const ratio = currentTotal / (lastSeed || 1);
    return basePoints.map((pt, idx) => {
      if (idx === basePoints.length - 1) return currentTotal;
      return Math.round(pt * ratio);
    });
  }

  // ==========================================================================
  // Trending Stocks Chart & Filters
  // ==========================================================================
  setTrendingFilter(filter: TrendingFilter): void {
    this.currentTrendingFilter = filter;
    this.updateTrendingChartData();
  }

  private buildTrendingChart(): void {
    if (!this.trendingCanvasRef) return;
    const ctx = this.trendingCanvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const stocks = this.tradingService.getTrendingStocks(this.currentTrendingFilter);
    const isPercent = this.currentTrendingFilter !== 'volume';
    const labels = stocks.map(s => s.ticker);
    const values = stocks.map(s => isPercent ? s.changePercent : s.volume);
    const colors = stocks.map(s => {
      if (!isPercent) return this.colors.brownLight;
      return s.changePercent >= 0 ? this.colors.earthyGreen : this.colors.earthyRed;
    });

    this.trendingChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: this.colors.tooltipBg,
            titleColor: this.colors.tooltipText,
            bodyColor: this.colors.tooltipText,
            padding: 10,
            cornerRadius: 8,
            titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
            bodyFont: { family: 'JetBrains Mono', size: 13, weight: 'bold' },
            callbacks: {
              label: (context) => {
                const val = context.parsed.x ?? 0;
                if (isPercent) {
                  return ` Change: ${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
                }
                return ` Volume: ${(val / 1000000).toFixed(1)}M shares`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: this.colors.tanGrid },
            ticks: {
              color: this.colors.brownMedium,
              font: { family: 'JetBrains Mono', size: 11, weight: 'bold' },
              callback: (val) => isPercent ? `${val}%` : `${(Number(val) / 1000000).toFixed(0)}M`
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: this.colors.brownDark,
              font: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  private updateTrendingChartData(): void {
    if (!this.trendingChartInstance) return;
    const stocks = this.tradingService.getTrendingStocks(this.currentTrendingFilter);
    const isPercent = this.currentTrendingFilter !== 'volume';
    const labels = stocks.map(s => s.ticker);
    const values = stocks.map(s => isPercent ? s.changePercent : s.volume);
    const colors = stocks.map(s => {
      if (!isPercent) return this.colors.brownLight;
      return s.changePercent >= 0 ? this.colors.earthyGreen : this.colors.earthyRed;
    });

    this.trendingChartInstance.data.labels = labels;
    this.trendingChartInstance.data.datasets[0].data = values;
    this.trendingChartInstance.data.datasets[0].backgroundColor = colors;
    if (this.trendingChartInstance.options.scales && this.trendingChartInstance.options.scales['x']) {
      this.trendingChartInstance.options.scales['x'].ticks = {
        ...this.trendingChartInstance.options.scales['x'].ticks,
        callback: (val: any) => isPercent ? `${val}%` : `${(Number(val) / 1000000).toFixed(0)}M`
      };
    }
    this.trendingChartInstance.update();
  }

  // ==========================================================================
  // Trading Desk Actions & Validation
  // ==========================================================================
  setTradeMode(mode: 'BUY' | 'SELL'): void {
    this.tradeMode = mode;
  }

  get filteredSearchResults(): Instrument[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.tradingService.instruments().slice(0, 8);
    return this.tradingService.instruments().filter(
      i => i.ticker.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
    );
  }

  selectInstrument(inst: Instrument, mode?: 'BUY' | 'SELL'): void {
    this.selectedInstrument = inst;
    this.searchQuery = `${inst.ticker} - ${inst.name}`;
    this.searchDropdownOpen = false;
    if (mode) this.tradeMode = mode;
  }

  quickTrade(ticker: string, mode: 'BUY' | 'SELL'): void {
    const inst = this.tradingService.getInstrumentByTicker(ticker);
    if (!inst) return;
    this.activeTab = 'dashboard';
    this.selectInstrument(inst, mode);

    const desk = document.getElementById('tradingDeskCard');
    if (desk) {
      desk.scrollIntoView({ behavior: 'smooth', block: 'center' });
      desk.style.boxShadow = '0 0 0 3px rgba(111, 82, 61, 0.35)';
      setTimeout(() => { desk.style.boxShadow = ''; }, 1200);
    }
  }

  applyPercentage(pct: number): void {
    if (!this.selectedInstrument) return;
    const acct = this.tradingService.currentAccount();
    const price = this.selectedInstrument.price;

    if (this.tradeMode === 'BUY') {
      const budget = acct.cashBalance * (pct / 100);
      const calculatedShares = Math.floor(budget / price);
      this.tradeShares = Math.max(0, calculatedShares);
    } else {
      // Sell mode based on holdings
      const holdings = this.tradingService.holdings();
      const currentHolding = holdings.find(h => h.instrumentId === this.selectedInstrument?.instrumentId);
      const owned = currentHolding ? currentHolding.quantity : 0;
      const calculated = (owned * (pct / 100));
      this.tradeShares = Math.round(calculated * 100) / 100;
    }
  }

  get currentTradeTotal(): number {
    if (!this.selectedInstrument) return 0;
    return (this.tradeShares || 0) * this.selectedInstrument.price;
  }

  // Live Balance and Position Validation Check
  get validationStatus(): { isValid: boolean; message: string; isWarning: boolean } {
    if (!this.selectedInstrument) {
      return { isValid: false, message: 'Please select a stock to trade.', isWarning: true };
    }
    if (this.tradeShares <= 0) {
      return { isValid: false, message: 'Enter a share quantity greater than 0.', isWarning: true };
    }

    const acct = this.tradingService.currentAccount();
    const total = this.currentTradeTotal;

    if (this.tradeMode === 'BUY') {
      if (total > acct.cashBalance) {
        const diff = total - acct.cashBalance;
        return {
          isValid: false,
          message: `Insufficient Funds: Needed $${total.toFixed(2)}, available cash is $${acct.cashBalance.toFixed(2)} (Short by $${diff.toFixed(2)}).`,
          isWarning: true
        };
      }
      const remaining = acct.cashBalance - total;
      return {
        isValid: true,
        message: `Funds Available: Remaining cash after purchase will be $${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        isWarning: false
      };
    } else {
      // SELL mode
      const holdings = this.tradingService.holdings();
      const currentHolding = holdings.find(h => h.instrumentId === this.selectedInstrument?.instrumentId);
      const owned = currentHolding ? currentHolding.quantity : 0;

      if (owned <= 0) {
        return {
          isValid: false,
          message: `No Shares Owned: You currently hold 0 shares of ${this.selectedInstrument.ticker}.`,
          isWarning: true
        };
      }
      if (this.tradeShares > owned) {
        return {
          isValid: false,
          message: `Exceeds Position: You own ${owned} shares of ${this.selectedInstrument.ticker}. Cannot sell ${this.tradeShares} shares.`,
          isWarning: true
        };
      }
      const remainingShares = owned - this.tradeShares;
      return {
        isValid: true,
        message: `Valid Sale: Proceeds of +$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} will be credited to cash. Remaining shares: ${remainingShares.toFixed(2)}.`,
        isWarning: false
      };
    }
  }

  submitTrade(): void {
    if (!this.selectedInstrument || !this.validationStatus.isValid) return;

    try {
      const order = this.tradingService.executeTrade({
        ticker: this.selectedInstrument.ticker,
        orderType: this.tradeMode,
        shares: this.tradeShares
      });

      const action = this.tradeMode === 'BUY' ? 'Purchased' : 'Sold';
      this.showToast(
        `✓ Order Filled: ${action} ${order.quantity} ${order.ticker} for $${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        'success'
      );
    } catch (err: any) {
      this.showToast(`Order Failed: ${err.message}`, 'error');
    }
  }

  // ==========================================================================
  // User Account Switcher
  // ==========================================================================
  openUserSwitcher(): void {
    this.userSwitcherOpen = true;
  }

  closeUserSwitcher(): void {
    this.userSwitcherOpen = false;
  }

  switchUser(userId: number): void {
    this.tradingService.switchUser(userId);
    this.closeUserSwitcher();
    this.showToast(`Switched active profile to ${this.tradingService.currentUser().fullName}`, 'info');
  }

  // Toast System
  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 4000);
  }
}
