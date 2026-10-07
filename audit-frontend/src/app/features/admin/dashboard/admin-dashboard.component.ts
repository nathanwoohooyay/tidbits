import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardStats } from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-dash-container animate-fade-in">
      <div class="page-header">
        <div>
          <div class="badge badge-admin">ADMIN CONTROL PLANE</div>
          <h1 class="page-title">Executive Administration</h1>
          <p class="page-subtitle">Platform-wide identity governance, token versioning, and account supervision</p>
        </div>
        <div class="header-actions">
          <a id="btn-goto-users" routerLink="/admin/users" class="btn btn-primary btn-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Manage User Roles</span>
          </a>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card glass-panel">
          <div class="stat-icon purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Registered Users</div>
            <div class="stat-val mono-font">{{ stats().totalUsers | number }}</div>
            <div class="stat-sub">Across all access tiers</div>
          </div>
        </div>

        <div class="stat-card glass-panel">
          <div class="stat-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Trading Accounts</div>
            <div class="stat-val mono-font">{{ stats().totalAccounts | number }}</div>
            <div class="stat-sub">Custodial & sub-accounts</div>
          </div>
        </div>

        <div class="stat-card glass-panel">
          <div class="stat-icon cyan">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">User Event Records</div>
            <div class="stat-val mono-font">{{ stats().totalUserLogs | number }}</div>
            <div class="stat-sub">Kafka audit topics</div>
          </div>
        </div>

        <div class="stat-card glass-panel">
          <div class="stat-icon emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Transactions Tracked</div>
            <div class="stat-val mono-font">{{ stats().totalTransactionLogs | number }}</div>
            <div class="stat-sub">Order stream immutable log</div>
          </div>
        </div>
      </div>

      <!-- Administration Modules Grid -->
      <div class="admin-modules-grid">
        <!-- Module 1: Access Control Direct Actions -->
        <div class="module-card glass-panel">
          <div class="module-header">
            <h2 class="module-title">Identity & Privilege Governance</h2>
            <span class="module-sub">Role escalation, session revocation, and security posture</span>
          </div>

          <div class="action-items-list">
            <div class="action-item">
              <div class="action-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="16 11 18 13 22 9"></polyline>
                </svg>
              </div>
              <div class="action-item-body">
                <div class="item-title">Role Assignment Interface</div>
                <div class="item-desc">Promote users to AUDITOR or ADMIN, or downgrade privileges with immediate cache invalidation.</div>
              </div>
              <a routerLink="/admin/users" class="btn btn-secondary btn-sm">Manage Users</a>
            </div>

            <div class="action-item">
              <div class="action-item-icon text-rose">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </div>
              <div class="action-item-body">
                <div class="item-title">Global Session Revocation</div>
                <div class="item-desc">Invalidate existing JWT tokens on demand via TokenVersion incrementing in database.</div>
              </div>
              <a routerLink="/admin/users" class="btn btn-danger btn-sm">Inspect Users</a>
            </div>
          </div>
        </div>

        <!-- Module 2: Security & Architecture Overview -->
        <div class="module-card glass-panel">
          <div class="module-header">
            <h2 class="module-title">Security Architecture Status</h2>
            <span class="module-sub">Microservice health check</span>
          </div>

          <div class="service-health-list">
            <div class="health-row">
              <div class="service-meta">
                <span class="pulse-dot"></span>
                <strong>Audit-Service (Spring Boot)</strong>
              </div>
              <span class="badge badge-success">PORT 8083 ONLINE</span>
            </div>

            <div class="health-row">
              <div class="service-meta">
                <span class="pulse-dot"></span>
                <strong>FastAPI Analytics Service</strong>
              </div>
              <span class="badge badge-success">PORT 8085 ONLINE</span>
            </div>

            <div class="health-row">
              <div class="service-meta">
                <span class="pulse-dot"></span>
                <strong>Auth-Service (OAuth2 / JWT)</strong>
              </div>
              <span class="badge badge-success">PORT 4000 ONLINE</span>
            </div>

            <div class="health-row">
              <div class="service-meta">
                <span class="pulse-dot"></span>
                <strong>Kafka Cluster (3 Partitions)</strong>
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
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .page-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      margin-top: 6px;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon.purple {
      background: rgba(51, 27, 14, 0.12);
      border: 1px solid rgba(51, 27, 14, 0.28);
      color: #331b0e;
    }

    .stat-icon.blue {
      background: rgba(138, 78, 35, 0.12);
      border: 1px solid rgba(138, 78, 35, 0.28);
      color: #8a4e23;
    }

    .stat-icon.cyan {
      background: rgba(184, 117, 20, 0.12);
      border: 1px solid rgba(184, 117, 20, 0.28);
      color: #b87514;
    }

    .stat-icon.emerald {
      background: rgba(42, 97, 66, 0.12);
      border: 1px solid rgba(42, 97, 66, 0.28);
      color: #2a6142;
    }

    .stat-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-muted);
    }

    .stat-val {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 2px 0;
    }

    .stat-sub {
      font-size: 11.5px;
      color: var(--text-dim);
    }

    .admin-modules-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 18px;
    }

    @media (max-width: 1024px) {
      .admin-modules-grid {
        grid-template-columns: 1fr;
      }
    }

    .module-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
    }

    .module-header {
      margin-bottom: 20px;
    }

    .module-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .module-sub {
      font-size: 12px;
      color: var(--text-muted);
    }

    .action-items-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .action-item {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #fbf7ee;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
    }

    .action-item-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
      background: #f0e6d6;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--accent-cognac);
    }

    .text-rose { color: #a33224; }

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
      margin-top: 2px;
    }

    .service-health-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .health-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: #fbf7ee;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
    }

    .service-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text-primary);
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<AdminDashboardStats>({
    totalUsers: 148,
    totalAccounts: 215,
    totalUserLogs: 8420,
    totalTransactionLogs: 24900
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getDashboardStats().subscribe(s => this.stats.set(s));
  }
}
