import { Component, HostListener, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { finalize, switchMap } from 'rxjs/operators';
import { MetricsService } from '../../../core/services/metrics.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import {
  AllMetricsResponse,
  TransactionLog,
  TradeVolumeByType,
  TradeVolumeOverTime,
  AumMetric
} from '../../../core/models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-container animate-fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Trading Analytics</h1>
        </div>
        <div class="header-actions">
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

      <!-- KPI Stat Grid with Clean Line Dividers -->
      <div class="stats-panel glass-panel">
        <div class="stat-col">
          <div class="stat-title-row">
            <div class="stat-icon-wrap cyan">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <span class="stat-label">Total Trade Volume</span>
          </div>
          <div class="stat-val mono-font">\${{ totalVolumeFormatted() }}</div>
        </div>

        <div class="stat-col">
          <div class="stat-title-row">
            <div class="stat-icon-wrap blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
            </div>
            <span class="stat-label">Audited Orders</span>
          </div>
          <div class="stat-val mono-font">{{ totalOrdersCount() }}</div>
        </div>

        <div class="stat-col">
          <div class="stat-title-row">
            <div class="stat-icon-wrap cognac">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <span class="stat-label">Active Instruments</span>
          </div>
          <div class="stat-val mono-font">{{ availableInstruments().length }}</div>
        </div>

        <div class="stat-col">
          <div class="stat-title-row">
            <div class="stat-icon-wrap emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <span class="stat-label">Assets Under Mgmt</span>
          </div>
          <div class="stat-val mono-font text-emerald">\${{ aumFormatted() }}</div>
        </div>
      </div>

      <!-- Trading Activity Explorer with flexbox layout -->
      <div class="activity-section glass-panel">
        <div class="card-title-row">
          <h2 class="card-title">Trading Activity Explorer</h2>
        </div>

        <div class="activity-filters">
          <!-- Searchable Dropdown for Instrument -->
          <div class="filter-field search-dropdown-container">
            <span>Instrument</span>
            <div class="search-dropdown-anchor">
              <button
                type="button"
                class="input-control search-dropdown-trigger"
                (click)="toggleInstrumentDropdown($event)"
              >
                <span class="trigger-label">{{ selectedInstrument() === 'ALL' ? 'All instruments' : selectedInstrument() }}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div *ngIf="instrumentDropdownOpen()" class="search-dropdown-menu animate-fade-in" (click)="$event.stopPropagation()">
                <div class="search-box-wrap">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    class="dropdown-search-input"
                    placeholder="Search instrument..."
                    [ngModel]="instrumentSearchText()"
                    (ngModelChange)="instrumentSearchText.set($event)"
                  />
                </div>
                <div class="dropdown-options-list">
                  <div
                    class="dropdown-item"
                    [class.selected]="selectedInstrument() === 'ALL'"
                    (click)="selectInstrument('ALL')"
                  >
                    All instruments
                  </div>
                  <div
                    *ngFor="let inst of filteredInstrumentDropdownOptions()"
                    class="dropdown-item"
                    [class.selected]="selectedInstrument() === inst"
                    (click)="selectInstrument(inst)"
                  >
                    {{ inst }}
                  </div>
                  <div *ngIf="filteredInstrumentDropdownOptions().length === 0" class="dropdown-empty">
                    No instruments found
                  </div>
                </div>
              </div>
            </div>
          </div>

          <label class="filter-field">
            <span>Period</span>
            <select class="input-control" [ngModel]="selectedPeriodDays()" (ngModelChange)="onPeriodChange($event)">
              <option [ngValue]="7">Last 7 days</option>
              <option [ngValue]="30">Last 30 days</option>
              <option [ngValue]="90">Last 90 days</option>
              <option [ngValue]="365">Last 12 months</option>
              <option [ngValue]="0">All available</option>
            </select>
          </label>

          <!-- Searchable Dropdown for Client -->
          <div class="filter-field search-dropdown-container">
            <span>Client</span>
            <div class="search-dropdown-anchor">
              <button
                type="button"
                class="input-control search-dropdown-trigger"
                (click)="toggleClientDropdown($event)"
              >
                <span class="trigger-label">{{ selectedClient() === 'ALL' ? 'All clients' : selectedClient() }}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div *ngIf="clientDropdownOpen()" class="search-dropdown-menu animate-fade-in" (click)="$event.stopPropagation()">
                <div class="search-box-wrap">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    class="dropdown-search-input"
                    placeholder="Search client..."
                    [ngModel]="clientSearchText()"
                    (ngModelChange)="clientSearchText.set($event)"
                  />
                </div>
                <div class="dropdown-options-list">
                  <div
                    class="dropdown-item"
                    [class.selected]="selectedClient() === 'ALL'"
                    (click)="selectClient('ALL')"
                  >
                    All clients
                  </div>
                  <div
                    *ngFor="let client of filteredClientDropdownOptions()"
                    class="dropdown-item"
                    [class.selected]="selectedClient() === client"
                    (click)="selectClient(client)"
                  >
                    {{ client }}
                  </div>
                  <div *ngIf="filteredClientDropdownOptions().length === 0" class="dropdown-empty">
                    No clients found
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Backdrop to close dropdowns when clicking outside -->
          <div *ngIf="clientDropdownOpen() || instrumentDropdownOpen()" class="dropdown-backdrop" (click)="closeDropdowns()"></div>
        </div>

        <div class="activity-summary">
          <div class="summary-pill">
            <span class="summary-label">Filtered Trades</span>
            <span class="summary-value mono-font">{{ filteredTradeCount().toLocaleString() }}</span>
          </div>
          <div class="summary-pill">
            <span class="summary-label">Filtered Volume</span>
            <span class="summary-value mono-font">\${{ filteredVolumeFormatted() }}</span>
          </div>
          <div class="summary-pill">
            <span class="summary-label">Active Days</span>
            <span class="summary-value mono-font">{{ activityBuckets().length }}</span>
          </div>
        </div>
      </div>

      <!-- Charts Grid (Volume Velocity & Instrument Distribution) -->
      <div class="charts-grid">
        <!-- Main Line Chart: Volume Over Time -->
        <div class="chart-card glass-panel line-chart-card">
          <div class="card-title-row">
            <h2 class="card-title">Trading Volume Velocity (Over Time)</h2>
          </div>
          <div class="chart-wrapper">
            <canvas #volumeTimeCanvas></canvas>
          </div>
        </div>

        <!-- Doughnut Chart: By Instrument Type -->
        <div class="chart-card glass-panel doughnut-chart-card">
          <div class="card-title-row">
            <h2 class="card-title">Volume by Instrument Type</h2>
          </div>
          <div class="chart-wrapper square">
            <canvas #instrumentTypeCanvas></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding-bottom: 2px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.3px;
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

    /* KPI Panel with clean line divisions */
    .stats-panel {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      padding: 0;
      overflow: hidden;
    }

    .stat-col {
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-right: 1px solid var(--border-subtle);
    }

    .stat-col:last-child {
      border-right: none;
    }

    .stat-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stat-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon-wrap.cyan {
      background: rgba(122, 70, 56, 0.08);
      color: #7A4638;
      border: 1px solid rgba(122, 70, 56, 0.2);
    }

    .stat-icon-wrap.blue {
      background: rgba(76, 47, 36, 0.08);
      color: #4C2F24;
      border: 1px solid rgba(76, 47, 36, 0.2);
    }

    .stat-icon-wrap.cognac {
      background: rgba(160, 104, 32, 0.08);
      color: #A06820;
      border: 1px solid rgba(160, 104, 32, 0.2);
    }

    .stat-icon-wrap.emerald {
      background: rgba(0, 127, 75, 0.08);
      color: #007F4B;
      border: 1px solid rgba(0, 127, 75, 0.2);
    }

    .stat-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }

    .stat-val {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.1;
      margin-top: 2px;
    }

    .stat-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .stat-sub.positive {
      color: #007F4B;
    }

    .trend-pill {
      font-weight: 700;
    }

    .text-emerald { color: #007F4B; }

    @media (max-width: 1024px) {
      .stats-panel {
        grid-template-columns: repeat(2, 1fr);
      }
      .stat-col:nth-child(2) {
        border-right: none;
      }
      .stat-col:nth-child(1), .stat-col:nth-child(2) {
        border-bottom: 1px solid var(--border-subtle);
      }
    }

    @media (max-width: 640px) {
      .stats-panel {
        grid-template-columns: 1fr;
      }
      .stat-col {
        border-right: none;
        border-bottom: 1px solid var(--border-subtle);
      }
      .stat-col:last-child {
        border-bottom: none;
      }
    }

    /* Activity Explorer */
    .activity-section {
      padding: 18px 22px;
    }

    .card-title-row {
      margin-bottom: 14px;
    }

    .card-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.2px;
    }

    .activity-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 14px;
      margin-bottom: 16px;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      min-width: 180px;
      flex: 1;
    }

    .input-control {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      background: #F8F3EE;
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 600;
    }

    .search-dropdown-container {
      position: relative;
      min-width: 180px;
    }

    .search-dropdown-anchor {
      position: relative;
    }

    .search-dropdown-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      cursor: pointer;
      text-align: left;
      font-size: 12.5px;
      font-weight: 600;
      width: 100%;
    }

    .trigger-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .search-dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 220px;
      z-index: 100;
      background: #F8F3EE;
      border: 1px solid rgba(76, 47, 36, 0.2);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-md);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .search-box-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      background: #F8F3EE;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
    }

    .search-box-wrap svg {
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .dropdown-search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 12px;
      color: var(--text-primary);
      width: 100%;
    }

    .dropdown-options-list {
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .dropdown-item {
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .dropdown-item:hover {
      background: #EEE7DF;
      color: var(--accent-cognac);
    }

    .dropdown-item.selected {
      background: #4C2F24;
      color: #F1ECE6;
    }

    .dropdown-empty {
      padding: 10px;
      font-size: 11.5px;
      color: var(--text-muted);
      text-align: center;
    }

    .dropdown-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99;
      background: transparent;
    }

    .activity-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid var(--border-subtle);
    }

    .summary-pill {
      background: #F8F3EE;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 8px 14px;
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .summary-label {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.45px;
      font-weight: 700;
    }

    .summary-value {
      font-size: 14px;
      color: var(--text-primary);
      font-weight: 800;
    }

    /* Charts Grid - 2 columns: Line velocity and Doughnut */
    .charts-grid {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 16px;
    }

    .chart-card {
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
    }

    .chart-wrapper {
      position: relative;
      height: 290px;
      width: 100%;
    }

    .chart-wrapper.square {
      height: 290px;
    }

    @media (max-width: 960px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('volumeTimeCanvas') volumeTimeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('instrumentTypeCanvas') instrumentTypeCanvas!: ElementRef<HTMLCanvasElement>;

  loading = signal(false);
  totalVolume = signal(0);
  totalOrders = signal(0);
  aumValue = signal(0);
  txnLogs = signal<TransactionLog[]>([]);
  selectedInstrument = signal('ALL');
  selectedClient = signal('ALL');
  selectedPeriodDays = signal(30);

  clientSearchText = signal('');
  clientDropdownOpen = signal(false);

  instrumentSearchText = signal('');
  instrumentDropdownOpen = signal(false);

  filteredClientDropdownOptions = computed(() => {
    const query = this.clientSearchText().trim().toLowerCase();
    const all = this.availableClients();
    if (!query) return all;
    return all.filter(c => c.toLowerCase().includes(query));
  });

  filteredInstrumentDropdownOptions = computed(() => {
    const query = this.instrumentSearchText().trim().toLowerCase();
    const all = this.availableInstruments();
    if (!query) return all;
    return all.filter(i => i.toLowerCase().includes(query));
  });

  private charts: Chart[] = [];
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly autoRefreshMs = 15000;
  private viewReady = false;
  private baseTimeData: TradeVolumeOverTime[] = [];

  constructor(
    private metricsService: MetricsService,
    private auditLogService: AuditLogService
  ) {}

  ngOnInit() {
    // Canvas initialized in ngAfterViewInit
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.loadMetrics();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.destroyCharts();
  }

  loadMetrics() {
    if (!this.viewReady) {
      return;
    }

    this.loading.set(true);

    this.metricsService.refreshMetrics().pipe(
      switchMap(() => this.metricsService.getAllMetrics()),
      finalize(() => this.loading.set(false))
    ).subscribe((response: AllMetricsResponse) => {
      const all = response.data || {};

      const timeData = ((all['trade_volume_over_time'] || all['volume_over_time'] || []) as TradeVolumeOverTime[])
        .map(item => ({
          ...item,
          total_value: Number((item as any).total_value ?? (item as any).total_amount ?? 0),
          order_count: Number((item as any).order_count ?? (item as any).transaction_count ?? 0)
        }));

      const vol = timeData.reduce((acc: number, curr: TradeVolumeOverTime) => acc + curr.total_value, 0);
      const orders = timeData.reduce((acc: number, curr: TradeVolumeOverTime) => acc + curr.order_count, 0);
      this.totalVolume.set(vol);
      this.totalOrders.set(orders);
      this.baseTimeData = timeData;
      this.updateLineChart(this.activityBuckets().length > 0 ? this.activityBuckets() : this.baseTimeData);

      const aum = (all['aum'] || []) as AumMetric[];
      const totalAum = aum.reduce(
        (acc: number, item: AumMetric) => acc + Number((item as any).total_value ?? (item as any).total_aum ?? 0),
        0
      );
      this.aumValue.set(totalAum);

      const types = (all['trade_volume_by_type'] || all['volume_by_type'] || []) as TradeVolumeByType[];
      this.updateDoughnutChart(types);
    });

    this.auditLogService.getTransactionLogs().subscribe((logs: TransactionLog[]) => {
      this.txnLogs.set(logs);
      this.updateLineChart(this.activityBuckets().length > 0 ? this.activityBuckets() : this.baseTimeData);
    });
  }

  totalVolumeFormatted(): string {
    return this.totalVolume().toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  totalOrdersCount(): string {
    return this.totalOrders().toLocaleString();
  }

  aumFormatted(): string {
    return this.aumValue().toLocaleString();
  }

  availableInstruments(): string[] {
    const instruments = new Set<string>();

    this.txnLogs().forEach((txn) => {
      const label = this.getInstrumentLabel(txn);
      if (label) {
        instruments.add(label);
      }
    });

    return [...instruments].sort((a, b) => a.localeCompare(b));
  }

  availableClients(): string[] {
    const clients = new Set<string>();

    this.txnLogs().forEach((txn) => {
      const label = this.getClientLabel(txn);
      if (label) {
        clients.add(label);
      }
    });

    return [...clients].sort((a, b) => a.localeCompare(b));
  }

  activityBuckets(): TradeVolumeOverTime[] {
    const selectedPeriod = this.selectedPeriodDays();
    const selectedClient = this.selectedClient();
    const selectedInstrument = this.selectedInstrument();
    const now = Date.now();
    const minTimestamp = selectedPeriod > 0 ? now - (selectedPeriod * 24 * 60 * 60 * 1000) : 0;

    const buckets = new Map<string, TradeVolumeOverTime>();

    this.txnLogs()
      .filter((txn) => this.isTradeTransaction(txn))
      .filter((txn) => {
        const eventTime = Date.parse(txn.timestamp || txn.happenedAt || '');
        if (Number.isNaN(eventTime)) {
          return false;
        }

        if (minTimestamp > 0 && eventTime < minTimestamp) {
          return false;
        }

        if (selectedClient !== 'ALL' && this.getClientLabel(txn) !== selectedClient) {
          return false;
        }

        if (selectedInstrument !== 'ALL' && this.getInstrumentLabel(txn) !== selectedInstrument) {
          return false;
        }

        return true;
      })
      .forEach((txn) => {
        const dateKey = this.toDateKey(txn.timestamp || txn.happenedAt || '');
        if (!dateKey) {
          return;
        }

        const existing = buckets.get(dateKey) || {
          time_bucket: dateKey,
          order_count: 0,
          total_quantity: 0,
          total_value: 0
        };

        const quantity = Number(txn.quantity || 0);
        const price = Number(txn.price || txn.stockPrice || 0);
        const amount = txn.amount == null ? quantity * price : Number(txn.amount);

        existing.order_count += 1;
        existing.total_quantity += quantity;
        existing.total_value += Number.isFinite(amount) ? amount : 0;

        buckets.set(dateKey, existing);
      });

    return [...buckets.values()].sort((left, right) => {
      const leftTime = Date.parse(left.time_bucket || left.trade_date || '');
      const rightTime = Date.parse(right.time_bucket || right.trade_date || '');
      return leftTime - rightTime;
    });
  }

  filteredTradeCount(): number {
    return this.activityBuckets().reduce((sum, bucket) => sum + bucket.order_count, 0);
  }

  filteredVolumeFormatted(): string {
    const total = this.activityBuckets().reduce((sum, bucket) => sum + bucket.total_value, 0);
    return total.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  onInstrumentChange(nextValue: string) {
    this.selectedInstrument.set(nextValue || 'ALL');
    this.updateLineChart(this.activityBuckets().length > 0 ? this.activityBuckets() : this.baseTimeData);
  }

  onPeriodChange(nextValue: number) {
    this.selectedPeriodDays.set(Number(nextValue || 0));
    this.updateLineChart(this.activityBuckets().length > 0 ? this.activityBuckets() : this.baseTimeData);
  }

  onClientChange(nextValue: string) {
    this.selectedClient.set(nextValue || 'ALL');
    this.updateLineChart(this.activityBuckets().length > 0 ? this.activityBuckets() : this.baseTimeData);
  }

  toggleClientDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.clientDropdownOpen.set(!this.clientDropdownOpen());
    if (this.clientDropdownOpen()) {
      this.instrumentDropdownOpen.set(false);
    }
  }

  selectClient(client: string) {
    this.selectedClient.set(client);
    this.clientDropdownOpen.set(false);
    this.onClientChange(client);
  }

  toggleInstrumentDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.instrumentDropdownOpen.set(!this.instrumentDropdownOpen());
    if (this.instrumentDropdownOpen()) {
      this.clientDropdownOpen.set(false);
    }
  }

  selectInstrument(inst: string) {
    this.selectedInstrument.set(inst);
    this.instrumentDropdownOpen.set(false);
    this.onInstrumentChange(inst);
  }

  // Esc closes any open filter dropdown.
  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeDropdowns();
  }

  closeDropdowns() {
    this.clientDropdownOpen.set(false);
    this.instrumentDropdownOpen.set(false);
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.loadMetrics();
    }, this.autoRefreshMs);
  }

  // One row per executed trade: an order's fill (or an older log that recorded the trade itself as BUY/SELL). An
  // order's other lifecycle events (placed, waiting, accepted, rejected, cancelled, expired) would count the same
  // order again, or count orders that never traded.
  private isTradeTransaction(txn: TransactionLog): boolean {
    const event = String(txn.event || '').toUpperCase();
    return event === 'ORDER_FILLED' || event === 'BUY' || event === 'SELL';
  }

  private getInstrumentLabel(txn: TransactionLog): string {
    if (txn.ticker && String(txn.ticker).trim()) {
      return String(txn.ticker).trim().toUpperCase();
    }

    if (txn.instrumentId) {
      return `INST #${txn.instrumentId}`;
    }

    return '';
  }

  private getClientLabel(txn: TransactionLog): string {
    if (txn.userId) {
      return `Client #${txn.userId}`;
    }

    if (txn.accountId) {
      return `Account #${txn.accountId}`;
    }

    return '';
  }

  private toDateKey(value: string): string {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return '';
    }

    return new Date(parsed).toISOString().slice(0, 10);
  }

  private updateLineChart(data: TradeVolumeOverTime[]) {
    if (!this.volumeTimeCanvas) return;
    const ctx = this.volumeTimeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const existing = this.charts.find(c => c.canvas === this.volumeTimeCanvas.nativeElement);
    if (existing) existing.destroy();

    const labels = data.map(d => d.time_bucket || d.trade_date || '');
    const values = data.map(d => d.total_value);

    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(122, 70, 56, 0.22)');
    gradient.addColorStop(1, 'rgba(122, 70, 56, 0.0)');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Daily Traded Volume ($)',
          data: values,
          borderColor: '#4C2F24',
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#7A4638',
          pointBorderColor: '#F8F3EE',
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
            backgroundColor: '#4C2F24',
            titleColor: '#F1ECE6',
            bodyColor: '#e0a973',
            borderColor: 'rgba(76, 47, 36, 0.2)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(76, 47, 36, 0.06)' },
            ticks: { color: '#5E463C', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(76, 47, 36, 0.06)' },
            ticks: {
              color: '#5E463C',
              font: { size: 11 },
              callback: (val) => '$' + Number(val).toLocaleString()
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
          backgroundColor: ['#4C2F24', '#7A4638', '#c27d38', '#007F4B'],
          borderColor: '#F8F3EE',
          borderWidth: 2
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
}
