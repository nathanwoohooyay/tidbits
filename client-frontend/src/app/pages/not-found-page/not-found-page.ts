import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandLogoComponent } from '../../components/brand-logo.component';
import { SessionService } from '../../services/session.service';

// Shown for any URL that doesn't match a page: a chart line that runs off a cliff, and a way back.
@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, BrandLogoComponent],
  template: `
    <main class="nf">
      <a class="nf-brand" [routerLink]="home()">
        <app-brand-logo [size]="30" surface="page"></app-brand-logo>
        <span>BitTrader</span>
      </a>

      <div class="nf-body">
        <svg class="nf-art" viewBox="0 0 320 150" aria-hidden="true">
          <defs>
            <linearGradient id="nf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="var(--clr-gain)" stop-opacity=".22" />
              <stop offset="1" stop-color="var(--clr-gain)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path class="nf-axis" d="M8 140h304" />
          <path d="M10 112 C40 108 52 92 78 94 S118 70 142 74 S178 46 200 44 L200 140 L10 140 Z" fill="url(#nf-fill)" />
          <path class="nf-line" d="M10 112 C40 108 52 92 78 94 S118 70 142 74 S178 46 200 44" />
          <circle class="nf-end" cx="200" cy="44" r="5" />
          <path class="nf-drop" d="M206 50 Q236 70 248 132" />
          <text class="nf-q" x="262" y="96">?</text>
        </svg>

        <p class="nf-code">404</p>
        <h1 class="nf-title">This page went off the chart</h1>
        <p class="nf-sub">The link may be old or mistyped. Your accounts and holdings are safe.</p>

        <div class="nf-actions">
          <a class="btn-primary" [routerLink]="home()">{{ session.isAuthenticated() ? 'Back to dashboard' : 'Go to sign in' }}</a>
          <button type="button" class="btn-secondary" (click)="back()">Go back</button>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .nf {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr;
      padding: 2rem clamp(1rem, 6vw, 7rem);
      background: var(--page-background);
    }

    .nf-brand {
      display: inline-flex;
      align-items: center;
      gap: .75rem;
      justify-self: start;
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--clr-espresso);
      text-decoration: none;
    }

    .nf-body {
      align-self: center;
      justify-self: center;
      display: grid;
      justify-items: center;
      text-align: center;
      max-width: 34rem;
      padding-bottom: 4rem;
      animation: fadeInUp .45s ease both;
    }

    .nf-art {
      width: min(320px, 80vw);
      height: auto;
      margin-bottom: 1.5rem;
      overflow: visible;
    }

    .nf-axis {
      stroke: var(--clr-border);
      stroke-width: 1.5;
      stroke-dasharray: 4 5;
    }

    .nf-line {
      fill: none;
      stroke: var(--clr-gain);
      stroke-width: 3.5;
      stroke-linecap: round;
    }

    .nf-end {
      fill: var(--page-background);
      stroke: var(--clr-gain);
      stroke-width: 3;
    }

    .nf-drop {
      fill: none;
      stroke: var(--clr-loss);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 3 8;
    }

    .nf-q {
      font-size: 2.5rem;
      font-weight: 800;
      fill: var(--clr-border-mid);
    }

    .nf-code {
      font-size: .8rem;
      font-weight: 700;
      letter-spacing: .18em;
      color: var(--clr-sienna);
    }

    .nf-title {
      margin-top: .5rem;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 700;
      letter-spacing: -.035em;
      line-height: 1.1;
      color: var(--clr-espresso);
    }

    .nf-sub {
      margin-top: .75rem;
      font-size: .95rem;
      color: var(--clr-sienna);
    }

    .nf-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: .75rem;
      margin-top: 2rem;
    }

    .nf-actions a {
      text-decoration: none;
    }
  `]
})
export class NotFoundPageComponent {
  readonly session = inject(SessionService);

  home() {
    return this.session.isAuthenticated() ? '/maindashboard' : '/login';
  }

  back() {
    history.back();
  }
}
