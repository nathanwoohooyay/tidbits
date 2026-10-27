import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { finalize } from 'rxjs';
import { AdminDashboardStats, ComponentHealth, HealthStatus, SystemHealth } from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dash-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Administration</h1>
        </div>
      </div>

      <!-- Unified KPI Stats Panel with Line Dividers -->
      <div class="stats-panel glass-panel">
        <div class="stat-col">
          <div class="stat-title-row">
            <div class="stat-icon-wrap purple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span class="stat-label">Registered users</span>
          </div>
          <div class="stat-val mono-font">{{ stats().totalUsers | number }}</div>
        </div>

        <div class="stat-col">
          <div class="stat-title-row">
            <div class="stat-icon-wrap blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <span class="stat-label">Trading accounts</span>
          </div>
          <div class="stat-val mono-font">{{ stats().totalAccounts | number }}</div>
        </div>

        <div class="stat-col">
          <div class="stat-title-row">
            <div class="stat-icon-wrap cyan">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <span class="stat-label">User events</span>
          </div>
          <div class="stat-val mono-font">{{ stats().totalUserLogs | number }}</div>
        </div>

        <div class="stat-col">
          <div class="stat-title-row">
            <div class="stat-icon-wrap emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <span class="stat-label">Transactions tracked</span>
          </div>
          <div class="stat-val mono-font">{{ stats().totalTransactionLogs | number }}</div>
        </div>
      </div>

      <div class="module-card glass-panel">
        <div class="module-header health-header">
          <h2 class="module-title">Service status</h2>
          <div class="health-actions">
            @if (health(); as h) {
              <span class="checked-at" [class.check-failed]="healthError()">
                {{ healthError() ? 'Last check failed · ' : '' }}Checked {{ ago(h.checkedAt) }}
              </span>
            }
            <button type="button" class="btn btn-secondary btn-sm" (click)="loadHealth()" [disabled]="checking()">
              {{ checking() ? 'Checking…' : 'Refresh' }}
            </button>
          </div>
        </div>

        @if (health(); as h) {
          <ul class="service-health-list">
            @for (component of h.components; track component.id) {
              <li class="health-row">
                <div class="service-meta">
                  <span class="status-dot" [class.pulse-dot]="component.status === 'up'" [attr.data-status]="component.status"></span>
                  <span>{{ component.name }}</span>
                </div>
                <div class="health-detail">
                  <span class="health-note">{{ note(component) }}</span>
                  <span class="badge" [ngClass]="badgeClass(component.status)">{{ statusLabel(component.status) }}</span>
                </div>
              </li>
            }
          </ul>
        } @else if (healthError()) {
          <p class="health-empty">Status unavailable: couldn't reach the gateway.</p>
        } @else {
          <p class="health-empty">Checking services…</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-dash-container {
      display: flex;
      flex-direction: column;
      gap: 18px;
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

    /* Unified Stats Panel - fewer boxes, line divisions, clean spacing */
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
      gap: 10px;
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

    .stat-icon-wrap.purple {
      background: rgba(76, 47, 36, 0.08);
      color: #4C2F24;
      border: 1px solid rgba(76, 47, 36, 0.18);
    }

    .stat-icon-wrap.blue {
      background: rgba(122, 70, 56, 0.08);
      color: #7A4638;
      border: 1px solid rgba(122, 70, 56, 0.18);
    }

    .stat-icon-wrap.cyan {
      background: rgba(160, 104, 32, 0.08);
      color: #A06820;
      border: 1px solid rgba(160, 104, 32, 0.18);
    }

    .stat-icon-wrap.emerald {
      background: rgba(0, 127, 75, 0.08);
      color: #007F4B;
      border: 1px solid rgba(0, 127, 75, 0.18);
    }

    .stat-label {
      font-size: 11.5px;
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
    }

    .admin-modules-grid {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 16px;
    }

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
      .admin-modules-grid {
        grid-template-columns: 1fr;
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

    .module-card {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
    }

    .module-header {
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 12px;
    }

    .module-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.2px;
    }

    /* Action items - clean line divisions instead of nested rounded boxes */
    .action-items-list {
      display: flex;
      flex-direction: column;
    }

    .action-item-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-subtle);
    }

    .action-item-row:last-child {
      border-bottom: none;
      padding-bottom: 4px;
    }

    .action-item-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: rgba(122, 70, 56, 0.08);
      border: 1px solid rgba(122, 70, 56, 0.16);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--accent-cognac);
      margin-top: 2px;
    }

    .text-rose {
      color: #BA0B2F;
      background: rgba(186, 11, 47, 0.08);
      border-color: rgba(186, 11, 47, 0.2);
    }

    .action-item-body {
      flex: 1;
    }

    .item-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .item-desc {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 3px;
      line-height: 1.45;
    }

    /* Service health - clean line divisions */
    .service-health-list {
      display: flex;
      flex-direction: column;
    }

    .health-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-subtle);
    }

    .health-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .health-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .checked-at {
      font-size: 12px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }

    .checked-at.check-failed {
      color: var(--accent-terracotta);
    }

    .service-health-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .health-row {
      gap: 12px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      flex: none;
      background: var(--text-dim);
    }

    .status-dot[data-status="up"] {
      background: var(--accent-sage-light);
    }

    .status-dot[data-status="slow"],
    .status-dot[data-status="degraded"] {
      background: var(--accent-amber);
    }

    .status-dot[data-status="down"] {
      background: var(--accent-terracotta);
    }

    .health-row .service-meta {
      white-space: nowrap;
    }

    .health-detail {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 6px 12px;
      min-width: 0;
    }

    .health-note {
      font-size: 12px;
      color: var(--text-muted);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .health-empty {
      margin: 8px 0 4px;
      font-size: 13px;
      color: var(--text-muted);
    }

    .health-row:last-child {
      border-bottom: none;
      padding-bottom: 4px;
    }

    .service-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats = signal<AdminDashboardStats>({
    totalUsers: 0,
    totalAccounts: 0,
    totalUserLogs: 0,
    totalTransactionLogs: 0
  });

  health = signal<SystemHealth | null>(null);
  healthError = signal(false);
  checking = signal(false);
  // Ticks so "Checked 12 s ago" stays current between checks.
  private now = signal(Date.now());

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private readonly autoRefreshMs = 15000;
  private readonly healthRefreshMs = 30000;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadStats();
    this.loadHealth();
    this.refreshTimer = setInterval(() => this.loadStats(), this.autoRefreshMs);
    this.healthTimer = setInterval(() => this.loadHealth(), this.healthRefreshMs);
    this.clockTimer = setInterval(() => this.now.set(Date.now()), 1000);
  }

  ngOnDestroy() {
    for (const timer of [this.refreshTimer, this.healthTimer, this.clockTimer]) {
      if (timer) {
        clearInterval(timer);
      }
    }
    this.refreshTimer = this.healthTimer = this.clockTimer = null;
  }

  // Keeps the last result on screen when a check fails, marked as such.
  loadHealth() {
    if (this.checking()) {
      return;
    }
    this.checking.set(true);
    this.adminService.getSystemHealth()
      .pipe(finalize(() => this.checking.set(false)))
      .subscribe({
        next: health => {
          this.health.set(health);
          this.healthError.set(false);
        },
        error: () => this.healthError.set(true)
      });
  }

  statusLabel(status: HealthStatus): string {
    return { up: 'Up', slow: 'Slow', degraded: 'Degraded', down: 'Down', unknown: 'Unknown' }[status] ?? 'Unknown';
  }

  badgeClass(status: HealthStatus): string {
    return status === 'up' ? 'badge-success'
      : status === 'slow' || status === 'degraded' ? 'badge-warning'
      : status === 'down' ? 'badge-danger'
      : 'badge-user';
  }

  // Response time while a service is answering, why when it isn't; for the price feed, when a price last came in.
  note(component: ComponentHealth): string {
    if (component.id === 'market-data' && component.status === 'up') {
      return component.lastSuccessAt ? `Last price ${this.ago(component.lastSuccessAt)}` : '';
    }
    if ((component.status === 'up' || component.status === 'slow') && component.latencyMs != null) {
      return component.latencyMs < 1000 ? `${component.latencyMs} ms` : `${(component.latencyMs / 1000).toFixed(1)} s`;
    }
    return component.reason ?? '';
  }

  ago(iso: string): string {
    const seconds = Math.max(0, Math.round((this.now() - Date.parse(iso)) / 1000));
    if (Number.isNaN(seconds) || seconds < 5) {
      return 'just now';
    }
    if (seconds < 60) {
      return `${seconds} s ago`;
    }
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} min ago`;
    }
    return `${Math.floor(seconds / 3600)} h ago`;
  }

  private loadStats() {
    this.adminService.getDashboardStats().subscribe((s: AdminDashboardStats) => this.stats.set(s));
  }
}
