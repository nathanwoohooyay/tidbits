import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { ReportService } from '../../../core/services/report.service';
import { UserLog, TransactionLog } from '../../../core/models/models';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="logs-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Audit Event Logs</h1>
          <p class="page-subtitle">Immutable event streaming from Kafka: user identity events and order settlement transactions</p>
        </div>
        <div class="header-actions">
          <button id="btn-export-logs" class="btn btn-secondary btn-sm" (click)="exportLogsCsv()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>
          <button id="btn-refresh-logs" class="btn btn-primary btn-sm" (click)="loadLogs()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Tab Switcher & Filter Controls -->
      <div class="controls-card glass-panel">
        <div class="tabs-wrap">
          <button
            id="tab-user-logs"
            class="tab-btn"
            [class.active]="activeTab() === 'USER'"
            (click)="activeTab.set('USER')"
          >
            <span>User Activity Logs</span>
            <span class="tab-badge">{{ filteredUserLogs().length }}</span>
          </button>
          <button
            id="tab-txn-logs"
            class="tab-btn"
            [class.active]="activeTab() === 'TXN'"
            (click)="activeTab.set('TXN')"
          >
            <span>Transaction Logs</span>
            <span class="tab-badge">{{ filteredTxnLogs().length }}</span>
          </button>
        </div>

        <div class="filter-wrap">
          <div class="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              class="input-control search-input"
              placeholder="Filter by action, user, ticker..."
              [(ngModel)]="searchQuery"
            />
          </div>

          <div class="status-filters">
            <button
              class="status-pill"
              [class.active]="statusFilter() === 'ALL'"
              (click)="statusFilter.set('ALL')"
            >
              All
            </button>
            <button
              class="status-pill success"
              [class.active]="statusFilter() === 'SUCCESS'"
              (click)="statusFilter.set('SUCCESS')"
            >
              Success / Filled
            </button>
            <button
              class="status-pill failure"
              [class.active]="statusFilter() === 'FAILURE'"
              (click)="statusFilter.set('FAILURE')"
            >
              Failures
            </button>
          </div>
        </div>
      </div>

      <!-- User Logs Table -->
      <div *ngIf="activeTab() === 'USER'" class="glass-panel table-panel animate-fade-in">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Outcome</th>
                <th>IP Address</th>
                <th>Client Device</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of filteredUserLogs()">
                <td class="mono-font">#{{ log.userLogId }}</td>
                <td class="mono-font text-muted">{{ log.timestamp | date:'short' }}</td>
                <td>
                  <span class="user-pill">{{ log.username || ('User #' + log.userId) }}</span>
                </td>
                <td>
                  <span class="action-tag">{{ log.action || log.event || 'UNKNOWN' }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="log.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'">
                    {{ log.status }}
                  </span>
                </td>
                <td class="mono-font text-muted">{{ log.ipAddress || '127.0.0.1' }}</td>
                <td class="device-cell">{{ log.deviceInfo || 'Standard Web Session' }}</td>
              </tr>
              <tr *ngIf="filteredUserLogs().length === 0">
                <td colspan="7" class="empty-cell">No matching user audit events found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transaction Logs Table -->
      <div *ngIf="activeTab() === 'TXN'" class="glass-panel table-panel animate-fade-in">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Account</th>
                <th>Instrument</th>
                <th>Side</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total Value</th>
                <th>Execution Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let txn of filteredTxnLogs()">
                <td class="mono-font">#{{ txn.logId }}</td>
                <td class="mono-font text-muted">{{ txn.timestamp | date:'short' }}</td>
                <td class="mono-font">Acc #{{ txn.accountId }}</td>
                <td>
                  <span class="ticker-pill">{{ txn.ticker || ('Inst #' + txn.instrumentId) }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="txn.orderType === 'BUY' ? 'badge-success' : 'badge-warning'">
                    {{ txn.orderType }}
                  </span>
                </td>
                <td class="mono-font">{{ txn.quantity | number }}</td>
                <td class="mono-font">\${{ txn.price | number:'1.2-2' }}</td>
                <td class="mono-font font-bold">\${{ (txn.quantity * txn.price) | number:'1.2-2' }}</td>
                <td>
                  <span class="badge" [ngClass]="txn.status === 'FILLED' ? 'badge-success' : 'badge-warning'">
                    {{ txn.status }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="filteredTxnLogs().length === 0">
                <td colspan="9" class="empty-cell">No matching transaction logs found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .logs-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .controls-card {
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
    }

    .tabs-wrap {
      display: flex;
      gap: 8px;
      background: #ece3d2;
      padding: 4px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 13px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn.active {
      background: #331b0e;
      color: #f7f2e8;
    }

    .tab-badge {
      background: rgba(0, 0, 0, 0.12);
      padding: 1px 6px;
      border-radius: 9999px;
      font-size: 11px;
    }

    .filter-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 2px 10px;
    }

    .search-box svg {
      color: var(--text-muted);
    }

    .search-input {
      border: none;
      background: transparent;
      padding: 6px 0;
      width: 220px;
      font-size: 13px;
    }

    .search-input:focus {
      box-shadow: none;
      background: transparent;
    }

    .status-filters {
      display: flex;
      gap: 6px;
    }

    .status-pill {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .status-pill.active {
      background: #331b0e;
      color: #f7f2e8;
      border-color: #331b0e;
    }

    .status-pill.success.active {
      background: rgba(42, 97, 66, 0.18);
      color: #2a6142;
      border-color: #2a6142;
    }

    .status-pill.failure.active {
      background: rgba(163, 50, 36, 0.18);
      color: #a33224;
      border-color: #a33224;
    }

    .table-panel {
      padding: 0;
      overflow: hidden;
    }

    .user-pill {
      font-weight: 700;
      color: var(--text-primary);
    }

    .action-tag {
      background: #fbf7ef;
      border: 1px solid var(--border-subtle);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--accent-cognac);
    }

    .ticker-pill {
      background: #f7ede0;
      color: #6b3a1d;
      border: 1px solid rgba(138, 78, 35, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 12px;
    }

    .device-cell {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-muted);
      font-size: 12px;
    }

    .text-muted { color: var(--text-muted); }
    .font-bold { font-weight: 700; color: var(--text-primary); }

    .empty-cell {
      text-align: center;
      padding: 30px;
      color: var(--text-muted);
    }
  `]
})
export class LogsComponent implements OnInit {
  activeTab = signal<'USER' | 'TXN'>('USER');
  statusFilter = signal<'ALL' | 'SUCCESS' | 'FAILURE'>('ALL');
  searchQuery = '';

  userLogs = signal<UserLog[]>([]);
  txnLogs = signal<TransactionLog[]>([]);

  filteredUserLogs = computed(() => {
    let logs = [...this.userLogs()];
    const query = this.searchQuery.toLowerCase();
    const status = this.statusFilter();

    if (query) {
      logs = logs.filter(l => {
        const actionOrEvent = (l.action || l.event || '').toLowerCase();
        return (
          (l.username && l.username.toLowerCase().includes(query)) ||
          actionOrEvent.includes(query) ||
          (l.ipAddress && l.ipAddress.toLowerCase().includes(query))
        );
      });
    }

    if (status !== 'ALL') {
      logs = logs.filter(l => l.status === status);
    }

    logs.sort((a, b) => {
      const left = Date.parse(a.timestamp || a.happenedAt || '');
      const right = Date.parse(b.timestamp || b.happenedAt || '');
      return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
    });

    return logs;
  });

  filteredTxnLogs = computed(() => {
    let logs = this.txnLogs();
    const query = this.searchQuery.toLowerCase();
    const status = this.statusFilter();

    if (query) {
      logs = logs.filter(l =>
        (l.ticker && l.ticker.toLowerCase().includes(query)) ||
        (l.orderType && l.orderType.toLowerCase().includes(query)) ||
        l.accountId.toString().includes(query)
      );
    }

    if (status === 'SUCCESS') {
      logs = logs.filter(l => l.status === 'FILLED');
    } else if (status === 'FAILURE') {
      logs = logs.filter(l => l.status !== 'FILLED');
    }

    return logs;
  });

  constructor(
    private auditLogService: AuditLogService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.auditLogService.getUserLogs().subscribe(logs => this.userLogs.set(logs));
    this.auditLogService.getTransactionLogs().subscribe(txns => this.txnLogs.set(txns));
  }

  exportLogsCsv() {
    if (this.activeTab() === 'USER') {
      this.reportService.exportToCsv('tidbits_user_audit_logs', this.filteredUserLogs());
    } else {
      this.reportService.exportToCsv('tidbits_transaction_logs', this.filteredTxnLogs());
    }
  }
}
