import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthBrandPanelComponent } from '../../components/auth-brand-panel.component';
import { ThemeService } from '../../services/theme.service';

// Shared frame for /login and /signup: the brand panel (logo, headline, candle chart) and the theme toggle stay
// mounted while only the form in the outlet changes, so switching forms doesn't restart the chart or move anything.
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterOutlet, AuthBrandPanelComponent],
  template: `
    <div class="login-screen">
      <app-auth-brand-panel class="auth-brand"></app-auth-brand-panel>
      <main class="auth-main">
        <button type="button" class="login-theme-toggle" role="switch" (click)="theme.toggle()"
                [attr.aria-checked]="theme.mode() === 'dark'" aria-label="Dark mode" title="Toggle dark mode">
          @if (theme.mode() === 'dark') {
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/></svg>
          } @else {
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>
          }
        </button>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AuthShellComponent {
  readonly theme = inject(ThemeService);
}
