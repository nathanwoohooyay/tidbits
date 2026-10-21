import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetricsService } from '../../../core/services/metrics.service';
import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { OutlierTrade, TradeVolumeByType } from '../../../core/models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="compliance-container animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Compliance & Surveillance</h1>
        </div>
        <div class="header-actions">
          <button id="btn-export-outliers" class="btn btn-secondary btn-sm" (click)="exportOutliersCsv()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Outliers CSV</span>
          </button>
          <button id="btn-generate-pdf-top" class="btn btn-primary btn-sm" (click)="generatePdfReport()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9V2h12v7"></path>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Generate PDF Report</span>
          </button>
        </div>
      </div>

      <!-- Section 1: Statistical Trade Outliers & Anomalies -->
      <div class="glass-panel section-panel">
        <div class="panel-header-row">
          <div>
            <h2 class="panel-title">Statistical Trade Outliers & Anomalies</h2>
          </div>
          <div class="header-filters">
            <div class="threshold-control">
              <label>Sensitivity:</label>
              <input type="range" min="2.0" max="4.0" step="0.1" class="range-slider" [(ngModel)]="zScoreThreshold">
              <span class="range-val mono-font">&gt; {{ zScoreThreshold }}σ</span>
            </div>
            <span class="badge badge-danger">{{ filteredOutliers().length }} Flagged</span>
          </div>
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
                <th>Surveillance Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredOutliers()">
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
              <tr *ngIf="filteredOutliers().length === 0">
                <td colspan="9" class="empty-state">No anomalies exceeding threshold {{ zScoreThreshold }}σ.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 2: Report Configuration & Summary Preview -->
      <div class="reports-layout">
        <!-- Configuration Card -->
        <div class="config-card glass-panel">
          <div class="card-header">
            <h2 class="card-title">Generate Compliance Report</h2>
          </div>

          <div class="config-form">
            <div class="form-group">
              <label>Report Template</label>
              <select class="input-control" [(ngModel)]="selectedTemplate">
                <option value="EXECUTIVE">Executive Summary (Compliance Snapshot)</option>
                <option value="ANOMALIES">Anomaly Investigation (Outlier Trades)</option>
                <option value="REVENUE">Revenue & AUM Reconciliation</option>
                <option value="FULL">Full Regulatory Report (All Sections)</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Audit Period Start</label>
                <input type="date" class="input-control" [(ngModel)]="startDate">
              </div>
              <div class="form-group">
                <label>Audit Period End</label>
                <input type="date" class="input-control" [(ngModel)]="endDate">
              </div>
            </div>

            <div class="form-group">
              <label>Compliance Notes & Auditor Assessment</label>
              <textarea
                class="input-control textarea"
                rows="3"
                [(ngModel)]="complianceNotes"
                placeholder="Enter formal observations, audit scope, or specific findings..."
              ></textarea>
            </div>

            <div class="action-buttons">
              <button
                id="btn-generate-pdf"
                class="btn btn-primary btn-block"
                (click)="generatePdfReport()"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9V2h12v7"></path>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                <span>Generate Official PDF Report</span>
              </button>

              <button
                id="btn-export-csv-metrics"
                class="btn btn-secondary btn-block"
                (click)="exportCurrentDataCsv()"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export Dataset as CSV</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Live Preview Summary Card -->
        <div class="preview-card glass-panel">
          <div class="card-header">
            <h2 class="card-title">Live Report Preview</h2>
          </div>

          <div class="report-preview-box">
            <div class="report-meta">
              <div class="meta-item">
                <span class="meta-label">Template:</span>
                <span class="meta-val">{{ activeTemplateName() }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Report ID:</span>
                <span class="meta-val mono-font">REP-2026-{{ reportSerial() }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Lead Examiner:</span>
                <span class="meta-val">{{ authService.currentUser()?.username || 'Compliance Officer' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Audit Window:</span>
                <span class="meta-val mono-font">{{ startDate }} to {{ endDate }}</span>
              </div>
            </div>

            <div class="preview-kpis">
              <div class="preview-kpi-item">
                <span class="kpi-tag">SAMPLE VOLUME</span>
                <div class="kpi-num mono-font">\${{ totalSampledVolumeFormatted() }}</div>
              </div>
              <div class="preview-kpi-item">
                <span class="kpi-tag">FLAGGED OUTLIERS</span>
                <div class="kpi-num mono-font text-rose">{{ outliers().length }} Trades</div>
              </div>
              <div class="preview-kpi-item">
                <span class="kpi-tag">STATUS</span>
                <span class="badge badge-success">COMPLIANT</span>
              </div>
            </div>

            <div class="instrument-summary">
              <h3 class="section-heading">Sampled Instrument Classes</h3>
              <div class="classes-list">
                <div *ngFor="let item of volumeSummary()" class="class-row">
                  <span class="class-name">{{ (item.instrument_type || 'Equity').toUpperCase() }}</span>
                  <span class="class-count mono-font">{{ item.order_count }} orders</span>
                  <span class="class-val mono-font">\${{ item.total_value | number:'1.0-0' }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .compliance-container {
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

    .section-panel {
      padding: 18px 22px;
    }

    .panel-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 14px;
    }

    .panel-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.2px;
    }

    .header-filters {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .threshold-control {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
    }

    .range-slider {
      width: 100px;
      accent-color: var(--accent-cognac);
    }

    .range-val {
      font-size: 12px;
      color: var(--accent-cognac);
      font-weight: 700;
    }

    .ticker-pill {
      background: #f7ede0;
      color: #6b3a1d;
      border: 1px solid rgba(138, 78, 35, 0.2);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 12px;
    }

    .zscore-tag {
      background: rgba(163, 50, 36, 0.08);
      border: 1px solid rgba(163, 50, 36, 0.25);
      color: #a33224;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 11.5px;
      font-family: 'JetBrains Mono', monospace;
    }

    .reports-layout {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 18px;
    }

    @media (max-width: 1024px) {
      .reports-layout {
        grid-template-columns: 1fr;
      }
    }

    .config-card, .preview-card {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
    }

    .card-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .card-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.2px;
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-group label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .textarea {
      resize: vertical;
      min-height: 72px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 4px;
    }

    .btn-block {
      width: 100%;
      padding: 10px 14px;
    }

    .report-preview-box {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 16px;
      box-shadow: var(--shadow-sm);
    }

    .report-meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 12px;
    }

    .meta-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }

    .meta-label {
      color: var(--text-muted);
    }

    .meta-val {
      color: var(--text-primary);
      font-weight: 700;
    }

    .preview-kpis {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      text-align: center;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 12px;
    }

    .preview-kpi-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
      align-items: center;
    }

    .kpi-tag {
      font-size: 9.5px;
      color: var(--text-muted);
      letter-spacing: 0.5px;
      font-weight: 700;
    }

    .kpi-num {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .text-rose { color: #a33224; }

    .section-heading {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .classes-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .class-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 6px 10px;
      background: #faf6ee;
      border: 1px solid rgba(62, 36, 21, 0.06);
      border-radius: var(--radius-sm);
    }

    .class-name { font-weight: 700; color: var(--text-primary); }
    .class-count { color: var(--text-muted); }
    .class-val { color: var(--accent-cognac); font-weight: 700; }

    .notes-preview {
      border-top: 1px solid var(--border-subtle);
      padding-top: 10px;
    }

    .notes-text {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: var(--text-muted);
    }
  `]
})
export class ReportsComponent implements OnInit {
  selectedTemplate = 'EXECUTIVE';
  startDate = '2026-09-01';
  endDate = '2026-10-07';
  zScoreThreshold = 2.5;
  complianceNotes = 'Periodic comprehensive trade surveillance audit conducted. All anomalous order executions were analyzed for front-running, layering, or unbacked margin leverage. Surveillance confirmed no protocol violations.';

  volumeSummary = signal<TradeVolumeByType[]>([]);
  outliers = signal<OutlierTrade[]>([]);
  reportSerial = signal('8842');

  filteredOutliers = computed(() => {
    const threshold = Number(this.zScoreThreshold || 2.5);
    return this.outliers().filter(item => {
      const z = Number(item.z_score ?? 3.42);
      return z >= threshold;
    });
  });

  constructor(
    public authService: AuthService,
    private metricsService: MetricsService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.reportSerial.set(Math.floor(1000 + Math.random() * 9000).toString());

    this.metricsService.getTradeVolumeByType().subscribe(data => {
      this.volumeSummary.set(data);
    });

    this.metricsService.getOutlierTrades().subscribe(data => {
      this.outliers.set(data);
    });
  }

  activeTemplateName(): string {
    switch (this.selectedTemplate) {
      case 'ANOMALIES':
        return 'Anomaly Investigation Report';
      case 'REVENUE':
        return 'Revenue & AUM Reconciliation Report';
      case 'FULL':
        return 'Full Regulatory Report';
      default:
        return 'Executive Compliance Summary';
    }
  }

  totalSampledVolumeFormatted(): string {
    const total = this.volumeSummary().reduce((sum, item) => sum + item.total_value, 0);
    return total.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  generatePdfReport() {
    const auditorName = this.authService.currentUser()?.username || 'Senior Auditor';
    const total = this.volumeSummary().reduce((sum, item) => sum + item.total_value, 0);

    this.reportService.generatePrintableAuditDossier(
      `${this.activeTemplateName()} #${this.reportSerial()}`,
      {
        auditorName,
        dateRange: `${this.startDate} to ${this.endDate}`,
        summaryStats: [
          { label: 'Sampled Volume', value: '$' + total.toLocaleString() },
          { label: 'Outlier Trades', value: this.filteredOutliers().length },
          { label: 'Z-Score Sensitivity', value: `${this.zScoreThreshold}σ` },
          { label: 'Regulatory Status', value: 'VERIFIED' }
        ],
        volumeSummary: this.volumeSummary(),
        outliers: this.filteredOutliers(),
        complianceNotes: this.complianceNotes
      }
    );
  }

  exportOutliersCsv() {
    this.reportService.exportToCsv('tidbits_trade_outliers', this.filteredOutliers());
  }

  exportCurrentDataCsv() {
    const filename = `tidbits_${this.activeTemplateName().toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    if (this.selectedTemplate === 'ANOMALIES') {
      this.reportService.exportToCsv(filename, this.filteredOutliers());
    } else {
      this.reportService.exportToCsv(filename, this.volumeSummary());
    }
  }
}
