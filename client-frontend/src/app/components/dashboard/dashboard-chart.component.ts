import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChartPoint, ChartSeries, ChartTimeframe } from './dashboard.models';
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
  @Input() dataPoints: ChartPoint[] = [];
  @Input() dates: string[] = [];
  @Input() values: number[] = [];
  @Input() chartTimeframe: ChartTimeframe = '1M';
  @Output() chartTimeframeChange = new EventEmitter<ChartTimeframe>();

  readonly timeframes: ChartTimeframe[] = ['1W', '1M', '3M', '1Y', 'ALL'];
  readonly formatCurrency = formatCurrency;

  private yBounds(values: number[]): { min: number; max: number } {
    const finiteValues = values.filter(value => Number.isFinite(value));

    if (finiteValues.length === 0) {
      return { min: 0, max: 1 };
    }

    return {
      min: Math.min(...finiteValues),
      max: Math.max(...finiteValues),
    };
  }

  get currentData(): ChartSeries {
    const points = this.filteredPoints();
    if (points.length === 0) {
      return { labels: [], values: [] };
    }
    return {
      labels: points.map(point => this.labelForDay(new Date(point.date))),
      values: points.map(point => point.value),
    };
  }

  private filteredPoints(): ChartPoint[] {
    const parsed = this.inputPoints()
      .map(point => ({
        value: point.value,
        date: new Date(point.date),
      }))
      .filter(point => Number.isFinite(point.value) && !Number.isNaN(point.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (parsed.length === 0 || this.chartTimeframe === 'ALL') {
      return parsed.map(point => ({ date: point.date.toISOString(), value: point.value }));
    }

    const end = parsed[parsed.length - 1].date;
    const start = new Date(end);

    switch (this.chartTimeframe) {
      case '1W':
        start.setDate(start.getDate() - 6);
        break;
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return parsed
      .filter(point => point.date >= start && point.date <= end)
      .map(point => ({ date: point.date.toISOString(), value: point.value }));
  }

  private inputPoints(): ChartPoint[] {
    if (this.dataPoints.length > 0) {
      return this.dataPoints;
    }

    const pairCount = Math.min(this.dates.length, this.values.length);
    return Array.from({ length: pairCount }, (_, index) => ({
      date: this.dates[index],
      value: this.values[index],
    }));
  }

  private labelForDay(date: Date): string {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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

    const { min, max } = this.yBounds(values);
    const center = (min + max) / 2;
    const halfRange = Math.max((max - min) / 2, 1);

    return values
      .map((value, index) => {
        const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
        const y = 20 - ((value - center) / halfRange) * 14;
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

