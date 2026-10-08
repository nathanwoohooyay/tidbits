import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { ReportService } from '../../../core/services/report.service';
import { UserLog, TransactionLog } from '../../../core/models/models';

type LogsTab = 'USER' | 'TXN' | 'ORDERS';
type StatusFilter = 'ALL' | 'SUCCESS' | 'FAILURE';

const ACCOUNT_TRANSACTION_EVENTS = new Set(['DEPOSIT', 'WITHDRAW']);
const ORDER_LIFECYCLE_EVENTS = new Set(['ORDER_PLACED', 'ORDER_ACCEPTED', 'ORDER_FILLED', 'ORDER_REJECTED']);
const ACCOUNT_ORDER_EVENTS = new Set(['ORDER_ACCEPTED', 'ORDER_FILLED']);
const ORDER_SIDE_TYPES = new Set(['BUY', 'SELL']);

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="logs-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Audit Event Logs</h1>
          <p class="page-subtitle">Immutable event streaming from Kafka: user identity events, account transactions, and order lifecycle activity</p>
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
            <span>Account Transactions</span>
            <span class="tab-badge">{{ filteredAccountTxnLogs().length }}</span>
          </button>
          <button
            id="tab-order-logs"
            class="tab-btn"
            [class.active]="activeTab() === 'ORDERS'"
            (click)="activeTab.set('ORDERS')"
          >
            <span>Orders</span>
            <span class="tab-badge">{{ filteredOrderLogs().length }}</span>
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
              placeholder="Filter by user, event, account, order..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event ?? '')"
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
              Success / Accepted / Filled
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
                  <span class="user-pill">{{ log.username }}</span>
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

      <!-- Account Transactions Table -->
      <div *ngIf="activeTab() === 'TXN'" class="glass-panel table-panel animate-fade-in">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Order ID</th>
                <th>Transaction ID</th>
                <th>Timestamp</th>
                <th>Account</th>
                <th>Instrument</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let txn of filteredAccountTxnLogs()">
                <td class="mono-font">#{{ txn.logId }}</td>
                <td class="mono-font">{{ txn.orderId ? ('#' + txn.orderId) : '-' }}</td>
                <td class="mono-font">{{ txn.transactionId ? ('#' + txn.transactionId) : '-' }}</td>
                <td class="mono-font text-muted">{{ (txn.timestamp || txn.happenedAt) | date:'short' }}</td>
                <td class="mono-font">Acc #{{ txn.accountId }}</td>
                <td>
                  <span class="ticker-pill">{{ txn.instrumentId ? ('Inst #' + txn.instrumentId) : '-' }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getTransactionTypeBadgeClass(txn)">
                    {{ formatTransactionType(txn) }}
                  </span>
                </td>
                <td class="mono-font">{{ txn.quantity ? (txn.quantity | number) : '-' }}</td>
                <td class="mono-font">{{ txn.price ? ('$' + (txn.price | number:'1.2-2')) : '-' }}</td>
                <td class="mono-font font-bold">{{ formatTransactionTotal(txn) }}</td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(txn.status)">
                    {{ txn.status || 'UNKNOWN' }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="filteredAccountTxnLogs().length === 0">
                <td colspan="11" class="empty-cell">No matching account transactions found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Orders Table -->
      <div *ngIf="activeTab() === 'ORDERS'" class="glass-panel table-panel animate-fade-in">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Order ID</th>
                <th>Transaction ID</th>
                <th>Timestamp</th>
                <th>Account</th>
                <th>Instrument</th>
                <th>Side</th>
                <th>Lifecycle Event</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let orderLog of filteredOrderLogs()">
                <td class="mono-font">#{{ orderLog.logId }}</td>
                <td class="mono-font">{{ orderLog.orderId ? ('#' + orderLog.orderId) : '-' }}</td>
                <td class="mono-font">{{ orderLog.transactionId ? ('#' + orderLog.transactionId) : '-' }}</td>
                <td class="mono-font text-muted">{{ (orderLog.timestamp || orderLog.happenedAt) | date:'short' }}</td>
                <td class="mono-font">Acc #{{ orderLog.accountId }}</td>
                <td>
                  <span class="ticker-pill">{{ orderLog.instrumentId ? ('Inst #' + orderLog.instrumentId) : '-' }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getTransactionTypeBadgeClass(orderLog)">
                    {{ orderLog.orderType || '-' }}
                  </span>
                </td>
                <td>
                  <span class="action-tag">{{ formatOrderEvent(orderLog.event) }}</span>
                </td>
                <td class="mono-font">{{ orderLog.quantity ? (orderLog.quantity | number) : '-' }}</td>
                <td class="mono-font">{{ orderLog.price ? ('$' + (orderLog.price | number:'1.2-2')) : '-' }}</td>
                <td class="mono-font font-bold">{{ formatTransactionTotal(orderLog) }}</td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(orderLog.status)">
                    {{ orderLog.status || 'UNKNOWN' }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="filteredOrderLogs().length === 0">
                <td colspan="12" class="empty-cell">No matching order lifecycle events found.</td>
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
  activeTab = signal<LogsTab>('USER');
  statusFilter = signal<StatusFilter>('ALL');
  searchQuery = signal('');

  userLogs = signal<UserLog[]>([]);
  txnLogs = signal<TransactionLog[]>([]);

  filteredUserLogs = computed(() => {
    let logs = [...this.userLogs()];
    const query = this.searchQuery().trim().toLowerCase();
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

  filteredAccountTxnLogs = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.filterAccountTransactions(this.txnLogs(), query, status);
  });

  filteredOrderLogs = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.filterOrderLifecycleLogs(this.txnLogs(), query, status);
  });

  constructor(
    private auditLogService: AuditLogService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.auditLogService.getUserLogs().subscribe((logs: UserLog[]) => this.userLogs.set(logs));
    this.auditLogService.getTransactionLogs().subscribe((txns: TransactionLog[]) => this.txnLogs.set(txns));
  }

  exportLogsCsv() {
    if (this.activeTab() === 'USER') {
      this.reportService.exportToCsv('tidbits_user_audit_logs', this.filteredUserLogs());
    } else if (this.activeTab() === 'TXN') {
      this.reportService.exportToCsv('tidbits_account_transaction_logs', this.filteredAccountTxnLogs());
    } else {
      this.reportService.exportToCsv('tidbits_order_lifecycle_logs', this.filteredOrderLogs());
    }
  }

  formatTransactionTotal(txn: TransactionLog): string {
    if (txn.amount !== undefined && txn.amount !== null) {
      return '$' + txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    if (txn.quantity && txn.price) {
      const computed = txn.quantity * txn.price;
      return '$' + computed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return '-';
  }

  formatTransactionType(txn: TransactionLog): string {
    if (this.isCashTransaction(txn)) {
      return txn.event || txn.orderType || '-';
    }

    return txn.orderType || txn.event || '-';
  }

  formatOrderEvent(event?: string): string {
    return (event || 'UNKNOWN').replace(/^ORDER_/, '');
  }

  getTransactionTypeBadgeClass(txn: TransactionLog): string {
    const type = this.formatTransactionType(txn);

    if (type === 'BUY' || type === 'DEPOSIT') {
      return 'badge-success';
    }

    if (type === 'SELL' || type === 'WITHDRAW') {
      return 'badge-warning';
    }

    return 'badge-danger';
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'SUCCESS':
      case 'ACCEPTED':
      case 'FILLED':
        return 'badge-success';
      case 'REJECTED':
      case 'FAILURE':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  }

  private filterAccountTransactions(logs: TransactionLog[], query: string, status: StatusFilter): TransactionLog[] {
    const accountTransactions = this.buildAccountTransactions(logs);

    return accountTransactions.filter((log) => {
      if (!this.matchesSearch(log, query, 'TXN')) {
        return false;
      }

      return this.matchesAccountTransactionStatus(log, status);
    });
  }

  private filterOrderLifecycleLogs(logs: TransactionLog[], query: string, status: StatusFilter): TransactionLog[] {
    return [...logs]
      .filter((log) => this.isOrderLifecycleEvent(log))
      .filter((log) => this.matchesSearch(log, query, 'ORDERS'))
      .filter((log) => this.matchesOrderStatus(log, status))
      .sort((left, right) => this.compareByTimestamp(right, left));
  }

  private buildAccountTransactions(logs: TransactionLog[]): TransactionLog[] {
    const cashTransactions = logs.filter((log) => this.isCashTransaction(log));
    const dedupedOrderTransactions = new Map<string, TransactionLog>();

    logs
      .filter((log) => this.isEligibleOrderTransaction(log))
      .forEach((log) => {
        const key = this.getAccountTransactionKey(log);
        const existing = dedupedOrderTransactions.get(key);

        if (!existing || this.compareByTimestamp(log, existing) > 0) {
          dedupedOrderTransactions.set(key, log);
        }
      });

    return [...cashTransactions, ...dedupedOrderTransactions.values()]
      .sort((left, right) => this.compareByTimestamp(right, left));
  }

  private matchesSearch(log: TransactionLog, query: string, tab: Exclude<LogsTab, 'USER'>): boolean {
    if (!query) {
      return true;
    }

    const searchValues = [
      log.event,
      log.orderType,
      log.status,
      log.orderId,
      log.transactionId,
      log.accountId,
      log.instrumentId
    ].filter((value) => value !== undefined && value !== null);

    if (tab === 'ORDERS') {
      searchValues.push(this.formatOrderEvent(log.event));
    }

    return searchValues.some((value) => String(value).toLowerCase().includes(query));
  }

  private matchesAccountTransactionStatus(log: TransactionLog, status: StatusFilter): boolean {
    if (status === 'ALL') {
      return true;
    }

    if (status === 'SUCCESS') {
      return !this.isFailureStatus(log.status);
    }

    return this.isFailureStatus(log.status);
  }

  private matchesOrderStatus(log: TransactionLog, status: StatusFilter): boolean {
    if (status === 'ALL') {
      return true;
    }

    if (status === 'SUCCESS') {
      return (log.event === 'ORDER_ACCEPTED' || log.event === 'ORDER_FILLED') && !this.isFailureStatus(log.status);
    }

    return log.event === 'ORDER_REJECTED' || this.isFailureStatus(log.status);
  }

  private isEligibleOrderTransaction(log: TransactionLog): boolean {
    return Boolean(
      log.transactionId &&
      log.orderId &&
      ORDER_SIDE_TYPES.has(log.orderType) &&
      ACCOUNT_ORDER_EVENTS.has(log.event || '')
    );
  }

  private isCashTransaction(log: TransactionLog): boolean {
    return ACCOUNT_TRANSACTION_EVENTS.has(log.event || '');
  }

  private isOrderLifecycleEvent(log: TransactionLog): boolean {
    return Boolean(log.orderId && ORDER_LIFECYCLE_EVENTS.has(log.event || ''));
  }

  private getAccountTransactionKey(log: TransactionLog): string {
    if (log.orderId != null) {
      return `order:${log.orderId}`;
    }

    if (log.transactionId != null) {
      return `transaction:${log.transactionId}`;
    }

    return `log:${log.logId}`;
  }

  private isFailureStatus(status?: string): boolean {
    return status === 'FAILURE' || status === 'REJECTED';
  }

  private compareByTimestamp(left: TransactionLog, right: TransactionLog): number {
    const leftTime = Date.parse(left.timestamp || left.happenedAt || '');
    const rightTime = Date.parse(right.timestamp || right.happenedAt || '');
    const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;

    return safeLeft - safeRight;
  }
}
