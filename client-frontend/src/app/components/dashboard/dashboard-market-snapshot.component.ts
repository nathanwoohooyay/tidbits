import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { Instrument, TradeTarget, TrendFilter } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';
import { tickerToName } from './stock';
import { PricingQuoteDTO } from '../../services/pricing.service';
import { MARKET_SYMBOLS, PortfolioQueries, REFRESH_INTERVAL_MS } from '../../services/portfolio-queries';
import { SparklineComponent } from './sparkline.component';
import { TickerLogoComponent } from './ticker-logo.component';
import { SkeletonRowsComponent } from '../skeleton-rows.component';
import { ErrorStateComponent } from '../error-state.component';


@Component({
  selector: 'app-dashboard-market-snapshot',
  standalone: true,
  imports: [CommonModule, SparklineComponent, TickerLogoComponent, SkeletonRowsComponent, ErrorStateComponent],
  templateUrl: './dashboard-market-snapshot.component.html'
})
export class DashboardMarketSnapshotComponent {
  @Input() trendFilter: TrendFilter = 'trending';

  @Output() trendFilterChange = new EventEmitter<TrendFilter>();
  @Output() trade = new EventEmitter<TradeTarget>();

  readonly filters: Array<[TrendFilter, string]> = [
    ['gainers', 'Top gainers'],
    ['losers', 'Top losers'],
  ];

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;

  private readonly queries = inject(PortfolioQueries);
  private readonly quotesQuery = injectQuery(() => ({
    ...this.queries.quotes(MARKET_SYMBOLS),
    refetchInterval: REFRESH_INTERVAL_MS,
  }));

  readonly instruments = computed(() => (this.quotesQuery.data() ?? [])
    .filter(quote => quote.price != null && quote.symbol != null)
    .map(quote => this.toDashboardInstrument(quote)));
  // Only the first load shows a loading state; background refetches keep the current rows.
  readonly loading = computed(() => this.quotesQuery.isPending());
  readonly error = computed(() => {
    const err = this.quotesQuery.error() as { error?: { message?: string; error?: string } } | null;
    return err && !this.quotesQuery.data() ? err.error?.message ?? err.error?.error ?? 'Failed to load market data.' : '';
  });

  retry() {
    void this.quotesQuery.refetch();
  }

  private toDashboardInstrument(quote: PricingQuoteDTO): Instrument {
    const symbol = quote.symbol.toUpperCase();
    const previousClose = quote.prevClose ?? quote.price;
    const changeAmount = quote.change ?? (quote.price - previousClose);

    return {
      instrument_id: quote.instrumentId,
      ticker: symbol,
      name: tickerToName.get(symbol) ?? symbol,
      type: 'EQUITY',
      market: 'MARKET',
      price: quote.price,
      changePercent: quote.changePercent ?? (previousClose ? (changeAmount / previousClose) * 100 : 0),
      changeAmount,
      volume: 0,
      volumeFormatted: 'N/A',
      marketCap: 'N/A',
      dayHigh: quote.price,
      dayLow: quote.price,
      sparkline: [],
    };
  }

  get trendingStocks(): Instrument[] {
    const all = [...this.instruments()];
    const byTicker = (a: Instrument, b: Instrument) => a.ticker.localeCompare(b.ticker);
    const byChange = (a: Instrument, b: Instrument) =>
      (Number.isFinite(b.changePercent) ? b.changePercent : Number.NEGATIVE_INFINITY)
      - (Number.isFinite(a.changePercent) ? a.changePercent : Number.NEGATIVE_INFINITY);

    switch (this.trendFilter) {
      case 'gainers':
        return all.sort((a, b) => byChange(a, b) || byTicker(a, b)).slice(0, 10);
      case 'losers':
        return all.sort((a, b) => byChange(b, a) || byTicker(a, b)).slice(0, 10);
      case 'volume':
        return all.sort((a, b) => b.volume - a.volume || byTicker(a, b)).slice(0, 10);
      default:
        return all.sort((a, b) =>
          Math.abs(b.changePercent) - Math.abs(a.changePercent) || byTicker(a, b)
        ).slice(0, 10);
    }
  }
}

