import { Component, computed, input, signal } from '@angular/core';
import { HoldingDTO } from '../../services/portfolio-queries';
import { formatCurrency } from './dashboard.utils';
import { ColorFamily, claimBrandColors } from './brand-colors';

interface Segment {
  key: string;
  label: string;
  value: number;
  share: number;
  color: string;
}

const MAX_NAMED = 5; // largest positions shown individually; the rest fold into "Other"
const TICKER_SLOTS = 5; // --alloc-1..5 for named tickers; --alloc-6 is "Other"
const SLOT_FAMILIES: ColorFamily[] = ['blue', 'yellow', 'magenta', 'purple', 'orange']; // hues of --alloc-1..5

function homeSlot(ticker: string): number {
  let hash = 0;
  for (const ch of ticker.toUpperCase()) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return hash % TICKER_SLOTS;
}

// Tickers are placed alphabetically so a clash always resolves the same way for the same set of stocks.
// `blocked` slots are skipped: their hue is already on screen as a brand colour.
export function assignSlots(tickers: string[], blocked: ReadonlySet<number> = new Set()): Map<string, number> {
  const taken = new Set<number>(blocked);
  const slots = new Map<string, number>();
  for (const ticker of [...tickers].sort()) {
    let slot = homeSlot(ticker);
    for (let tries = 0; taken.has(slot) && tries < TICKER_SLOTS; tries++) {
      slot = (slot + 1) % TICKER_SLOTS;
    }
    taken.add(slot);
    slots.set(ticker, slot + 1);
  }
  return slots;
}

// Each ticker's colour: its brand colour (Tesla red, Nvidia green) when it has one, else an --alloc slot.
// Tickers are given biggest first; when two brands share a hue, an iconic brand wins, else the bigger position.
export function assignColors(tickers: string[]): Map<string, string> {
  const claimed = claimBrandColors(tickers);
  const usedFamilies = new Set<ColorFamily>([...claimed.values()].map(c => c.family));
  const colors = new Map<string, string>();
  const unbranded: string[] = [];
  for (const ticker of tickers) {
    const brand = claimed.get(ticker);
    if (brand) {
      // Black brands would vanish in dark mode, so they use the ink colour for the current theme.
      colors.set(ticker, brand.family === 'black' ? 'var(--alloc-ink)' : brand.color);
    } else {
      unbranded.push(ticker);
    }
  }
  const blocked = new Set(SLOT_FAMILIES.flatMap((family, slot) => usedFamilies.has(family) ? [slot] : []));
  for (const [ticker, slot] of assignSlots(unbranded, blocked)) {
    colors.set(ticker, `var(--alloc-${slot})`);
  }
  return colors;
}

// Where the account's money sits: one stacked bar of positions plus cash, with a legend and hover readout.
// A stock's colour follows the stock, so it's the same here and on the Overview: well-known tickers get their brand
// colour (brand-colors.ts); the rest hash to a home slot in --alloc-1..5 (validated for colour-blind separation in
// light and dark mode), skipping slots whose hue a brand colour already shows.
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

    const colorByTicker = assignColors(named.map(h => h.ticker));
    const segments: Segment[] = named.map(h => ({
      key: h.ticker,
      label: h.ticker,
      value: h.totalValue,
      share: h.totalValue / total,
      color: colorByTicker.get(h.ticker)!,
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
