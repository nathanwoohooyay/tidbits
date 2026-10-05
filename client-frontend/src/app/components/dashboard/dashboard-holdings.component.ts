import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Holding, TradeMode } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';

@Component({
  selector: 'app-dashboard-holdings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-holdings.component.html'
})
export class DashboardHoldingsComponent {
  @Input() holdings: Holding[] = [];
  @Output() quickTrade = new EventEmitter<{ instrumentId: number; mode: TradeMode }>();

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;
}

