import { Component, EventEmitter, Output, computed, signal } from '@angular/core';
import { TradeTarget } from './dashboard.models';
import { tickerToName } from './stock';
import { TickerLogoComponent } from './ticker-logo.component';

const STOCKS = Array.from(tickerToName.entries()).map(([ticker, name]) => ({ ticker, name }));

// Ticker/company search combobox. Picking a result (or pressing Enter on a typed ticker) emits it for trading.
@Component({
  selector: 'app-dashboard-stock-search',
  standalone: true,
  imports: [TickerLogoComponent],
  templateUrl: './dashboard-stock-search.component.html',
  styleUrl: './dashboard-stock-search.component.css'
})
export class DashboardStockSearchComponent {
  @Output() stockSelected = new EventEmitter<TradeTarget>();

  readonly term = signal('');
  readonly open = signal(false);
  readonly activeIndex = signal(0);

  readonly results = computed(() => {
    const term = this.term().trim().toLowerCase();
    if (!term) {
      return [];
    }
    const tickerMatches = STOCKS.filter(s => s.ticker.toLowerCase().startsWith(term));
    const nameMatches = STOCKS.filter(s => !tickerMatches.includes(s)
      && (s.ticker.toLowerCase().includes(term) || s.name.toLowerCase().includes(term)));
    return [...tickerMatches, ...nameMatches].slice(0, 8);
  });

  onInput(value: string) {
    this.term.set(value);
    this.activeIndex.set(0);
    this.open.set(true);
  }

  onKeydown(event: KeyboardEvent) {
    const results = this.results();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open.set(true);
        this.activeIndex.set(Math.min(this.activeIndex() + 1, Math.max(results.length - 1, 0)));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        break;
      case 'Enter': {
        if (!this.open()) {
          return;
        }
        event.preventDefault();
        const picked = results[this.activeIndex()];
        const typed = this.term().trim().toUpperCase();
        if (picked) {
          this.select(picked.ticker, picked.name);
        } else if (typed) {
          this.select(typed, tickerToName.get(typed) ?? typed);
        }
        break;
      }
      case 'Escape':
        this.open.set(false);
        break;
    }
  }

  select(ticker: string, name: string) {
    this.stockSelected.emit({ instrumentId: null, ticker, name });
    this.term.set('');
    this.open.set(false);
  }

  // Delay closing so a click on a result registers before the list disappears.
  onBlur() {
    setTimeout(() => this.open.set(false), 120);
  }
}
