import { Component, input, output } from '@angular/core';

// Friendly "couldn't load this" panel: a small broken-chart drawing, a plain-language message and a retry button.
@Component({
  selector: 'app-error-state',
  standalone: true,
  host: { role: 'alert' },
  template: `
    <svg class="err-art" viewBox="0 0 120 64" aria-hidden="true">
      <path class="err-grid" d="M4 58h112"/>
      <path class="err-line" d="M6 46 L24 38 L38 42 L52 26"/>
      <path class="err-gap" d="M58 22 L66 18"/>
      <path class="err-line" d="M72 30 L86 22 L100 28 L114 12"/>
      <circle class="err-dot" cx="52" cy="26" r="3"/>
      <circle class="err-dot" cx="72" cy="30" r="3"/>
    </svg>
    <p class="err-title">{{ title() }}</p>
    @if (message()) {
      <p class="err-message">{{ message() }}</p>
    }
    @if (retryLabel()) {
      <button type="button" class="btn-secondary err-retry" (click)="retry.emit()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>
        {{ retryLabel() }}
      </button>
    }
  `,
  styles: [`
    :host {
      display: grid;
      justify-items: center;
      align-content: center;
      gap: .25rem;
      padding: 2rem 1rem;
      text-align: center;
    }

    .err-art {
      width: 7.5rem;
      height: 4rem;
      margin-bottom: .75rem;
      overflow: visible;
    }

    .err-grid {
      stroke: var(--clr-border);
      stroke-width: 1.5;
      stroke-dasharray: 3 4;
    }

    .err-line {
      fill: none;
      stroke: var(--clr-border-mid);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .err-gap {
      stroke: var(--clr-loss);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 2 6;
    }

    .err-dot {
      fill: var(--clr-surface);
      stroke: var(--clr-border-mid);
      stroke-width: 2.5;
    }

    .err-title {
      font-size: .95rem;
      font-weight: 700;
      color: var(--clr-espresso);
    }

    .err-message {
      max-width: 36ch;
      font-size: .85rem;
      color: var(--clr-sienna);
    }

    .err-retry {
      margin-top: 1rem;
      padding: .5rem 1rem;
      font-size: .85rem;
    }

    .err-retry svg {
      width: 1rem;
      height: 1rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `]
})
export class ErrorStateComponent {
  readonly title = input('Something went wrong');
  readonly message = input('');
  readonly retryLabel = input('Try again');
  readonly retry = output<void>();
}
