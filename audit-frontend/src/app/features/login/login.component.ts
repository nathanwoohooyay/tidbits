import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card glass-panel">
        <div class="card-header">
          <img class="brand-logo" src="logos/logo-light-mode.png" width="44" height="44" alt="" draggable="false" />
          <div class="brand-badge">
            <span class="pulse-dot"></span>
            <span>Secure audit portal</span>
          </div>
          <h1 class="portal-title">BitTrader Audit</h1>
          <p class="portal-sub">Trading analytics, compliance and access management</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div *ngIf="errorMessage()" class="alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>

          <div class="form-group">
            <label for="username">Username or ID</label>
            <div class="input-with-icon">
              <input
                id="username"
                type="text"
                class="input-control"
                placeholder="Enter your username"
                [(ngModel)]="username"
                name="username"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Security Password</label>
            <div class="input-with-icon">
              <input
                id="password"
                type="password"
                class="input-control"
                placeholder="••••••••••••"
                [(ngModel)]="password"
                name="password"
                required
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="loading()"
          >
            <span *ngIf="!loading()">Authenticate Session</span>
            <span *ngIf="loading()">Verifying Credentials...</span>
          </button>
        </form>

        <div class="card-footer">
          <span>BitTrader • Audit &amp; Compliance</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      background: var(--bg-main);
    }




    .login-card {
      width: 100%;
      max-width: 480px;
      padding: 40px;
      position: relative;
      z-index: 10;
      background: rgba(246, 240, 234, 0.94);
      border: 1px solid rgba(76, 47, 36, 0.2);
      box-shadow: 0 25px 60px -15px rgba(76, 47, 36, 0.16), 0 0 25px rgba(122, 70, 56, 0.08);
    }

    .brand-logo {
      display: block;
      margin: 0 auto 14px;
    }

    .card-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(122, 70, 56, 0.1);
      border: 1px solid rgba(122, 70, 56, 0.28);
      color: var(--accent-cognac);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 14px;
    }

    .portal-title {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    .portal-sub {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .form-group label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-block {
      width: 100%;
      padding: 13px;
      font-size: 14px;
      margin-top: 6px;
    }

    .alert-error {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(186, 11, 47, 0.1);
      border: 1px solid rgba(186, 11, 47, 0.3);
      color: #BA0B2F;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
    }

    .card-footer {
      text-align: center;
      margin-top: 30px;
      font-size: 11px;
      color: var(--text-muted);
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService
  ) {}

  onSubmit() {
    if (!this.username) {
      this.errorMessage.set('Please enter your username');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.authService.redirectByRole();
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 0 || err.status === 404 || err.status === 502) {
          this.errorMessage.set('Auth service unreachable. Please try again shortly.');
        } else if (err.error?.code === 'ROLE_NOT_ALLOWED' || err.message === 'AUDIT_ROLE_REQUIRED') {
          this.errorMessage.set('This account does not have access to the audit portal.');
        } else {
          this.errorMessage.set('Invalid credentials. Please verify your access.');
        }
      }
    });
  }
}
