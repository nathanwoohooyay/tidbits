import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { BrandLogoComponent } from '../../components/brand-logo.component';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { PortfolioQueries } from '../../services/portfolio-queries';

// Longest the spinner waits for the dashboard to preload before handing off anyway (it then finishes loading there).
const PRELOAD_CAP_MS = 6000;

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BrandLogoComponent],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly toasts = inject(ToastService);
  private readonly queries = inject(PortfolioQueries);
  // The app is zoneless: state changed after an HTTP response or a timer has to ask for a re-render.
  private readonly cdr = inject(ChangeDetectorRef);

  loginUsername = '';
  loginPassword = '';
  loginError = '';
  loginLoading = false;
  // Signed in: the button shows a check for a moment before the screen hands off to the dashboard.
  loginDone = false;
  // Set when arriving straight from creating an account.
  accountCreated = false;
  // Briefly true after a failed attempt, to shake the button.
  shake = false;

  constructor() {
    this.title.setTitle('BitTrader');
    const created = this.router.currentNavigation()?.extras.state?.['createdUsername'];
    if (typeof created === 'string' && created) {
      this.loginUsername = created;
      this.accountCreated = true;
    }
  }

  onLoginInputChange() {
    this.loginError = '';
    this.accountCreated = false;
  }

  login() {
    const username = this.loginUsername.trim();
    const password = this.loginPassword.trim();

    if (!username || !password) {
      this.loginError = 'Please enter username and password.';
      this.triggerShake();
      return;
    }

    this.loginLoading = true;
    this.loginError = '';

    this.authService.login(username, password).subscribe({
      next: async res => {
        if (!res?.token) {
          this.loginLoading = false;
          this.loginError = res?.error ?? 'Login failed. Check credentials.';
          this.triggerShake();
          return;
        }

        this.session.setAuthToken(res.token);
        // Keep spinning while the dashboard's code and data load, so it's complete the moment the screen hands off.
        await Promise.race([this.preloadDashboard(), new Promise(resolve => setTimeout(resolve, PRELOAD_CAP_MS))]);
        this.loginLoading = false;
        this.loginDone = true;
        this.cdr.markForCheck();
        // Long enough to see the button turn green and the check draw in.
        await new Promise(resolve => setTimeout(resolve, 700));
        await this.router.navigateByUrl('/dashboard');
        // After the pan and the sidebar/section cascade have settled.
        setTimeout(() => this.toasts.show({ kind: 'success', title: `Welcome back, ${username}`, message: 'You\'re signed in to BitTrader.' }), 2700);
      },
      error: err => {
        this.loginLoading = false;
        this.loginError = this.authService.getLoginErrorMessage(err);
        this.triggerShake();
      }
    });
  }

  private async preloadDashboard() {
    const userId = this.session.getAuthenticatedUserId() ?? 0;
    await Promise.allSettled([
      import('../dashboard-page/dashboard-page'),
      userId > 0 ? this.queries.preloadDashboard(userId, this.session.selectedAccountId()) : Promise.resolve(),
    ]);
  }

  // Restart the shake on every failure: clear it, then set it again on the next tick so the animation replays.
  private triggerShake() {
    this.shake = false;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.shake = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.shake = false;
        this.cdr.markForCheck();
      }, 500);
    });
  }
}

