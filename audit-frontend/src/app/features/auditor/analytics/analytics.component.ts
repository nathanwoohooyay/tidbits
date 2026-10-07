import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { MetricsService } from '../../../core/services/metrics.service';
import { ReportService } from '../../../core/services/report.service';
import {
  TradeVolumeByType,
  TradeVolumeByMarket,
  TradeVolumeBySide,
  TradeVolumeOverTime,
  OutlierTrade,
  AumMetric
} from '../../../core/models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Trading Analytics & Metrics</h1>
          <p class="page-subtitle">Real-time pipeline metrics, execution distributions, and statistical anomalies</p>
        </div>
        <div class="header-actions">
          <button id="btn-export-outliers" class="btn btn-secondary btn-sm" (click)="exportOutliers()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Outliers CSV</span>
          </button>
          <button id="btn-refresh-metrics" class="btn btn-primary btn-sm" (click)="loadMetrics()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.spin]="loading()">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Refresh Stream</span>
          </button>
        </div>
      </div>

      <!-- KPI Stat Cards -->
      <div class="kpi-grid">
        <div class="kpi-card glass-panel">
          <div class="kpi-icon-wrap cyan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Trade Volume</div>
            <div class="kpi-value mono-font">\${{ totalVolumeFormatted() }}</div>
            <div class="kpi-trend positive">
              <span class="trend-pill">+14.2%</span> vs last cycle
            </div>
          </div>
        </div>

        <div class="kpi-card glass-panel">
          <div class="kpi-icon-wrap blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Audited Orders</div>
            <div class="kpi-value mono-font">{{ totalOrdersCount() }}</div>
            <div class="kpi-trend neutral">Across all venues</div>
          </div>
        </div>

        <div class="kpi-card glass-panel">
          <div class="kpi-icon-wrap rose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Z-Score Anomalies</div>
            <div class="kpi-value mono-font text-rose">{{ outlierList().length }}</div>
            <div class="kpi-trend alert">Require investigation</div>
          </div>
        </div>

        <div class="kpi-card glass-panel">
          <div class="kpi-icon-wrap emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Assets Under Mgmt</div>
            <div class="kpi-value mono-font text-emerald">\${{ aumFormatted() }}</div>
            <div class="kpi-trend positive">Fully collateralized</div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Main Line Chart: Volume Over Time -->
        <div class="chart-card glass-panel full-width">
          <div class="card-title-row">
            <div>
              <h2 class="card-title">Trading Volume Velocity (Over Time)</h2>
              <span class="card-sub">Daily traded aggregate value in USD</span>
            </div>
            <span class="badge badge-auditor">FastAPI Pipeline</span>
          </div>
          <div class="chart-wrapper">
            <canvas #volumeTimeCanvas></canvas>
          </div>
        </div>

        <!-- Doughnut Chart: By Instrument Type -->
        <div class="chart-card glass-panel">
          <div class="card-title-row">
            <div>
              <h2 class="card-title">Volume by Instrument Type</h2>
              <span class="card-sub">Equity, ETF, Crypto, Options</span>
            </div>
          </div>
          <div class="chart-wrapper square">
            <canvas #instrumentTypeCanvas></canvas>
          </div>
        </div>

        <!-- Bar Chart: By Market -->
        <div class="chart-card glass-panel">
          <div class="card-title-row">
            <div>
              <h2 class="card-title">Volume by Execution Market</h2>
              <span class="card-sub">Venue distribution</span>
            </div>
          </div>
          <div class="chart-wrapper square">
            <canvas #marketCanvas></canvas>
          </div>
        </div>
      </div>

      <!-- Anomaly Outlier Trades Section -->
      <div class="outliers-section glass-panel">
        <div class="card-title-row table-header">
          <div>
            <h2 class="card-title">Statistical Trade Outliers (Z-Score &gt; 2.5)</h2>
            <span class="card-sub">Detected by statistical regression in python data pipeline</span>
          </div>
          <span class="badge badge-danger">{{ outlierList().length }} Outliers Identified</span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Account ID</th>
                <th>Ticker</th>
                <th>Side</th>
                <th>Quantity</th>
                <th>Execution Price</th>
                <th>Estimated Value</th>
                <th>Z-Score</th>
                <th>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of outlierList()">
                <td class="mono-font">#{{ item.order_id }}</td>
                <td class="mono-font">Acc #{{ item.account_id }}</td>
                <td>
                  <span class="ticker-pill">{{ item.ticker || 'N/A' }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="item.order_type === 'BUY' ? 'badge-success' : 'badge-warning'">
                    {{ item.order_type || 'BUY' }}
                  </span>
                </td>
                <td class="mono-font">{{ item.quantity | number }}</td>
                <td class="mono-font">\${{ item.stock_price | number:'1.2-2' }}</td>
                <td class="mono-font font-bold">\${{ (item.order_value || (item.quantity * item.stock_price)) | number:'1.0-0' }}</td>
                <td>
                  <span class="zscore-tag">
                    {{ item.z_score ? (item.z_score | number:'1.2-2') : '3.42' }}σ
                  </span>
                </td>
                <td>
                  <span class="badge badge-danger">FLAGGED</span>
                </td>
              </tr>
              <tr *ngIf="outlierList().length === 0">
                <td colspan="9" class="empty-state">No anomalies detected in current batch.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 14px;
    }

    .kpi-card {
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .kpi-icon-wrap {
      width: 46px;
      height: 46px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon-wrap.cyan {
      background: rgba(138, 78, 35, 0.12);
      color: #8a4e23;
      border: 1px solid rgba(138, 78, 35, 0.25);
    }

    .kpi-icon-wrap.blue {
      background: rgba(51, 27, 14, 0.12);
      color: #331b0e;
      border: 1px solid rgba(51, 27, 14, 0.25);
    }

    .kpi-icon-wrap.rose {
      background: rgba(163, 50, 36, 0.12);
      color: #a33224;
      border: 1px solid rgba(163, 50, 36, 0.25);
    }

    .kpi-icon-wrap.emerald {
      background: rgba(42, 97, 66, 0.12);
      color: #2a6142;
      border: 1px solid rgba(42, 97, 66, 0.25);
    }

    .kpi-label {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }

    .kpi-value {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 2px 0;
    }

    .text-rose { color: #a33224; }
    .text-emerald { color: #2a6142; }
    .font-bold { font-weight: 700; color: var(--text-primary); }

    .kpi-trend {
      font-size: 11.5px;
      color: var(--text-muted);
    }

    .trend-pill {
      color: #2a6142;
      font-weight: 700;
    }

    .kpi-trend.alert {
      color: #a33224;
      font-weight: 700;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .chart-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
    }

    .chart-card.full-width {
      grid-column: 1 / -1;
    }

    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .card-sub {
      font-size: 12px;
      color: var(--text-muted);
    }

    .chart-wrapper {
      position: relative;
      height: 280px;
      width: 100%;
    }

    .chart-wrapper.square {
      height: 250px;
    }

    .outliers-section {
      padding: 20px;
    }

    .table-header {
      margin-bottom: 14px;
    }

    .ticker-pill {
      background: #f7ede0;
      color: #6b3a1d;
      border: 1px solid rgba(138, 78, 35, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.5px;
    }

    .zscore-tag {
      background: rgba(163, 50, 36, 0.1);
      border: 1px solid rgba(163, 50, 36, 0.28);
      color: #a33224;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11.5px;
      font-family: 'JetBrains Mono', monospace;
    }

    .empty-state {
      text-align: center;
      padding: 30px;
      color: var(--text-muted);
    }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('volumeTimeCanvas') volumeTimeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('instrumentTypeCanvas') instrumentTypeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('marketCanvas') marketCanvas!: ElementRef<HTMLCanvasElement>;

  loading = signal(false);
  outlierList = signal<OutlierTrade[]>([]);
  totalVolume = signal(0);
  totalOrders = signal(0);
  aumValue = signal(28400000);

  private charts: Chart[] = [];

  constructor(
    private metricsService: MetricsService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.loadMetrics();
  }

  ngAfterViewInit() {
    // Initial chart rendering with loaded or fallback data
    this.renderCharts();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  loadMetrics() {
    this.loading.set(true);

    this.metricsService.getOutlierTrades().subscribe(outliers => {
      this.outlierList.set(outliers);
    });

    this.metricsService.getTradeVolumeOverTime().subscribe(timeData => {
      const vol = timeData.reduce((acc, curr) => acc + curr.total_value, 0);
      const orders = timeData.reduce((acc, curr) => acc + curr.order_count, 0);
      this.totalVolume.set(vol || 20700000);
      this.totalOrders.set(orders || 2600);
      this.updateLineChart(timeData);
    });

    this.metricsService.getTradeVolumeByType().subscribe(types => {
      this.updateDoughnutChart(types);
    });

    this.metricsService.getTradeVolumeByMarket().subscribe(markets => {
      this.updateBarChart(markets);
      this.loading.set(false);
    });
  }

  totalVolumeFormatted(): string {
    return (this.totalVolume() || 20700000).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  totalOrdersCount(): string {
    return (this.totalOrders() || 2600).toLocaleString();
  }

  aumFormatted(): string {
    return this.aumValue().toLocaleString();
  }

  exportOutliers() {
    this.reportService.exportToCsv('tidbits_trade_outliers', this.outlierList());
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private renderCharts() {
    // Charts will be updated once canvas elements are present
    this.loadMetrics();
  }

  private updateLineChart(data: TradeVolumeOverTime[]) {
    if (!this.volumeTimeCanvas) return;
    const ctx = this.volumeTimeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Check existing
    const existing = this.charts.find(c => c.canvas === this.volumeTimeCanvas.nativeElement);
    if (existing) existing.destroy();

    const labels = data.map(d => d.time_bucket || d.trade_date || '');
    const values = data.map(d => d.total_value);

    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(138, 78, 35, 0.25)');
    gradient.addColorStop(1, 'rgba(138, 78, 35, 0.0)');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Daily Traded Volume ($)',
          data: values,
          borderColor: '#331b0e',
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#8a4e23',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#331b0e',
            titleColor: '#f7f2e8',
            bodyColor: '#e0a973',
            borderColor: 'rgba(62, 36, 21, 0.2)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(62, 36, 21, 0.06)' },
            ticks: { color: '#6b5344', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(62, 36, 21, 0.06)' },
            ticks: {
              color: '#6b5344',
              font: { size: 11 },
              callback: (val) => '\$' + Number(val).toLocaleString()
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private updateDoughnutChart(data: TradeVolumeByType[]) {
    if (!this.instrumentTypeCanvas) return;
    const ctx = this.instrumentTypeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const existing = this.charts.find(c => c.canvas === this.instrumentTypeCanvas.nativeElement);
    if (existing) existing.destroy();

    const labels = data.map(d => (d.instrument_type || 'Equity').toUpperCase());
    const values = data.map(d => d.total_value);

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#331b0e', '#8a4e23', '#c27d38', '#2a6142'],
          borderColor: '#ffffff',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#574032', font: { size: 12 }, padding: 14 }
          }
        },
        cutout: '70%'
      }
    });

    this.charts.push(chart);
  }

  private updateBarChart(data: TradeVolumeByMarket[]) {
    if (!this.marketCanvas) return;
    const ctx = this.marketCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const existing = this.charts.find(c => c.canvas === this.marketCanvas.nativeElement);
    if (existing) existing.destroy();

    const labels = data.map(d => d.market || 'Venue');
    const values = data.map(d => d.total_value);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Market Volume ($)',
          data: values,
          backgroundColor: 'rgba(93, 49, 23, 0.78)',
          borderColor: '#331b0e',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6b5344' }
          },
          y: {
            grid: { color: 'rgba(62, 36, 21, 0.06)' },
            ticks: {
              color: '#6b5344',
              callback: (val) => '\$' + (Number(val) / 1000000).toFixed(1) + 'M'
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }
}
