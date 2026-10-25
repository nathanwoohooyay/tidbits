import { Component, computed, input, signal } from '@angular/core';
import { HoldingDTO } from '../../services/portfolio-queries';
import { formatCurrency } from './dashboard.utils';

interface Segment {
  key: string;
  label: string;
  value: number;
  share: number;
  color: string;
}

const MAX_NAMED = 5; // largest positions shown individually; the rest fold into "Other"

// Where the account's money sits: one stacked bar of positions plus cash, with a legend and hover readout.
// Colours come from --alloc-1..6 (validated for colour-blind separation in light and dark mode).
// A stock's colour follows the stock: slots go to the named tickers alphabetically, so price moves that
// reorder the segments never repaint them.
@Component({
  selector: 'app-allocation-bar',
  standalone: true,
  template: `
    @if (segments().length > 0) {
      <section class="allocation" aria-label="Portfolio allocation">
        <div class="allocation-head">
          <span class="allocation-title">Allocation</span>
          <span class="allocation-total">{{ formatCurrency(total()) }}</span>
        </div>

        <div class="allocation-bar" role="img" [attr.aria-label]="summary()" (pointerleave)="active.set(null)">
          @for (s of segments(); track s.key) {
            <span class="segment"
                  [style.flex-grow]="s.value"
                  [style.background]="s.color"
                  [class.dim]="active() && active() !== s.key"
                  (pointerenter)="active.set(s.key)"></span>
          }
        </div>

        <ul class="allocation-legend">
          @for (s of segments(); track s.key) {
            <li [class.dim]="active() && active() !== s.key"
                (pointerenter)="active.set(s.key)"
                (pointerleave)="active.set(null)">
              <span class="swatch" [style.background]="s.color" aria-hidden="true"></span>
              <span class="legend-label">{{ s.label }}</span>
              <span class="legend-share">{{ (s.share * 100).toFixed(1) }}%</span>
              @if (active() === s.key) {
                <span class="legend-value">{{ formatCurrency(s.value) }}</span>
              }
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: [`
    .allocation {
      display: grid;
      gap: .5rem;
    }

    .allocation-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: .78rem;
    }

    .allocation-title {
      font-weight: 600;
      color: var(--clr-sienna);
    }

    .allocation-total {
      color: var(--clr-sienna);
      font-variant-numeric: tabular-nums;
    }

    .allocation-bar {
      display: flex;
      gap: 2px;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
    }

    .segment {
      flex-basis: 0;
      min-width: 3px;
      transition: opacity .15s ease;
      cursor: default;
    }

    .allocation-legend {
      display: flex;
      flex-wrap: wrap;
      gap: .25rem 1rem;
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: .8rem;
    }

    .allocation-legend li {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      transition: opacity .15s ease;
    }

    .swatch {
      width: .6rem;
      height: .6rem;
      border-radius: 2px;
      flex: none;
    }

    .legend-label {
      font-weight: 600;
      color: var(--clr-text);
    }

    .legend-share,
    .legend-value {
      color: var(--clr-sienna);
      font-variant-numeric: tabular-nums;
    }

    .dim {
      opacity: .35;
    }
  `]
})
export class AllocationBarComponent {
  readonly holdings = input<HoldingDTO[]>([]);
  readonly cash = input(0);

  readonly formatCurrency = formatCurrency;
  readonly active = signal<string | null>(null);

  readonly total = computed(() => this.holdings().reduce((sum, h) => sum + h.totalValue, 0) + Math.max(this.cash(), 0));

  readonly segments = computed<Segment[]>(() => {
    const total = this.total();
    if (total <= 0) {
      return [];
    }
    const byValue = [...this.holdings()].filter(h => h.totalValue > 0).sort((a, b) => b.totalValue - a.totalValue);
    const named = byValue.slice(0, MAX_NAMED);
    const rest = byValue.slice(MAX_NAMED);

    const slotByTicker = new Map([...named].map(h => h.ticker).sort().map((ticker, i) => [ticker, i + 1]));
    const segments: Segment[] = named.map(h => ({
      key: h.ticker,
      label: h.ticker,
      value: h.totalValue,
      share: h.totalValue / total,
      color: `var(--alloc-${slotByTicker.get(h.ticker)})`,
    }));
    const otherValue = rest.reduce((sum, h) => sum + h.totalValue, 0);
    if (otherValue > 0) {
      segments.push({ key: '__other', label: `Other (${rest.length})`, value: otherValue, share: otherValue / total, color: 'var(--alloc-6)' });
    }
    if (this.cash() > 0) {
      segments.push({ key: '__cash', label: 'Cash', value: this.cash(), share: this.cash() / total, color: 'var(--alloc-cash)' });
    }
    return segments;
  });

  readonly summary = computed(() =>
    'Allocation: ' + this.segments().map(s => `${s.label} ${(s.share * 100).toFixed(1)}%`).join(', '));
}
