import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { PortfolioQueries, REFRESH_INTERVAL_MS } from '../../services/portfolio-queries';
import { WatchlistService } from '../../services/watchlist.service';
import { TradeTarget } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';
import { tickerToName } from './stock';
import { SparklineComponent } from './sparkline.component';
import { TickerLogoComponent } from './ticker-logo.component';
import { RollingNumberComponent } from '../rolling-number.component';
import { SkeletonRowsComponent } from '../skeleton-rows.component';

interface WatchRow {
  ticker: string;
  name: string;
  instrumentId: number | null;
  price: number | null;
  changePercent: number | null;
}

// Stocks the user follows, under Holdings in the dashboard's right-hand column: live price, today's change, a
// one-month sparkline, a Trade button, and the star to stop following. Stocks are starred from the trade window.
@Component({
  selector: 'app-dashboard-watchlist',
  standalone: true,
  imports: [CommonModule, SparklineComponent, TickerLogoComponent, RollingNumberComponent, SkeletonRowsComponent],
  template: `
    <section class="section-card holdings-rail" aria-label="Watchlist">
      <div class="section-header">
        <span class="section-title">Watchlist</span>
        @if (!loading() && rows().length) {
          <span class="section-meta">{{ rows().length }} stock{{ rows().length !== 1 ? 's' : '' }}</span>
        }
      </div>

      @if (loading()) {
        <app-skeleton-rows variant="holding" [rows]="2"></app-skeleton-rows>
      } @else if (rows().length === 0) {
        <div class="watch-empty">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7.9-5.6-4-3.9 5.6-.8z"/></svg>
          <p>Star a stock in the trade window to follow it here.</p>
        </div>
      } @else {
        <ul class="holding-list">
          @for (row of rows(); track row.ticker) {
            <li class="holding-row watch-row">
              <app-ticker-logo [ticker]="row.ticker"></app-ticker-logo>
              <div class="instrument-cell">
                <span class="ticker-badge">{{ row.ticker }}</span>
                <span class="stock-name">{{ row.name }}</span>
              </div>
              <app-sparkline class="holding-spark" [ticker]="row.ticker"></app-sparkline>
              <div class="holding-value">
                @if (row.price !== null) {
                  <app-rolling-number class="price-value" [value]="row.price"></app-rolling-number>
                  <span class="holding-change" [class.gain-text]="(row.changePercent ?? 0) >= 0" [class.loss-text]="(row.changePercent ?? 0) < 0">
                    {{ formatPercent(row.changePercent ?? 0) }}
                  </span>
                } @else {
                  <span class="muted-cell">—</span>
                }
              </div>
              <span class="watch-actions">
                <button type="button" class="watch-unstar" (click)="watchlist.toggle(row.ticker)"
                        [attr.aria-label]="'Stop watching ' + row.ticker" title="Remove from watchlist">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7.9-5.6-4-3.9 5.6-.8z"/></svg>
                </button>
                <button type="button" class="btn-trade" (click)="trade.emit({ instrumentId: row.instrumentId, ticker: row.ticker, name: row.name })"
                        [attr.aria-label]="'Trade ' + row.ticker">Trade</button>
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .watch-row {
      grid-template-columns: auto minmax(0, 1fr) auto auto auto;
    }

    .watch-actions {
      display: flex;
      align-items: center;
      gap: .25rem;
    }

    .watch-unstar {
      display: grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--clr-pending);
      cursor: pointer;
      transition: background var(--transition), color var(--transition);
    }

    .watch-unstar:hover {
      background: var(--clr-surface-soft);
      color: var(--clr-sienna);
    }

    .watch-unstar svg {
      width: 1rem;
      height: 1rem;
      fill: currentColor;
      stroke: currentColor;
      stroke-width: 1.4;
      stroke-linejoin: round;
    }

    .watch-empty {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: 1rem 0;
      font-size: .85rem;
      color: var(--clr-sienna);
    }

    .watch-empty svg {
      flex: none;
      width: 1.25rem;
      height: 1.25rem;
      fill: none;
      stroke: var(--clr-border-mid);
      stroke-width: 1.6;
      stroke-linejoin: round;
    }
  `]
})
export class DashboardWatchlistComponent {
  readonly trade = output<TradeTarget>();

  readonly watchlist = inject(WatchlistService);
  private readonly queries = inject(PortfolioQueries);
  private readonly userId = this.watchlist.userId();

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;

  private readonly listQuery = injectQuery(() => ({
    ...this.watchlist.list(this.userId),
    enabled: this.userId > 0,
  }));
  private readonly tickers = computed(() => (this.listQuery.data() ?? []).map(item => item.ticker));
  private readonly quotesQuery = injectQuery(() => ({
    ...this.queries.quotes(this.tickers()),
    enabled: this.tickers().length > 0,
    refetchInterval: REFRESH_INTERVAL_MS,
  }));

  readonly loading = computed(() => this.listQuery.isPending() && this.userId > 0);
  // In the order they were added; prices fill in as quotes arrive.
  readonly rows = computed<WatchRow[]>(() => {
    const quotes = new Map((this.quotesQuery.data() ?? []).map(q => [q.symbol?.toUpperCase(), q]));
    return (this.listQuery.data() ?? []).map(item => {
      const quote = quotes.get(item.ticker);
      return {
        ticker: item.ticker,
        name: item.name ?? tickerToName.get(item.ticker) ?? item.ticker,
        instrumentId: quote?.instrumentId ?? null,
        price: quote?.price ?? null,
        changePercent: quote?.changePercent ?? null,
      };
    });
  });
}
