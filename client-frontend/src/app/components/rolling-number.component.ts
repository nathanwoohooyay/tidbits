import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { formatCurrency } from './dashboard/dashboard.utils';

interface RollingChar {
  key: number;   // position counted from the right, so units stay units when the number gains a digit
  char: string;
  digit: number | null;
}

// A number whose digits roll to their new values when it changes, with a brief green or red flash for the
// direction. The plain text stays in the layout (invisible) so width, baseline and screen readers behave as usual.
@Component({
  selector: 'app-rolling-number',
  standalone: true,
  template: `
    <span class="rn" [class.rn-up]="flash() === 'up'" [class.rn-down]="flash() === 'down'">
      <span class="rn-text">{{ text() }}</span>
      <span class="rn-live" aria-hidden="true">
        @for (c of chars(); track c.key) {
          @if (c.digit !== null) {
            <span class="rn-slot"><span class="rn-sizer">{{ c.char }}</span><span class="rn-strip" [style.--d]="c.digit">@for (n of digits; track n) {<span>{{ n }}</span>}</span></span>
          } @else {
            <span class="rn-char">{{ c.char }}</span>
          }
        }
      </span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
      font-variant-numeric: tabular-nums;
    }

    .rn {
      position: relative;
      display: inline-block;
      line-height: 1.15;
      white-space: nowrap;
    }

    /* Transparent rather than hidden, so screen readers and copy-paste still get the real text. */
    .rn-text {
      color: transparent;
    }

    .rn-live {
      position: absolute;
      inset: 0;
      display: flex;
    }

    .rn-slot {
      position: relative;
      height: 100%;
      overflow: hidden;
    }

    .rn-sizer {
      visibility: hidden;
    }

    .rn-strip {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      flex-direction: column;
      text-align: center;
      transform: translateY(calc(var(--d) * -1.15em));
      transition: transform .6s cubic-bezier(.2, .75, .25, 1);
    }

    .rn-strip span {
      height: 1.15em;
    }

    .rn-up .rn-live { animation: rn-flash-up 1.1s ease-out; }
    .rn-down .rn-live { animation: rn-flash-down 1.1s ease-out; }

    @keyframes rn-flash-up {
      from { color: var(--clr-gain); }
    }

    @keyframes rn-flash-down {
      from { color: var(--clr-loss); }
    }
  `]
})
export class RollingNumberComponent {
  readonly value = input(0);
  readonly format = input<(value: number) => string>(formatCurrency);

  readonly digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  readonly flash = signal<'up' | 'down' | null>(null);

  readonly text = computed(() => this.format()(this.value()));
  readonly chars = computed<RollingChar[]>(() => {
    const text = this.text();
    return [...text].map((char, i) => ({
      key: text.length - i,
      char,
      digit: /\d/.test(char) ? Number(char) : null,
    }));
  });

  private previous: number | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const value = this.value();
      untracked(() => {
        if (this.previous !== null && Number.isFinite(value) && value !== this.previous) {
          this.startFlash(value > this.previous ? 'up' : 'down');
        }
        this.previous = value;
      });
    });
  }

  // Clear first and re-apply on the next frame, so back-to-back changes in the same direction flash again.
  private startFlash(direction: 'up' | 'down') {
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
    }
    this.flash.set(null);
    requestAnimationFrame(() => {
      this.flash.set(direction);
      this.flashTimer = setTimeout(() => this.flash.set(null), 1100);
    });
  }
}
