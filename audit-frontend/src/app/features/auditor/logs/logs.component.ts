import { Component, OnInit, signal, computed, ElementRef, ViewChild } from '@angular/core';
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

export interface AggregatedOrder {
  orderId: number;
  accountId?: number;
  userId?: number;
  ticker?: string;
  instrumentId?: number;
  orderType: string;
  quantity: number;
  price: number;
  totalValue: number;
  finalStatus: 'FILLED' | 'ACCEPTED' | 'REJECTED' | 'PLACED' | 'UNKNOWN';
  timePlaced: string | null;
  timeAccepted: string | null;
  timeRejected: string | null;
  timeFilled: string | null;
  latestTimestamp: string;
  lifecycleEvents: TransactionLog[];
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="logs-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Audit Event Logs</h1>
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

      <!-- Controls Panel with Tabs and Responsive Flexbox Filters -->
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
            <span class="tab-badge">{{ filteredOrders().length }}</span>
          </button>
        </div>

        <!-- Flexbox Filter Controls -->
        <div class="filters-flexbox">
          <!-- Date Range Filters -->
          <div class="filter-group">
            <label class="filter-field">
              <span>Start Date</span>
              <input
                type="date"
                class="input-control"
                [ngModel]="startDate()"
                (ngModelChange)="startDate.set($event || '')"
              />
            </label>
            <label class="filter-field">
              <span>End Date</span>
              <input
                type="date"
                class="input-control"
                [ngModel]="endDate()"
                (ngModelChange)="endDate.set($event || '')"
              />
            </label>
          </div>

          <!-- Specific Filters for User Logs -->
          <div *ngIf="activeTab() === 'USER'" class="filter-group">
            <label class="filter-field">
              <span>Action</span>
              <select class="input-control select-fixed" [ngModel]="selectedUserAction()" (ngModelChange)="selectedUserAction.set($event || 'ALL')">
                <option value="ALL">All actions</option>
                <option *ngFor="let action of availableUserActions()" [value]="action">{{ action }}</option>
              </select>
            </label>
          </div>

          <!-- Specific Filters for Transactions & Orders -->
          <div *ngIf="activeTab() !== 'USER'" class="filter-group">
            <!-- Filter by Buy or Sell -->
            <label class="filter-field">
              <span>Side</span>
              <select class="input-control select-sm" [ngModel]="selectedSide()" (ngModelChange)="selectedSide.set($event || 'ALL')">
                <option value="ALL">All Sides</option>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </label>

            <!-- Searching Dropdown for Transactions -->
            <label class="filter-field">
              <span>Transaction</span>
              <div class="search-select-wrap">
                <input
                  type="text"
                  class="input-control search-input"
                  placeholder="Search Txn ID..."
                  [ngModel]="txnSearchQuery()"
                  (ngModelChange)="txnSearchQuery.set($event)"
                />
              </div>
            </label>

            <!-- Searching Dropdown for Clients -->
            <div class="filter-field search-dropdown-container" [class.open]="clientDropdownOpen()">
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
                      #clientSearchInput
                      type="text"
                      class="dropdown-search-input"
                      placeholder="Search client..."
                      [ngModel]="clientSearchText()"
                      (ngModelChange)="onClientSearchChange($event)"
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

            <!-- Searching Dropdown for Instruments -->
            <div class="filter-field search-dropdown-container" [class.open]="instrumentDropdownOpen()">
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
                      #instrumentSearchInput
                      type="text"
                      class="dropdown-search-input"
                      placeholder="Search instrument..."
                      [ngModel]="instrumentSearchText()"
                      (ngModelChange)="onInstrumentSearchChange($event)"
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

            <!-- Backdrop to close dropdowns when clicking outside -->
            <div *ngIf="clientDropdownOpen() || instrumentDropdownOpen()" class="dropdown-backdrop" (click)="closeDropdowns()"></div>
          </div>

