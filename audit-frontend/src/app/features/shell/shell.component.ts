import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell-layout">
      <!-- Top Navigation Header -->
      <header class="shell-header glass-panel">
        <div class="header-left">
          <div class="brand">
            <div class="brand-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div class="brand-text">
              <div class="brand-name">TIDBITS <span class="highlight">AUDIT</span></div>
              <div class="brand-sub">Platform v2.4 • Institutional</div>
            </div>
          </div>
        </div>

        <div class="header-center">
          <div class="system-status-chip">
            <span class="pulse-dot"></span>
            <span>SYSTEM AUDIT STREAM: <strong>ACTIVE</strong></span>
          </div>
        </div>

        <div class="header-right">
          <!-- User Profile Chip -->
          <div class="user-chip">
            <div class="user-avatar">
              {{ ('' + (authService.currentUser()?.username || 'U')).charAt(0).toUpperCase() }}
            </div>
            <div class="user-details">
              <div class="user-name">{{ authService.currentUser()?.username || 'Examiner' }}</div>
              <div class="badge" [ngClass]="authService.isAdmin() ? 'badge-admin' : 'badge-auditor'">
                {{ authService.userRole() || 'AUDITOR' }}
              </div>
            </div>
          </div>

          <button
            id="btn-logout"
            class="btn btn-secondary btn-sm logout-btn"
            (click)="logout()"
            title="Terminate secure session"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Exit</span>
          </button>
        </div>
      </header>

      <div class="shell-body">
        <!-- Sidebar Navigation -->
        <aside class="shell-sidebar glass-panel">
          <div class="nav-section-label">AUDIT INTELLIGENCE</div>
          <nav class="nav-links">
            <a
              id="nav-analytics"
              routerLink="/auditor/analytics"
              routerLinkActive="active"
              class="nav-item"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span>Trading Analytics</span>
            </a>

            <a
              id="nav-reports"
              routerLink="/auditor/reports"
              routerLinkActive="active"
              class="nav-item"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Generate Reports</span>
            </a>

            <a
              id="nav-logs"
              routerLink="/auditor/logs"
              routerLinkActive="active"
              class="nav-item"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <span>Audit Event Logs</span>
            </a>
          </nav>

          <!-- Admin Section (Only visible to Admin) -->
          <div *ngIf="authService.isAdmin()" class="admin-nav-group animate-fade-in">
            <div class="nav-section-label admin-label">ADMINISTRATION</div>
            <nav class="nav-links">
              <a
                id="nav-admin-dashboard"
                routerLink="/admin/dashboard"
                routerLinkActive="active"
                class="nav-item"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Admin Dashboard</span>
              </a>

              <a
                id="nav-admin-users"
                routerLink="/admin/users"
                routerLinkActive="active"
                class="nav-item"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>User Management</span>
              </a>
            </nav>
          </div>

          <div class="sidebar-footer">
            <div class="compliance-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>SOC2 & FINRA READY</span>
            </div>
          </div>
        </aside>

        <!-- Main Content View -->
        <main class="shell-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .shell-header {
      height: 68px;
      margin: 12px 16px 0;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 50;
      border-radius: var(--radius-lg);
    }

    .header-left .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #331b0e 0%, #542d17 100%);
      border: 1px solid #6b3a1d;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fcefdc;
      box-shadow: 0 4px 12px rgba(51, 27, 14, 0.25);
    }

    .brand-name {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: var(--text-primary);
    }

    .brand-name .highlight {
      color: var(--accent-cognac);
    }

    .brand-sub {
      font-size: 11px;
      color: var(--text-muted);
    }

    .system-status-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(42, 97, 66, 0.09);
      border: 1px solid rgba(42, 97, 66, 0.22);
      border-radius: 9999px;
      font-size: 11px;
      color: #2a6142;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px 4px 6px;
      background: #fbf7ef;
      border: 1px solid var(--border-subtle);
      border-radius: 9999px;
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #331b0e, #5d361c);
      color: #f7f2e8;
      font-weight: 700;
      font-size: 12px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-name {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .logout-btn {
      padding: 7px 12px;
    }

    .shell-body {
      display: flex;
      flex: 1;
      padding: 14px 16px 20px;
      gap: 16px;
    }

    .shell-sidebar {
      width: 240px;
      padding: 20px 14px;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      height: calc(100vh - 108px);
      position: sticky;
      top: 94px;
    }

    .nav-section-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--text-muted);
      padding: 0 10px 10px;
    }

    .admin-label {
      color: var(--accent-cognac);
      margin-top: 24px;
    }

    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .nav-item:hover {
      background: #f5eedf;
      color: var(--text-primary);
    }

    .nav-item.active {
      background: linear-gradient(90deg, rgba(138, 78, 35, 0.12) 0%, rgba(51, 27, 14, 0.05) 100%);
      color: var(--accent-brown);
      border-color: rgba(138, 78, 35, 0.3);
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(51, 27, 14, 0.06);
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--border-subtle);
    }

    .compliance-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: rgba(138, 78, 35, 0.07);
      border: 1px solid rgba(138, 78, 35, 0.18);
      border-radius: var(--radius-md);
      font-size: 10.5px;
      font-weight: 700;
      color: var(--text-secondary);
    }

    .shell-main {
      flex: 1;
      min-width: 0;
    }
  `]
})
export class ShellComponent {
  constructor(
    public authService: AuthService
  ) {}

  logout() {
    this.authService.logout();
  }
}
