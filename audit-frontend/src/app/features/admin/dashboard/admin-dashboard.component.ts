import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardStats } from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dash-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Executive Administration</h1>
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
            <span class="stat-label">Registered Users</span>
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
            <span class="stat-label">Trading Accounts</span>
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
            <span class="stat-label">User Event Records</span>
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
            <span class="stat-label">Transactions Tracked</span>
          </div>
          <div class="stat-val mono-font">{{ stats().totalTransactionLogs | number }}</div>
        </div>
      </div>

      <!-- Administration Modules Grid -->
      <div class="admin-modules-grid">
        <!-- Module 1: Identity & Privilege Governance with clean line divisions -->
        <div class="module-card glass-panel">
          <div class="module-header">
            <h2 class="module-title">Identity & Privilege Governance</h2>
          </div>

          <div class="action-items-list">
            <div class="action-item-row">
              <div class="action-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="16 11 18 13 22 9"></polyline>
                </svg>
              </div>
              <div class="action-item-body">
                <div class="item-title">Role Assignment Framework</div>
                <div class="item-desc">User role assignments, permission hierarchy enforcement, and credential cache invalidation.</div>
              </div>
            </div>

            <div class="action-item-row">
              <div class="action-item-icon text-rose">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </div>
              <div class="action-item-body">
                <div class="item-title">Global Session Revocation Protocol</div>
                <div class="item-desc">Immediate JWT authentication token invalidation via database token version increments.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Module 2: Security & Architecture Overview with clean line divisions -->
        <div class="module-card glass-panel">
          <div class="module-header">
            <h2 class="module-title">Security Architecture Status</h2>
          </div>

          <div class="service-health-list">
            <div class="health-row">
              <div class="service-meta">
                <span class="pulse-dot"></span>
                <span>Audit-Service (Spring Boot)</span>
              </div>
              <span class="badge badge-success">PORT 8083 ONLINE</span>
            </div>

            <div class="health-row">
              <div class="service-meta">
                <span class="pulse-dot"></span>
                <span>FastAPI Analytics Service</span>
              </div>
              <span class="badge badge-success">PORT 8085 ONLINE</span>
            </div>

            <div class="health-row">
              <div class="service-meta">
                <span class="pulse-dot"></span>
                <span>Auth-Service (OAuth2 / JWT)</span>
              </div>
              <span class="badge badge-success">PORT 4000 ONLINE</span>
            </div>

            <div class="health-row">
              <div class="service-meta">
                <span class="pulse-dot"></span>
                <span>Kafka Cluster (3 Partitions)</span>
              </div>
              <span class="badge badge-success">PORT 9092 ONLINE</span>
            </div>
          </div>
        </div>
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
      background: rgba(51, 27, 14, 0.08);
      color: #331b0e;
      border: 1px solid rgba(51, 27, 14, 0.18);
    }

    .stat-icon-wrap.blue {
      background: rgba(138, 78, 35, 0.08);
      color: #8a4e23;
      border: 1px solid rgba(138, 78, 35, 0.18);
    }

    .stat-icon-wrap.cyan {
      background: rgba(184, 117, 20, 0.08);
      color: #b87514;
      border: 1px solid rgba(184, 117, 20, 0.18);
    }

    .stat-icon-wrap.emerald {
      background: rgba(42, 97, 66, 0.08);
      color: #2a6142;
      border: 1px solid rgba(42, 97, 66, 0.18);
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
      background: rgba(138, 78, 35, 0.08);
      border: 1px solid rgba(138, 78, 35, 0.16);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--accent-cognac);
      margin-top: 2px;
    }

    .text-rose {
      color: #a33224;
      background: rgba(163, 50, 36, 0.08);
      border-color: rgba(163, 50, 36, 0.2);
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

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly autoRefreshMs = 15000;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadStats();
    this.refreshTimer = setInterval(() => this.loadStats(), this.autoRefreshMs);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private loadStats() {
    this.adminService.getDashboardStats().subscribe((s: AdminDashboardStats) => this.stats.set(s));
  }
}
