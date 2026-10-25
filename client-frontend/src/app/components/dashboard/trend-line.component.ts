import { Component, computed, input } from '@angular/core';

// Small up/down line for a series of values, coloured by whether the last value beats the first.
@Component({
  selector: 'app-trend-line',
  standalone: true,
  template: `
    @if (points(); as p) {
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" role="img" [attr.aria-label]="label() + ' ' + (rising() ? 'up' : 'down')">
        <polyline [attr.points]="p" [style.stroke]="rising() ? 'var(--clr-gain)' : 'var(--clr-loss)'" />
      </svg>
    }
  `,
  styles: [`
    :host { display: block; width: 4.5rem; height: 1.6rem; }
    svg { width: 100%; height: 100%; display: block; overflow: visible; }
    polyline { fill: none; stroke-width: 1.6; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
  `]
})
export class TrendLineComponent {
  readonly values = input<number[]>([]);
  readonly label = input('Trend');

  readonly rising = computed(() => {
    const v = this.values();
    return v.length < 2 || v[v.length - 1] >= v[0];
  });

  readonly points = computed(() => {
    const v = this.values();
    if (v.length < 2) {
      return null;
    }
    const min = Math.min(...v);
    const range = Math.max(...v) - min || 1;
    return v.map((value, i) => `${(i / (v.length - 1)) * 100},${28 - ((value - min) / range) * 26}`).join(' ');
  });
}
