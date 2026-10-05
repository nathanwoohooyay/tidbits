import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChartDataMap, ChartSeries, ChartTimeframe } from './dashboard.models';
import { formatCurrency } from './dashboard.utils';

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-chart.component.html',
  styles: [`
    .chart-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      display: block;
    }

    .chart-label-row {
      display: flex;
      justify-content: space-between;
      gap: .5rem;
      margin-top: .75rem;
      color: var(--clr-sienna);
      font-size: .72rem;
      overflow-x: auto;
    }

    .chart-label-row span {
      white-space: nowrap;
    }
  `]
})
export class DashboardChartComponent {
  @Input() dataByTimeframe!: ChartDataMap;
  @Input() chartTimeframe: ChartTimeframe = '1M';
  @Output() chartTimeframeChange = new EventEmitter<ChartTimeframe>();

  readonly timeframes: ChartTimeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  readonly formatCurrency = formatCurrency;

  get currentData(): ChartSeries {
    return this.dataByTimeframe?.[this.chartTimeframe] ?? { labels: [], values: [] };
  }

  get startValue(): number {
    return this.currentData.values[0] ?? 0;
  }

  get endValue(): number {
    return this.currentData.values[this.currentData.values.length - 1] ?? 0;
  }

  get lineColor(): string {
    return this.endValue >= this.startValue ? 'var(--clr-gain)' : 'var(--clr-loss)';
  }

  linePoints(): string {
    const values = this.currentData.values;
    if (values.length === 0) {
      return '';
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values
      .map((value, index) => {
        const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
        const y = 36 - (((value - min) / range) * 28 + 4);
        return `${x},${y}`;
      })
      .join(' ');
  }

  fillPoints(): string {
    const line = this.linePoints();
    if (!line) {
      return '';
    }

    return `0,40 ${line} 100,40`;
  }

  sampledLabels(): string[] {
    const labels = this.currentData.labels;
    if (labels.length <= 4) {
      return labels;
    }

    const step = Math.max(1, Math.floor((labels.length - 1) / 3));
    const sampled = [labels[0], labels[step], labels[Math.min(step * 2, labels.length - 1)], labels[labels.length - 1]];
    return [...new Set(sampled)];
  }
}

