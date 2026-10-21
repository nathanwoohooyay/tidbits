import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, inject, Input, Output, signal } from '@angular/core';
import { Instrument, TrendFilter, TradeMode } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';
import { tickerToName } from './stock';
import { PricingQuoteDTO, PricingService } from '../../services/pricing.service';

@Component({
  selector: 'app-dashboard-market-snapshot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-market-snapshot.component.html'
})
export class DashboardMarketSnapshotComponent implements OnInit {
  @Input() trendFilter: TrendFilter = 'trending';

  @Output() trendFilterChange = new EventEmitter<TrendFilter>();
  @Output() quickTrade = new EventEmitter<{ instrumentId: number; mode: TradeMode }>();

  readonly filters: Array<[TrendFilter, string]> = [
    ['gainers', 'Top Gainers'],
    ['losers', 'Top Losers'],
  ];

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;

  private readonly pricingService = inject(PricingService);
  private readonly symbols = ['AAPL', 'MSFT', 'GOOGL', 'WMT', 'AMZN', 'META', 'TSLA'];
  readonly instruments = signal<Instrument[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit() {
    this.loadMarketSnapshot();
  }

  private loadMarketSnapshot() {
    this.loading.set(true);
    this.error.set('');

    this.pricingService.getQuotes(this.symbols.join(',')).subscribe({
      next: response => {
        this.instruments.set(response.quotes
          .filter(quote => quote.price != null && quote.symbol != null)
          .map(quote => this.toDashboardInstrument(quote)));
        this.loading.set(false);
      },
      error: err => {
        this.instruments.set([]);
        this.error.set(err?.error?.message ?? err?.error?.error ?? 'Failed to load market data.');
        this.loading.set(false);
      },
    });
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