          <!-- Status Filters -->
          <div class="status-filters-group">
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
              Failures / Rejected
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
                <th>Type / Side</th>
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
                <td class="mono-font font-bold">{{ txn.transactionId ? ('#' + txn.transactionId) : '-' }}</td>
                <td class="mono-font text-muted">{{ (txn.timestamp || txn.happenedAt) | date:'short' }}</td>
                <td class="mono-font">Acc #{{ txn.accountId }}</td>
                <td>
                  <span class="ticker-pill">{{ txn.ticker || (txn.instrumentId ? ('Inst #' + txn.instrumentId) : '-') }}</span>
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

      <!-- Orders Table: Aggregated with Final Status and Detail Click-Through -->
      <div *ngIf="activeTab() === 'ORDERS'" class="glass-panel table-panel animate-fade-in">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Account / Client</th>
                <th>Instrument</th>
                <th>Side</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total Value</th>
                <th>Final Status</th>
                <th>Last Event Time</th>
                <th style="text-align: right;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let order of filteredOrders()"
                class="clickable-row"
                (click)="openOrderDetail(order)"
              >
                <td class="mono-font font-bold">#{{ order.orderId }}</td>
                <td class="mono-font">
                  <span *ngIf="order.accountId">Acc #{{ order.accountId }}</span>
                  <span *ngIf="order.userId" class="client-sub"> (Client #{{ order.userId }})</span>
                </td>
                <td>
                  <span class="ticker-pill">{{ order.ticker || (order.instrumentId ? ('Inst #' + order.instrumentId) : '-') }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="order.orderType === 'BUY' ? 'badge-success' : 'badge-warning'">
                    {{ order.orderType }}
                  </span>
                </td>
                <td class="mono-font">{{ order.quantity ? (order.quantity | number) : '-' }}</td>
                <td class="mono-font">{{ order.price ? ('$' + (order.price | number:'1.2-2')) : '-' }}</td>
                <td class="mono-font font-bold">{{ order.totalValue ? ('$' + (order.totalValue | number:'1.2-2')) : '-' }}</td>
                <td>
                  <span class="badge" [ngClass]="getFinalStatusBadgeClass(order.finalStatus)">
                    {{ order.finalStatus }}
                  </span>
                </td>
                <td class="mono-font text-muted">{{ order.latestTimestamp | date:'short' }}</td>
                <td style="text-align: right;">
                  <button class="btn btn-secondary btn-sm" (click)="openOrderDetail(order); $event.stopPropagation()">
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredOrders().length === 0">
                <td colspan="10" class="empty-cell">No matching orders found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Order Detail Modal with Lifecycle Timestamps -->
      <div *ngIf="selectedOrder()" class="modal-backdrop animate-fade-in" (click)="closeOrderDetail()">
        <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="badge" [ngClass]="getFinalStatusBadgeClass(selectedOrder()!.finalStatus)">
                {{ selectedOrder()!.finalStatus }}
              </div>
              <h2 class="modal-title">Order #{{ selectedOrder()!.orderId }}</h2>
              <span class="modal-sub">
                {{ selectedOrder()!.ticker || 'Instrument' }} · {{ selectedOrder()!.orderType }} · Acc #{{ selectedOrder()!.accountId }}
              </span>
            </div>
            <button class="modal-close" (click)="closeOrderDetail()">✕</button>
          </div>

          <div class="modal-body">
            <div class="modal-overview-layout">
              <div class="lifecycle-panel">
                <h3 class="overview-title">Status History</h3>
                <div class="lifecycle-timeline">
                  <div class="timeline-step" [class.completed]="selectedOrder()!.timePlaced">
                    <div class="step-dot"></div>
                    <div class="step-content">
                      <div class="step-label">Placed</div>
                      <div class="step-time mono-font">
                        {{ selectedOrder()!.timePlaced ? (selectedOrder()!.timePlaced | date:'medium') : '—' }}
                      </div>
                    </div>
                  </div>

                  <div class="timeline-connector" [class.active]="selectedOrder()!.timeAccepted || selectedOrder()!.timeRejected"></div>

                  <div
                    class="timeline-step"
                    [class.completed]="selectedOrder()!.timeAccepted || selectedOrder()!.timeRejected"
                    [class.rejected]="selectedOrder()!.timeRejected"
                  >
                    <div class="step-dot"></div>
                    <div class="step-content">
                      <div class="step-label">
                        {{ selectedOrder()!.timeRejected ? 'Rejected' : 'Accepted' }}
                      </div>
                      <div class="step-time mono-font">
                        {{ (selectedOrder()!.timeAccepted || selectedOrder()!.timeRejected) ? ((selectedOrder()!.timeAccepted || selectedOrder()!.timeRejected) | date:'medium') : '—' }}
                      </div>
                    </div>
                  </div>

                  <ng-container *ngIf="shouldShowFilledStep(selectedOrder()!)">
                    <div class="timeline-connector" [class.active]="selectedOrder()!.timeFilled"></div>

                    <div class="timeline-step" [class.completed]="selectedOrder()!.timeFilled">
                      <div class="step-dot"></div>
                      <div class="step-content">
                        <div class="step-label">Filled</div>
                        <div class="step-time mono-font">
                          {{ selectedOrder()!.timeFilled ? (selectedOrder()!.timeFilled | date:'medium') : '—' }}
                        </div>
                      </div>
                    </div>
                  </ng-container>
                </div>
              </div>

              <div class="metrics-panel">
                <h3 class="overview-title">Order Snapshot</h3>
                <div class="order-metrics-grid">
                  <div class="metric-item">
                    <span class="metric-lbl">Instrument</span>
                    <span class="metric-val">{{ selectedOrder()!.ticker || ('Inst #' + selectedOrder()!.instrumentId) }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-lbl">Side</span>
                    <span class="metric-val" [class.text-emerald]="selectedOrder()!.orderType === 'BUY'" [class.text-warning]="selectedOrder()!.orderType === 'SELL'">
                      {{ selectedOrder()!.orderType }}
                    </span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-lbl">Quantity</span>
                    <span class="metric-val mono-font">{{ selectedOrder()!.quantity | number }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-lbl">Price</span>
                    <span class="metric-val mono-font">\${{ selectedOrder()!.price | number:'1.2-2' }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-lbl">Total Value</span>
                    <span class="metric-val mono-font font-bold">\${{ selectedOrder()!.totalValue | number:'1.2-2' }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-lbl">Account / User</span>
                    <span class="metric-val mono-font">Acc #{{ selectedOrder()!.accountId }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Kafka Audit Event Stream -->
            <div class="events-history">
              <h3 class="events-title">Event Audit Trail (Kafka Records)</h3>
              <div class="events-table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Txn ID</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let ev of getOrderEventRows(selectedOrder()!)">
                      <td class="mono-font">#{{ ev.logId }}</td>
                      <td>
                        <span class="action-tag">{{ ev.event || 'ORDER_EVENT' }}</span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getStatusBadgeClass(ev.status)">
                          {{ ev.status || 'SUCCESS' }}
                        </span>
                      </td>
                      <td class="mono-font">{{ ev.transactionId ? ('#' + ev.transactionId) : '—' }}</td>
                      <td class="mono-font text-muted">{{ (ev.timestamp || ev.happenedAt) | date:'medium' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeOrderDetail()">Close</button>
          </div>
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

    /* Controls card with flexbox layout */
    .controls-card {
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      z-index: 25;
      overflow: visible;
    }

    .tabs-wrap {
      display: flex;
      gap: 8px;
      background: #ece3d2;
      padding: 4px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      width: fit-content;
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
      border-radius: var(--radius-sm);
      font-size: 11px;
    }

    /* Filters using flexbox */
    .filters-flexbox {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 12px 16px;
      padding-top: 10px;
      border-top: 1px solid var(--border-subtle);
    }

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 10px;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.35px;
      color: var(--text-muted);
    }

    .input-control {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      background: #ffffff;
      padding: 6px 10px;
      font-size: 12.5px;
      color: var(--text-primary);
      height: 34px;
    }

    .select-sm {
      min-width: 100px;
    }

    .select-fixed {
      min-width: 140px;
    }

    .search-input {
      width: 130px;
    }

    .search-dropdown-container {
      position: relative;
      min-width: 150px;
      z-index: 15;
    }

    .search-dropdown-container.open {
      z-index: 1350;
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
      max-width: 130px;
    }

    .search-dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 210px;
      z-index: 1400;
      background: #fffdf9;
      border: 1px solid rgba(62, 36, 21, 0.2);
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
      background: #faf6ee;
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
      background: #f5eedf;
      color: var(--accent-cognac);
    }

    .dropdown-item.selected {
      background: #331b0e;
      color: #f7f2e8;
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
      z-index: 1300;
      background: transparent;
    }

    .status-filters-group {
      display: flex;
      gap: 6px;
      margin-left: auto;
      align-items: center;
    }

    .status-pill {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      height: 34px;
    }

    .status-pill.active {
      background: #331b0e;
      color: #f7f2e8;
      border-color: #331b0e;
    }

    .status-pill.success.active {
      background: rgba(42, 97, 66, 0.15);
      color: #2a6142;
      border-color: #2a6142;
    }

    .status-pill.failure.active {
      background: rgba(163, 50, 36, 0.15);
      color: #a33224;
      border-color: #a33224;
    }

    .table-panel {
      padding: 0;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }

    .user-pill {
      font-weight: 700;
      color: var(--text-primary);
    }

    .action-tag {
      background: #fbf7ef;
      border: 1px solid var(--border-subtle);
      padding: 2px 7px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 700;
      color: var(--accent-cognac);
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

    .client-sub {
      color: var(--text-muted);
      font-size: 11px;
    }

    .clickable-row {
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .clickable-row:hover td {
      background: #f7efe1;
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
    .text-emerald { color: #2a6142; }
    .text-warning { color: #9c600b; }

    .empty-cell {
      text-align: center;
      padding: 30px;
      color: var(--text-muted);
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(40, 22, 13, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 1060px;
      background: #fffdf9;
      border: 1px solid rgba(62, 36, 21, 0.2);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 14px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
      margin-top: 4px;
    }

    .modal-sub {
      font-size: 12px;
      color: var(--text-muted);
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
    }

    .modal-close:hover {
      color: var(--text-primary);
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .modal-overview-layout {
      display: grid;
      grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
      gap: 14px;
      align-items: start;
    }

    .overview-title {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid var(--border-subtle);
      padding-top: 14px;
    }

    /* Order Lifecycle Timeline */
    .lifecycle-timeline {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      padding: 16px 14px;
      background: #faf6ee;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
    }

    .timeline-step {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      width: 100%;
    }

    .step-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #d8cebe;
      border: 2px solid #b5a48e;
      flex-shrink: 0;
    }

    .timeline-step.completed .step-dot {
      background: #2a6142;
      border-color: #1e4730;
      box-shadow: 0 0 6px rgba(42, 97, 66, 0.4);
    }

    .timeline-step.rejected .step-dot {
      background: #a33224;
      border-color: #7a1c11;
      box-shadow: 0 0 6px rgba(163, 50, 36, 0.4);
    }

    .step-content {
      display: flex;
      flex-direction: column;
    }

    .step-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .timeline-step.completed .step-label {
      color: var(--text-primary);
    }

    .step-time {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .timeline-connector {
      width: 2px;
      height: 24px;
      background: #d8cebe;
      margin: 4px 0 4px 5px;
      flex-shrink: 0;
    }

    .timeline-connector.active {
      background: #2a6142;
    }

    /* Financial metrics */
    .order-metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      padding: 12px 14px;
      background: #fdfbf7;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-lbl {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.4px;
    }

    .metric-val {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Events audit trail */
    .events-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .events-table-wrap {
      max-height: 220px;
      overflow-y: auto;
    }

    @media (max-width: 960px) {
      .modal-card {
        max-width: 94vw;
        padding: 18px;
      }

      .modal-overview-layout {
        grid-template-columns: 1fr;
      }

      .order-metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LogsComponent implements OnInit {
  activeTab = signal<LogsTab>('USER');
  statusFilter = signal<StatusFilter>('ALL');
  selectedInstrument = signal('ALL');
  selectedClient = signal('ALL');
  selectedSide = signal('ALL');
  selectedUserAction = signal('ALL');
  startDate = signal('');
  endDate = signal('');
  txnSearchQuery = signal('');

  clientSearchText = signal('');
  clientDropdownOpen = signal(false);

  instrumentSearchText = signal('');
  instrumentDropdownOpen = signal(false);

  @ViewChild('clientSearchInput') clientSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('instrumentSearchInput') instrumentSearchInput?: ElementRef<HTMLInputElement>;

  selectedOrder = signal<AggregatedOrder | null>(null);

  userLogs = signal<UserLog[]>([]);
  txnLogs = signal<TransactionLog[]>([]);

  filteredUserLogs = computed(() => {
    let logs = [...this.userLogs()];
    const status = this.statusFilter();
    const selectedUserAction = this.selectedUserAction();

    logs = logs.filter((log) => this.matchesDateRange(log.timestamp || log.happenedAt || ''));

    if (selectedUserAction !== 'ALL') {
      logs = logs.filter((log) => this.normalizeAction(log.action || log.event) === selectedUserAction);
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
    const status = this.statusFilter();
    const side = this.selectedSide();
    const txnQuery = this.txnSearchQuery().trim().toLowerCase();

    let list = this.filterAccountTransactions(this.txnLogs(), status);

    if (side !== 'ALL') {
      list = list.filter((log) => {
        const type = (log.orderType || log.event || '').toUpperCase();
        return type === side;
      });
    }

    if (txnQuery) {
      list = list.filter((log) => {
        const txnIdStr = String(log.transactionId || '');
        const orderIdStr = String(log.orderId || '');
        const logIdStr = String(log.logId || '');
        const tickerStr = String(log.ticker || '').toLowerCase();
        return txnIdStr.includes(txnQuery) || orderIdStr.includes(txnQuery) || logIdStr.includes(txnQuery) || tickerStr.includes(txnQuery);
      });
    }

    return list;
  });

  // Aggregated orders list
  aggregatedOrders = computed(() => {
    const logs = this.txnLogs();
    const orderMap = new Map<number, TransactionLog[]>();

    logs.forEach((log) => {
      if (log.orderId != null && log.orderId > 0) {
        const existing = orderMap.get(log.orderId) || [];
        existing.push(log);
        orderMap.set(log.orderId, existing);
      }
    });

    const orders: AggregatedOrder[] = [];

    orderMap.forEach((events, orderId) => {
      // Sort events chronologically
      events.sort((a, b) => {
        const left = Date.parse(a.timestamp || a.happenedAt || '');
        const right = Date.parse(b.timestamp || b.happenedAt || '');
        return (Number.isNaN(left) ? 0 : left) - (Number.isNaN(right) ? 0 : right);
      });

      const placedEvent = events.find(e => e.event === 'ORDER_PLACED');
      const acceptedEvent = events.find(e => e.event === 'ORDER_ACCEPTED');
      const rejectedEvent = events.find(e => e.event === 'ORDER_REJECTED' || e.status === 'REJECTED');
      const filledEvent = events.find(e => e.event === 'ORDER_FILLED' || e.status === 'FILLED');

      const primary = filledEvent || acceptedEvent || placedEvent || events[0];

      // Final status determination
      let finalStatus: 'FILLED' | 'ACCEPTED' | 'REJECTED' | 'PLACED' | 'UNKNOWN' = 'PLACED';
      if (filledEvent) {
        finalStatus = 'FILLED';
      } else if (rejectedEvent) {
        finalStatus = 'REJECTED';
      } else if (acceptedEvent) {
        finalStatus = 'ACCEPTED';
      } else if (placedEvent) {
        finalStatus = 'PLACED';
      }

      const quantity = Number(primary.quantity || 0);
      const price = Number(primary.price || primary.stockPrice || 0);
      const totalValue = primary.amount != null ? Number(primary.amount) : (quantity * price);

      const latestEvent = events[events.length - 1];

      orders.push({
        orderId,
        accountId: primary.accountId,
        userId: primary.userId,
        ticker: primary.ticker,
        instrumentId: primary.instrumentId,
        orderType: String(primary.orderType || (primary.event === 'SELL' ? 'SELL' : 'BUY')).toUpperCase(),
        quantity,
        price,
        totalValue,
        finalStatus,
        timePlaced: placedEvent ? (placedEvent.timestamp || placedEvent.happenedAt || null) : null,
        timeAccepted: acceptedEvent ? (acceptedEvent.timestamp || acceptedEvent.happenedAt || null) : null,
        timeRejected: rejectedEvent ? (rejectedEvent.timestamp || rejectedEvent.happenedAt || null) : null,
        timeFilled: filledEvent ? (filledEvent.timestamp || filledEvent.happenedAt || null) : null,
        latestTimestamp: latestEvent.timestamp || latestEvent.happenedAt || '',
        lifecycleEvents: events
      });
    });

    // Sort newest order first
    orders.sort((a, b) => {
      const left = Date.parse(a.latestTimestamp);
      const right = Date.parse(b.latestTimestamp);
      return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
    });

    return orders;
  });

  filteredOrders = computed(() => {
    let orders = this.aggregatedOrders();
    const status = this.statusFilter();
    const side = this.selectedSide();
    const instrument = this.selectedInstrument();
    const client = this.selectedClient();
    const instrumentQuery = this.instrumentSearchText().trim().toLowerCase();
    const clientQuery = this.clientSearchText().trim().toLowerCase();
    const txnQuery = this.txnSearchQuery().trim().toLowerCase();

    // Date range
    orders = orders.filter(o => this.matchesDateRange(o.latestTimestamp));

    // Status filter
    if (status === 'SUCCESS') {
      orders = orders.filter(o => o.finalStatus === 'FILLED' || o.finalStatus === 'ACCEPTED');
    } else if (status === 'FAILURE') {
      orders = orders.filter(o => o.finalStatus === 'REJECTED');
    }

    // Side filter
    if (side !== 'ALL') {
      orders = orders.filter(o => o.orderType === side);
    }

    // Instrument filter
    orders = orders.filter((o) => {
      const label = o.ticker ? o.ticker.toUpperCase() : (o.instrumentId ? `INST #${o.instrumentId}` : '');
      return this.matchesSearchFilter(label, instrument, instrumentQuery);
    });

    // Client filter
    orders = orders.filter((o) => {
      const clientLabel = o.userId ? `Client #${o.userId}` : (o.accountId ? `Account #${o.accountId}` : '');
      return this.matchesSearchFilter(clientLabel, client, clientQuery);
    });

    // Search query
    if (txnQuery) {
      orders = orders.filter(o => {
        const orderIdStr = String(o.orderId);
        const tickerStr = String(o.ticker || '').toLowerCase();
        return orderIdStr.includes(txnQuery) || tickerStr.includes(txnQuery);
      });
    }

    return orders;
  });

  availableInstruments = computed(() => {
    const labels = new Set<string>();

    this.txnLogs().forEach((log: TransactionLog) => {
      const label = this.getInstrumentLabel(log);
      if (label) {
        labels.add(label);
      }
    });

    return [...labels].sort((left, right) => left.localeCompare(right));
  });

  availableClients = computed(() => {
    const labels = new Set<string>();

    this.txnLogs().forEach((log: TransactionLog) => {
      const label = this.getClientLabel(log);
      if (label) {
        labels.add(label);
      }
    });

    return [...labels].sort((left, right) => left.localeCompare(right));
  });

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

  matchingClients = computed(() => {
    return this.availableClients();
  });

  availableUserActions = computed(() => {
    const labels = new Set<string>();

    this.userLogs().forEach((log: UserLog) => {
      const action = this.normalizeAction(log.action || log.event);
      if (action) {
        labels.add(action);
      }
    });

    return [...labels].sort((left, right) => left.localeCompare(right));
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
      this.reportService.exportToCsv('tidbits_orders_summary', this.filteredOrders());
    }
  }

  toggleClientDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.clientDropdownOpen.set(!this.clientDropdownOpen());
    if (this.clientDropdownOpen()) {
      this.instrumentDropdownOpen.set(false);
      this.focusClientSearchInput();
    }
  }

  onClientSearchChange(value: string) {
    this.clientSearchText.set(value || '');
    this.selectedClient.set('ALL');
  }

  selectClient(client: string) {
    this.selectedClient.set(client);
    this.clientSearchText.set('');
    this.clientDropdownOpen.set(false);
  }

  toggleInstrumentDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.instrumentDropdownOpen.set(!this.instrumentDropdownOpen());
    if (this.instrumentDropdownOpen()) {
      this.clientDropdownOpen.set(false);
      this.focusInstrumentSearchInput();
    }
  }

  onInstrumentSearchChange(value: string) {
    this.instrumentSearchText.set(value || '');
    this.selectedInstrument.set('ALL');
  }

  selectInstrument(inst: string) {
    this.selectedInstrument.set(inst);
    this.instrumentSearchText.set('');
    this.instrumentDropdownOpen.set(false);
  }

  closeDropdowns() {
    this.clientDropdownOpen.set(false);
    this.instrumentDropdownOpen.set(false);
  }

  shouldShowFilledStep(order: AggregatedOrder): boolean {
    return Boolean((order.timeAccepted || order.timeFilled) && !order.timeRejected);
  }

  getOrderEventRows(order: AggregatedOrder): TransactionLog[] {
    const events = order.lifecycleEvents;
    if (!events.length) {
      return [];
    }

    const preferredEvent = this.getFinalStatusEvent(order.finalStatus);
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];
      if ((ev.event || '') === preferredEvent || (ev.status || '') === order.finalStatus) {
        return [ev];
      }
    }

    return [events[events.length - 1]];
  }

  openOrderDetail(order: AggregatedOrder) {
    this.selectedOrder.set(order);
  }

  closeOrderDetail() {
    this.selectedOrder.set(null);
  }

  formatTransactionTotal(txn: TransactionLog): string {
    if (txn.amount !== undefined && txn.amount !== null) {
      return '$' + txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    if (txn.quantity && txn.price) {
      const computedVal = txn.quantity * txn.price;
      return '$' + computedVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return '-';
  }

  formatTransactionType(txn: TransactionLog): string {
    if (this.isCashTransaction(txn)) {
      return txn.event || txn.orderType || '-';
    }

    return txn.orderType || txn.event || '-';
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

  getFinalStatusBadgeClass(status: string): string {
    switch (status) {
      case 'FILLED':
        return 'badge-success';
      case 'ACCEPTED':
        return 'badge-auditor';
      case 'REJECTED':
        return 'badge-danger';
      case 'PLACED':
        return 'badge-warning';
      default:
        return 'badge-user';
    }
  }

  private filterAccountTransactions(logs: TransactionLog[], status: StatusFilter): TransactionLog[] {
    const accountTransactions = this.buildAccountTransactions(logs);

    return accountTransactions.filter((log) => {
      if (!this.matchesSpecificFilters(log)) {
        return false;
      }

      return this.matchesAccountTransactionStatus(log, status);
    });
  }

  private buildAccountTransactions(logs: TransactionLog[]): TransactionLog[] {
    const dedupedTransactions = new Map<string, TransactionLog>();

    logs
      .filter((log) => this.isAccountTransactionEvent(log))
      .forEach((log) => {
        const key = this.getAccountTransactionKey(log);
        const existing = dedupedTransactions.get(key);

        if (!existing || this.compareByTimestamp(log, existing) > 0) {
          dedupedTransactions.set(key, log);
        }
      });

    return [...dedupedTransactions.values()]
      .sort((left, right) => this.compareByTimestamp(right, left));
  }

  private matchesSpecificFilters(log: TransactionLog): boolean {
    const selectedInstrument = this.selectedInstrument();
    const selectedClient = this.selectedClient();
    const instrumentQuery = this.instrumentSearchText().trim().toLowerCase();
    const clientQuery = this.clientSearchText().trim().toLowerCase();
    const instrumentLabel = this.getInstrumentLabel(log);
    const clientLabel = this.getClientLabel(log);

    if (!this.matchesSearchFilter(instrumentLabel, selectedInstrument, instrumentQuery)) {
      return false;
    }

    if (!this.matchesSearchFilter(clientLabel, selectedClient, clientQuery)) {
      return false;
    }

    if (!this.matchesDateRange(log.timestamp || log.happenedAt || '')) {
      return false;
    }

    return true;
  }

  private matchesDateRange(timestamp: string): boolean {
    const startDate = this.startDate();
    const endDate = this.endDate();

    const value = Date.parse(timestamp);
    if (Number.isNaN(value)) {
      return !(startDate || endDate);
    }

    if (startDate) {
      const start = Date.parse(`${startDate}T00:00:00`);
      if (!Number.isNaN(start) && value < start) {
        return false;
      }
    }

    if (endDate) {
      const end = Date.parse(`${endDate}T23:59:59`);
      if (!Number.isNaN(end) && value > end) {
        return false;
      }
    }

    return true;
  }

  private normalizeAction(action?: string): string {
    return String(action || '').trim().toUpperCase();
  }

  private getInstrumentLabel(log: TransactionLog): string {
    if (log.ticker && String(log.ticker).trim()) {
      return String(log.ticker).trim().toUpperCase();
    }

    if (log.instrumentId) {
      return `INST #${log.instrumentId}`;
    }

    return '';
  }

  private getClientLabel(log: TransactionLog): string {
    if (log.userId) {
      return `Client #${log.userId}`;
    }

    if (log.accountId) {
      return `Account #${log.accountId}`;
    }

    return '';
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

  private isEligibleOrderTransaction(log: TransactionLog): boolean {
    return Boolean(
      log.transactionId &&
      log.orderId &&
      ORDER_SIDE_TYPES.has(log.orderType) &&
      ACCOUNT_ORDER_EVENTS.has(log.event || '')
    );
  }

  private isAccountTransactionEvent(log: TransactionLog): boolean {
    if (this.isCashTransaction(log) || this.isEligibleOrderTransaction(log)) {
      return true;
    }

    return Boolean(
      log.transactionId ||
      ORDER_SIDE_TYPES.has(log.orderType) ||
      ACCOUNT_ORDER_EVENTS.has(log.event || '') ||
      ORDER_LIFECYCLE_EVENTS.has(log.event || '')
    );
  }

  private isCashTransaction(log: TransactionLog): boolean {
    return ACCOUNT_TRANSACTION_EVENTS.has(log.event || '');
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

  private matchesSearchFilter(label: string, selected: string, query: string): boolean {
    if (selected !== 'ALL') {
      return label === selected;
    }

    if (!query) {
      return true;
    }

    return label.toLowerCase().includes(query);
  }

  private getFinalStatusEvent(status: AggregatedOrder['finalStatus']): string {
    switch (status) {
      case 'FILLED':
        return 'ORDER_FILLED';
      case 'ACCEPTED':
        return 'ORDER_ACCEPTED';
      case 'REJECTED':
        return 'ORDER_REJECTED';
      case 'PLACED':
      default:
        return 'ORDER_PLACED';
    }
  }

  private focusClientSearchInput() {
    setTimeout(() => {
      const input = this.clientSearchInput?.nativeElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  private focusInstrumentSearchInput() {
    setTimeout(() => {
      const input = this.instrumentSearchInput?.nativeElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }
}
