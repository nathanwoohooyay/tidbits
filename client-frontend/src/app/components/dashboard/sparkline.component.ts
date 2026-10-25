import { Component, computed, inject, input } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { PortfolioQueries } from '../../services/portfolio-queries';
import { TrendLineComponent } from './trend-line.component';

// One-month trend line for a ticker. Shares the trade window's cached 1M candles.
@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [TrendLineComponent],
  template: `
    @if (closes().length > 1) {
      <app-trend-line [values]="closes()" [label]="ticker() + ' past month'"></app-trend-line>
    } @else if (loading()) {
      <span class="skeleton"></span>
    }
  `,
  styles: [`
    :host { display: block; width: 4.5rem; height: 1.6rem; }
    app-trend-line { width: 100%; height: 100%; }
    .skeleton { height: 100%; }
  `]
})
export class SparklineComponent {
  readonly ticker = input.required<string>();

  private readonly queries = inject(PortfolioQueries);
  private readonly candlesQuery = injectQuery(() => ({
    ...this.queries.candles(this.ticker(), '1M'),
    retry: false,
  }));

  readonly loading = computed(() => this.candlesQuery.isPending());

  readonly closes = computed(() => (this.candlesQuery.data()?.candles ?? [])
    .map(c => c.adjclose ?? c.close)
    .filter((v): v is number => v != null));
}
