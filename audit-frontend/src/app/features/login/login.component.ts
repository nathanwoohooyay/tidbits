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
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <div class="login-card glass-panel">
        <div class="card-header">
          <div class="brand-badge">
            <span class="pulse-dot"></span>
            <span>SECURE AUDIT PORTAL</span>
          </div>
          <h1 class="portal-title">Tidbits Intelligence</h1>
          <p class="portal-sub">Institutional Auditing, Trading Analytics & Access Management</p>
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
          <span>Tidbits Trading Platform • Regulatory Audit Engine v2.4</span>
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
      background: radial-gradient(circle at 50% 25%, #ede2ce 0%, #f4eee2 65%);
    }

    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
    }

    .orb-1 {
      width: 450px;
      height: 450px;
      top: 10%;
      left: 15%;
      background: rgba(138, 78, 35, 0.12);
    }

    .orb-2 {
      width: 500px;
      height: 500px;
      bottom: 10%;
      right: 15%;
      background: rgba(51, 27, 14, 0.1);
    }

    .login-card {
      width: 100%;
      max-width: 480px;
      padding: 40px;
      position: relative;
      z-index: 10;
      background: rgba(255, 252, 246, 0.94);
      border: 1px solid rgba(62, 36, 21, 0.2);
      box-shadow: 0 25px 60px -15px rgba(51, 27, 14, 0.16), 0 0 25px rgba(138, 78, 35, 0.08);
    }

    .card-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(138, 78, 35, 0.1);
      border: 1px solid rgba(138, 78, 35, 0.28);
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
      background: rgba(163, 50, 36, 0.1);
      border: 1px solid rgba(163, 50, 36, 0.3);
      color: #a33224;
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
        } else {
          this.errorMessage.set('Invalid credentials. Please verify your access.');
        }
      }
    });
  }
}
