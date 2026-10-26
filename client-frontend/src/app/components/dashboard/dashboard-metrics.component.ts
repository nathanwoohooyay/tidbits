import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatCurrency, formatPercent } from './dashboard.utils';
import { RollingNumberComponent } from '../rolling-number.component';

@Component({
  selector: 'app-dashboard-metrics',
  standalone: true,
  imports: [CommonModule, RollingNumberComponent],
  templateUrl: './dashboard-metrics.component.html'
})
export class DashboardMetricsComponent {
  @Input() totalNetWorth = 0;
  @Input() cashBalance = 0;
  @Input() portfolioValue = 0;
  @Input() accountName = '';
  @Input() portfolioGainLoss = 0;
  @Input() loading = false;
  @Input() dayChange = 0;
  @Input() dayChangePercent = 0;
  // Holdings couldn't be priced, so anything that includes them would be wrong; cash is still shown.
  @Input() unavailable = false;
  @Output() moveCash = new EventEmitter<void>();

  readonly Math = Math;
  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;

  portfolioGainPercent(): number {
    const costBasis = this.portfolioValue - this.portfolioGainLoss;
    return costBasis > 0 ? (this.portfolioGainLoss / costBasis) * 100 : 0;
  }
}

