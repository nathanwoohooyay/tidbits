import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TradeTarget } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';
import { quantityUnit } from './stock';
import { RollingNumberComponent } from '../rolling-number.component';
import { HoldingDTO } from '../../services/portfolio-queries';
import { SparklineComponent } from './sparkline.component';
import { TickerLogoComponent } from './ticker-logo.component';
import { SkeletonRowsComponent } from '../skeleton-rows.component';
import { ErrorStateComponent } from '../error-state.component';

@Component({
  selector: 'app-dashboard-holdings',
  standalone: true,
  imports: [CommonModule, SparklineComponent, TickerLogoComponent, RollingNumberComponent, SkeletonRowsComponent, ErrorStateComponent],
  templateUrl: './dashboard-holdings.component.html'
})
export class DashboardHoldingsComponent {
  @Input() holdings: HoldingDTO[] = [];
  @Input() loading = false;
  @Input() error = '';
  @Output() trade = new EventEmitter<TradeTarget>();
  @Output() retry = new EventEmitter<void>();

  readonly formatCurrency = formatCurrency;

  readonly quantityUnit = quantityUnit;
  readonly formatPercent = formatPercent;

  openTrade(holding: HoldingDTO) {
    this.trade.emit({ instrumentId: holding.instrument_id, ticker: holding.ticker, name: holding.name });
  }

  // Largest positions first.
  get sortedHoldings(): HoldingDTO[] {
    return [...this.holdings].sort((a, b) => b.totalValue - a.totalValue);
  }
}
