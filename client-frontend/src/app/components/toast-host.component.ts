import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { TickerLogoComponent } from './dashboard/ticker-logo.component';

// Renders the toast stack: bottom right on desktop, bottom centre on phones. Newest at the bottom.
@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [TickerLogoComponent],
  template: `
    <section class="toast-stack" aria-label="Notifications">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.kind" [class.leaving]="toast.leaving"
             [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
             [style.--toast-duration.ms]="toast.durationMs"
             (mouseenter)="toasts.pause(toast.id)" (mouseleave)="toasts.resume(toast.id)"
             (focusin)="toasts.pause(toast.id)" (focusout)="toasts.resume(toast.id)">
          <span class="toast-icon" aria-hidden="true">
            @if (toast.ticker) {
              <app-ticker-logo [ticker]="toast.ticker" style="--logo-size: 2rem"></app-ticker-logo>
              <span class="toast-side-dot"></span>
            } @else if (toast.kind === 'error') {
              <svg viewBox="0 0 24 24"><path d="M12 8v5M12 16.5v.01"/><circle cx="12" cy="12" r="9"/></svg>
            } @else {
              <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
            }
          </span>
          <div class="toast-text">
            <p class="toast-title">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="toast-message">{{ toast.message }}</p>
            }
          </div>
          <button type="button" class="toast-close" (click)="toasts.dismiss(toast.id)" aria-label="Dismiss notification">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>
          </button>
          <span class="toast-timer" aria-hidden="true"></span>
        </div>
      }
    </section>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      z-index: 10000;
      right: 1.5rem;
      bottom: 1.5rem;
      display: grid;
      gap: .75rem;
      width: min(380px, calc(100vw - 2rem));
      pointer-events: none;
    }

    .toast {
      position: relative;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: .75rem;
      padding: .75rem .75rem .75rem 1rem;
      overflow: hidden;
      border-radius: var(--radius-lg);
      background: var(--clr-surface);
      color: var(--clr-text);
      box-shadow: 0 18px 40px var(--clr-shadow-deep), 0 0 0 1px var(--clr-hairline);
      pointer-events: auto;
      animation: toast-in .32s cubic-bezier(.2, .9, .3, 1.15) both;
    }

    .toast.leaving {
      animation: toast-out .22s ease-in both;
    }

    .toast-icon {
      position: relative;
      display: grid;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      color: var(--toast-tone);
      background: color-mix(in oklab, var(--toast-tone) 14%, transparent);
    }

    .toast-icon:has(app-ticker-logo) {
      background: none;
    }

    .toast-icon svg {
      width: 1.15rem;
      height: 1.15rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Small buy/sell marker on the stock logo, matching the dots on the price chart. */
    .toast-side-dot {
      position: absolute;
      right: -.125rem;
      bottom: -.125rem;
      width: .75rem;
      height: .75rem;
      border-radius: 50%;
      background: var(--toast-tone);
      box-shadow: 0 0 0 2px var(--clr-surface);
    }

    .toast-text {
      min-width: 0;
    }

    .toast-title {
      font-size: .9rem;
      font-weight: 700;
      color: var(--clr-espresso);
      letter-spacing: -.01em;
    }

    .toast-message {
      margin-top: .125rem;
      font-size: .8rem;
      color: var(--clr-sienna);
      font-variant-numeric: tabular-nums;
    }

    .toast-close {
      align-self: start;
      display: grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--clr-sienna);
      cursor: pointer;
      transition: background var(--transition), color var(--transition);
    }

    .toast-close:hover {
      background: var(--clr-surface-soft);
      color: var(--clr-espresso);
    }

    .toast-close svg {
      width: .9rem;
      height: .9rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
    }

    /* Time left before it closes; pauses with the timer while hovered. */
    .toast-timer {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 2px;
      width: 100%;
      background: var(--toast-tone);
      opacity: .55;
      transform-origin: left;
      animation: toast-timer var(--toast-duration, 5000ms) linear both;
    }

    .toast:hover .toast-timer,
    .toast:focus-within .toast-timer {
      animation-play-state: paused;
    }

    .toast-buy,
    .toast-success { --toast-tone: var(--clr-gain); }
    .toast-sell { --toast-tone: var(--clr-loss); }
    .toast-error { --toast-tone: var(--clr-loss); }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(16px) scale(.97); }
      to { opacity: 1; transform: none; }
    }

    @keyframes toast-out {
      to { opacity: 0; transform: translateX(24px); }
    }

    @keyframes toast-timer {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    @media (max-width: 720px) {
      .toast-stack {
        right: 50%;
        bottom: 1rem;
        transform: translateX(50%);
      }

      @keyframes toast-out {
        to { opacity: 0; transform: translateY(16px); }
      }
    }
  `]
})
export class ToastHostComponent {
  readonly toasts = inject(ToastService);
}
