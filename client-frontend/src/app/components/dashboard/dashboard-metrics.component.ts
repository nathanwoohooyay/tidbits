import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { formatCurrency, formatPercent } from './dashboard.utils';

@Component({
  selector: 'app-dashboard-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-metrics.component.html'
})
export class DashboardMetricsComponent {
  @Input() totalNetWorth = 0;
  @Input() cashBalance = 0;
  @Input() portfolioValue = 0;
  @Input() portfolioGainLoss = 0;

  readonly Math = Math;
  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;

  portfolioGainPercent(): number {
    const costBasis = this.portfolioValue - this.portfolioGainLoss;
    return costBasis > 0 ? (this.portfolioGainLoss / costBasis) * 100 : 0;
  }
}

