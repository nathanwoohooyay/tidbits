import { Component, OnInit, signal } from '@angular/core';
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
    <div class="reports-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Compliance Report Generator</h1>
          <p class="page-subtitle">Produce verified institutional audit dossiers, regulatory submissions, and dataset exports</p>
        </div>
        <div class="header-badges">
          <span class="badge badge-auditor">AUDITOR WORKSPACE</span>
        </div>
      </div>

      <div class="reports-layout">
        <!-- Configuration Card -->
        <div class="config-card glass-panel">
          <div class="card-header">
            <h2 class="card-title">Report Configuration</h2>
            <span class="card-sub">Define dossier parameters</span>
          </div>

          <div class="config-form">
            <div class="form-group">
              <label>Report Template</label>
              <select class="input-control" [(ngModel)]="selectedTemplate">
                <option value="EXECUTIVE">Executive Trading Compliance Audit</option>
                <option value="ANOMALIES">Outlier Trades & Market Abuse Investigation</option>
                <option value="REVENUE">AUM, Fees & Capital Reconciliation</option>
                <option value="FULL">Complete Platform Regulatory Dossier</option>
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
              <label>Anomaly Sensitivity Threshold</label>
              <div class="range-wrap">
                <input type="range" min="2.0" max="4.0" step="0.1" class="range-slider" [(ngModel)]="zScoreThreshold">
                <span class="range-val mono-font">&gt; {{ zScoreThreshold }}σ</span>
              </div>
            </div>

            <div class="form-group">
              <label>Compliance Notes & Auditor Assessment</label>
              <textarea
                class="input-control textarea"
                rows="3"
                [(ngModel)]="complianceNotes"
                placeholder="Enter formal observations, audit scope, or specific trade findings..."
              ></textarea>
            </div>

            <div class="action-buttons">
              <button
                id="btn-generate-pdf"
                class="btn btn-primary btn-block"
                (click)="generatePdfDossier()"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9V2h12v7"></path>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                <span>Generate Official PDF Dossier</span>
              </button>

              <button
                id="btn-export-csv-metrics"
                class="btn btn-secondary btn-block"
                (click)="exportCurrentDataCsv()"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <div class="preview-badge">LIVE PREVIEW</div>
            <h2 class="card-title">Dossier Executive Summary</h2>
            <span class="card-sub">Synchronized with FastAPI metrics pipeline</span>
          </div>

          <div class="dossier-preview">
            <div class="dossier-meta">
              <div class="meta-item">
                <span class="meta-label">Dossier ID:</span>
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

            <div class="notes-preview">
              <h3 class="section-heading">Lead Auditor Notes</h3>
              <p class="notes-text">{{ complianceNotes }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .reports-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 1024px) {
      .reports-layout {
        grid-template-columns: 1fr;
      }
    }

    .config-card, .preview-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
    }

    .card-header {
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .card-sub {
      font-size: 12px;
      color: var(--text-muted);
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 11.5px;
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

    .range-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .range-slider {
      flex: 1;
      accent-color: var(--accent-cognac);
    }

    .range-val {
      font-size: 13px;
      color: var(--accent-cognac);
      font-weight: 700;
    }

    .textarea {
      resize: vertical;
      min-height: 80px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
    }

    .preview-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      color: var(--accent-cognac);
      background: rgba(138, 78, 35, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .dossier-preview {
      display: flex;
      flex-direction: column;
      gap: 18px;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 18px;
      box-shadow: var(--shadow-sm);
    }

    .dossier-meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 14px;
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
      padding-bottom: 14px;
    }

    .preview-kpi-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    }

    .kpi-tag {
      font-size: 9.5px;
      color: var(--text-muted);
      letter-spacing: 0.5px;
      font-weight: 700;
    }

    .kpi-num {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .text-rose { color: #a33224; }

    .section-heading {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .classes-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .class-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 6px 10px;
      background: #faf6ee;
      border: 1px solid rgba(62, 36, 21, 0.06);
      border-radius: 4px;
    }

    .class-name { font-weight: 700; color: var(--text-primary); }
    .class-count { color: var(--text-muted); }
    .class-val { color: var(--accent-cognac); font-weight: 700; }

    .notes-preview {
      border-top: 1px solid var(--border-subtle);
      padding-top: 12px;
    }

    .notes-text {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.5;
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

  totalSampledVolumeFormatted(): string {
    const total = this.volumeSummary().reduce((sum, item) => sum + item.total_value, 0);
    return total.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  generatePdfDossier() {
    const auditorName = this.authService.currentUser()?.username || 'Senior Auditor';
    const total = this.volumeSummary().reduce((sum, item) => sum + item.total_value, 0);

    this.reportService.generatePrintableAuditDossier(
      `Tidbits Compliance Audit Dossier #${this.reportSerial()}`,
      {
        auditorName,
        dateRange: `${this.startDate} to ${this.endDate}`,
        summaryStats: [
          { label: 'Sampled Volume', value: '\$' + total.toLocaleString() },
          { label: 'Outlier Trades', value: this.outliers().length },
          { label: 'Z-Score Sensitivity', value: `${this.zScoreThreshold}σ` },
          { label: 'Regulatory Status', value: 'VERIFIED' }
        ],
        volumeSummary: this.volumeSummary(),
        outliers: this.outliers(),
        complianceNotes: this.complianceNotes
      }
    );
  }

  exportCurrentDataCsv() {
    const filename = `tidbits_audit_report_${this.selectedTemplate.toLowerCase()}`;
    if (this.selectedTemplate === 'ANOMALIES') {
      this.reportService.exportToCsv(filename, this.outliers());
    } else {
      this.reportService.exportToCsv(filename, this.volumeSummary());
    }
  }
}
