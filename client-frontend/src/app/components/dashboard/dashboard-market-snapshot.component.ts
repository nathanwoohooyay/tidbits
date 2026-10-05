import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Instrument, TrendFilter, TradeMode } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';

@Component({
  selector: 'app-dashboard-market-snapshot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-market-snapshot.component.html'
})
export class DashboardMarketSnapshotComponent {
  @Input() instruments: Instrument[] = [];
  @Input() trendFilter: TrendFilter = 'trending';
  @Input() usingPlaceholderMarketData = false;

  @Output() trendFilterChange = new EventEmitter<TrendFilter>();
  @Output() quickTrade = new EventEmitter<{ instrumentId: number; mode: TradeMode }>();

  readonly filters: Array<[TrendFilter, string]> = [
    ['trending', 'Trending'],
    ['gainers', 'Top Gainers'],
    ['losers', 'Top Losers'],
    ['volume', 'Volume'],
  ];

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;

  get trendingStocks(): Instrument[] {
    const all = [...this.instruments];
    switch (this.trendFilter) {
      case 'gainers':
        return all.sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
      case 'losers':
        return all.sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);
      case 'volume':
        return all.sort((a, b) => b.volume - a.volume).slice(0, 10);
      default:
        return all.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 10);
    }
  }
}

