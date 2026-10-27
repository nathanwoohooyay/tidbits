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
      <!-- Sidebar: brand, navigation, signed-in user -->
      <aside class="shell-sidebar" aria-label="Primary">
        <div class="brand">
          <img class="brand-logo" src="logos/logo-dark-mode.png" width="30" height="30" alt="" draggable="false" />
          <div class="brand-text">
            <div class="brand-name">BitTrader</div>
            <div class="brand-sub">Audit &amp; Compliance</div>
          </div>
        </div>

        <div class="nav-scroll">
          <div class="nav-section-label">Audit intelligence</div>
          <nav class="nav-links" aria-label="Audit">
            <a id="nav-analytics" routerLink="/auditor/analytics" routerLinkActive="active" class="nav-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span>Trading analytics</span>
            </a>

            <a id="nav-reports" routerLink="/auditor/compliance" routerLinkActive="active" class="nav-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Compliance</span>
            </a>

            <a id="nav-logs" routerLink="/auditor/logs" routerLinkActive="active" class="nav-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <span>Audit logs</span>
            </a>
          </nav>

          <!-- Admin Section (Only visible to Admin) -->
          <div *ngIf="authService.isAdmin()" class="admin-nav-group">
            <div class="nav-section-label">Administration</div>
            <nav class="nav-links" aria-label="Administration">
              <a id="nav-admin-dashboard" routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Admin dashboard</span>
              </a>

              <a id="nav-admin-users" routerLink="/admin/users" routerLinkActive="active" class="nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Users and roles</span>
              </a>
            </nav>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="user-chip">
            <div class="user-avatar" aria-hidden="true">
              {{ ('' + (authService.currentUser()?.username || 'U')).charAt(0).toUpperCase() }}
            </div>
            <div class="user-details">
              <div class="user-name">{{ authService.currentUser()?.username || 'Examiner' }}</div>
              <div class="badge" [ngClass]="authService.roleBadgeClass()">
                {{ authService.userRole() || 'AUDITOR' }}
              </div>
            </div>
          </div>

          <button id="btn-logout" class="logout-btn" (click)="logout()" title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <!-- Main Content View -->
      <main class="shell-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .shell-layout {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 248px minmax(0, 1fr);
    }

    .shell-sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem 1rem 1.1rem;
      background: var(--sidebar-bg);
      color: var(--sidebar-text);
      z-index: 40;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0 0.5rem;
    }

    .brand-logo {
      flex: none;
    }

    .brand-name {
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      line-height: 1.15;
    }

    .brand-sub {
      font-size: 0.66rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(241, 236, 230, 0.72);
    }

    .nav-scroll {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.4rem;
    }

    .nav-section-label {
      font-size: 0.66rem;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(241, 236, 230, 0.72);
      padding: 0 0.75rem 0.45rem;
    }

    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.6rem 0.75rem;
      border-radius: 10px;
      color: rgba(241, 236, 230, 0.8);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 500;
      transition: background 0.18s ease, color 0.18s ease;
    }

    .nav-item svg {
      flex: none;
    }

    .nav-item:hover {
      background: var(--sidebar-control-bg);
      color: var(--sidebar-text);
    }

    .nav-item.active {
      background: var(--sidebar-control-bg);
      color: var(--sidebar-text);
      font-weight: 600;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: -1rem;
      top: 22%;
      bottom: 22%;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: #E8E1DA;
    }

    .nav-item:focus-visible,
    .logout-btn:focus-visible {
      outline-color: #E8E1DA;
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding-top: 1rem;
      border-top: 1px solid var(--sidebar-control-border);
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0 0.5rem;
      min-width: 0;
    }

    .user-avatar {
      flex: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--sidebar-control-bg);
      border: 1px solid var(--sidebar-control-border);
      font-weight: 700;
      font-size: 0.8rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      min-width: 0;
    }

    .user-name {
      font-size: 0.86rem;
      font-weight: 600;
      line-height: 1.1;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: rgba(241, 236, 230, 0.8);
      font: inherit;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.18s ease, color 0.18s ease;
    }

    .logout-btn:hover {
      background: var(--sidebar-control-bg);
      color: #E07A92;
    }

    .shell-main {
      min-width: 0;
      padding: 2rem clamp(1rem, 2.5vw, 2.5rem) 3rem;
    }

    /* Narrow screens: the sidebar becomes a scrolling top bar, like the client app. */
    @media (max-width: 900px) {
      .shell-layout {
        grid-template-columns: 1fr;
      }

      .shell-sidebar {
        height: auto;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 0.75rem;
        overflow-x: auto;
      }

      .brand-text,
      .nav-section-label,
      .nav-item span,
      .user-details,
      .logout-btn span {
        display: none;
      }

      .nav-scroll {
        flex-direction: row;
        overflow: visible;
        gap: 0.25rem;
      }

      .nav-links {
        flex-direction: row;
      }

      .nav-item,
      .logout-btn {
        padding: 0.55rem;
      }

      .nav-item.active::before {
        left: 22%;
        right: 22%;
        top: auto;
        bottom: -0.55rem;
        width: auto;
        height: 3px;
        border-radius: 3px 3px 0 0;
      }

      .sidebar-footer {
        flex-direction: row;
        align-items: center;
        margin-left: auto;
        padding: 0 0 0 0.5rem;
        border-top: none;
        border-left: 1px solid var(--sidebar-control-border);
      }

      .user-chip {
        padding: 0;
      }

      .shell-main {
        padding: 1.25rem 1rem 2.5rem;
      }
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
