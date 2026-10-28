import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterRenderEffect, computed, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { BaselineSeries, IChartApi, IPriceLine, ISeriesApi, LineStyle, LogicalRange, MouseEventParams, Time, createChart } from 'lightweight-charts';
import { ChartPoint, ChartTimeframe } from './dashboard.models';
import { formatCurrency, formatDayRange, formatPercent } from './dashboard.utils';
import { ThemeService } from '../../services/theme.service';
import { animateRange, baseChartOptions, baselineColors, rangeFor, readChartPalette, visibleIndices } from './lw-chart-theme';
import { ChartSkeletonComponent } from './chart-skeleton.component';

const TIMEFRAME_LABELS: Record<ChartTimeframe, string> = {
  '1D': 'past day',
  '1W': 'past week',
  '1M': 'past month',
  '3M': 'past 3 months',
  '1Y': 'past year',
  ALL: 'all time',
};

// Portfolio value over time (TradingView Lightweight Charts): a baseline series that's green above the starting value
// of what's on screen and red below it, a dashed line at that starting value, crosshair readout on hover, drag to pan
// and scroll or pinch to zoom. Timeframe buttons glide the view; zooming makes the header describe what's on screen.
@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [CommonModule, ChartSkeletonComponent],
  templateUrl: './dashboard-chart.component.html',
  styles: [`
    .chart-container {
      position: relative;
    }

    .chart-canvas {
      position: absolute;
      inset: 0;
    }

    .chart-loading,
    .chart-empty {
      position: absolute;
      inset: 0;
      z-index: 2;
      background: var(--page-background);
    }

    .chart-empty {
      display: grid;
      place-items: center;
      color: var(--clr-sienna);
      font-size: .875rem;
    }

    .chart-legend {
      position: absolute;
      z-index: 3;
      top: 0;
      left: 0;
      display: grid;
      gap: .05rem;
      padding: .25rem .5rem;
      border-radius: var(--radius-sm);
      background: color-mix(in oklab, var(--clr-surface) 88%, transparent);
      pointer-events: none;
    }

    .chart-legend-date {
      font-size: .72rem;
      color: var(--clr-sienna);
    }

    .chart-legend-value {
      font-size: .95rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--clr-espresso);
    }

    .chart-heading {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: .5rem 1rem;
    }

    .chart-change {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -.02em;
      font-variant-numeric: tabular-nums;
      color: var(--clr-sienna);
    }

    .chart-change.gain-text {
      color: var(--clr-gain);
    }

    .chart-change.loss-text {
      color: var(--clr-loss);
    }

    .chart-change-period {
      font-size: .82rem;
      color: var(--clr-sienna);
    }

  `]
})
export class DashboardChartComponent {
  readonly dataPoints = input<ChartPoint[]>([]);
  readonly chartTimeframe = input<ChartTimeframe>('1M');
  readonly loading = input(false);
  readonly chartTimeframeChange = output<ChartTimeframe>();

  readonly timeframes: ChartTimeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;
  readonly legend = signal<{ date: string; value: number } | null>(null);

  private readonly host = viewChild<ElementRef<HTMLDivElement>>('host');
  private readonly theme = inject(ThemeService);

  // All history, oldest first, one point per day. The chart always holds all of it, so zooming out past the selected
  // timeframe keeps showing the line; the timeframe only decides what's in view.
  readonly points = computed<Array<{ day: string; value: number }>>(() => {
    const parsed = this.dataPoints()
      .map(p => ({ day: String(p.date).slice(0, 10), value: p.value }))
      .filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.day) && Number.isFinite(p.value))
      .sort((a, b) => a.day.localeCompare(b.day));
    return parsed.filter((p, i) => i === parsed.length - 1 || parsed[i + 1].day !== p.day);
  });

  // Indices of the first and last points inside the selected timeframe.
  readonly timeframeSpan = computed<{ first: number; last: number } | null>(() => {
    const points = this.points();
    if (!points.length) {
      return null;
    }
    const last = points.length - 1;
    if (this.chartTimeframe() === 'ALL') {
      return { first: 0, last };
    }
    const start = new Date(`${points[last].day}T12:00:00`);
    switch (this.chartTimeframe()) {
      case '1D': start.setDate(start.getDate() - 1); break;
      case '1W': start.setDate(start.getDate() - 6); break;
      case '1M': start.setMonth(start.getMonth() - 1); break;
      case '3M': start.setMonth(start.getMonth() - 3); break;
      case '1Y': start.setFullYear(start.getFullYear() - 1); break;
    }
    const startDay = start.toISOString().slice(0, 10);
    const first = points.findIndex(p => p.day >= startDay);
    return { first: first < 0 ? last : first, last };
  });

  // Points on screen right now; differs from the timeframe once the user zooms or drags.
  private readonly visible = signal<{ first: number; last: number } | null>(null);
  readonly zoomed = computed(() => {
    const v = this.visible();
    const tf = this.timeframeSpan();
    return !!v && !!tf && (v.first !== tf.first || v.last !== tf.last);
  });

  // The span the header describes: what's on screen when zoomed, otherwise the timeframe.
  private readonly span = computed(() => {
    const points = this.points();
    const s = (this.zoomed() ? this.visible() : null) ?? this.timeframeSpan();
    return s ? points.slice(s.first, s.last + 1) : [];
  });
  readonly changePercent = computed(() => {
    const span = this.span();
    const start = span[0]?.value ?? 0;
    const end = span[span.length - 1]?.value ?? 0;
    return span.length < 2 || start === 0 ? null : ((end - start) / Math.abs(start)) * 100;
  });
  readonly timeframeLabel = computed(() => {
    const span = this.span();
    return this.zoomed() && span.length >= 2 ? formatDayRange(span[0].day, span[span.length - 1].day) : TIMEFRAME_LABELS[this.chartTimeframe()];
  });

  private chart?: IChartApi;
  private series?: ISeriesApi<'Baseline'>;
  private startLine?: IPriceLine;
  private values = new Map<string, number>();
  private viewKey = '';
  private viewTimeframe?: ChartTimeframe; // the timeframe the current view was made for
  private gliding = false;
  // Set by the user's own wheel/drag/touch on the chart; until then the view is the selected timeframe, even if the
  // chart's size settles after it was drawn (e.g. while a panel is still sliding in).
  private userMoved = false;
  private stopGlide = () => {};

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stopGlide();
      this.chart?.remove();
    });
    afterRenderEffect(() => {
      const points = this.points();
      const span = this.timeframeSpan();
      this.theme.mode();
      untracked(() => this.render(points, span));
    });
  }

  selectTimeframe(tf: ChartTimeframe) {
    if (tf === this.chartTimeframe()) {
      this.resetZoom();
    } else {
      this.chartTimeframeChange.emit(tf);
    }
  }

  // Back to exactly the selected timeframe.
  resetZoom() {
    const span = this.timeframeSpan();
    if (this.chart && span) {
      this.glideTo(span);
    }
  }

  private render(points: Array<{ day: string; value: number }>, span: { first: number; last: number } | null) {
    const host = this.host()?.nativeElement;
    if (!host) {
      return;
    }
    const p = readChartPalette();
    const options = baseChartOptions(p);
    options.rightPriceScale = { ...options.rightPriceScale, scaleMargins: { top: 0.15, bottom: 0.05 } };
    if (!this.chart) {
      this.chart = createChart(host, options);
      this.series = this.chart.addSeries(BaselineSeries, { lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
      this.chart.subscribeCrosshairMove(param => this.onCrosshair(param));
      this.chart.timeScale().subscribeVisibleLogicalRangeChange(range => this.onVisibleRange(range));
      this.chart.timeScale().subscribeSizeChange(() => this.refitIfUntouched());
      for (const type of ['wheel', 'pointerdown', 'touchstart']) {
        host.addEventListener(type, () => this.userMoved = true, { passive: true });
      }
    } else {
      this.chart.applyOptions(options);
    }
    this.series!.applyOptions(baselineColors(p));
    this.series!.setData(points.map(pt => ({ time: pt.day as Time, value: pt.value })));
    this.values = new Map(points.map(pt => [pt.day, pt.value]));

    // A new timeframe (or new data) moves the view; a theme change or same-shaped refresh leaves the user's zoom alone.
    // Only picking a timeframe glides. New data snaps: the chart keeps the newest points in view when its data grows,
    // so a glide would start from a sliver of points at the right edge (full history arriving after a partial first
    // load looked like the line growing out of the right side).
    const key = span ? `${span.first}:${span.last}:${points.length}` : '';
    if (key !== this.viewKey && span) {
      const timeframe = this.chartTimeframe();
      const glide = !!this.viewKey && timeframe !== this.viewTimeframe;
      this.viewKey = key;
      this.viewTimeframe = timeframe;
      if (glide) {
        this.glideTo(span);
      } else {
        this.jumpTo(span);
      }
    }
    this.updateStart(this.visible()?.first ?? span?.first, p.muted);
  }

  private jumpTo(span: { first: number; last: number }) {
    this.stopGlide();
    this.gliding = false;
    this.userMoved = false;
    this.visible.set(null);
    this.chart!.timeScale().setVisibleLogicalRange(rangeFor(this.chart!, span.first, span.last));
  }

  private glideTo(span: { first: number; last: number }) {
    this.stopGlide();
    // Clear the old view so the header switches to the new timeframe straight away instead of reading as zoomed.
    this.visible.set(null);
    this.gliding = true;
    this.userMoved = false;
    this.stopGlide = animateRange(this.chart!, rangeFor(this.chart!, span.first, span.last), () => {
      this.gliding = false;
      this.onVisibleRange(this.chart!.timeScale().getVisibleLogicalRange());
    });
  }

  // The baseline (where the fill turns from green to red) and the dashed "Start" line follow the first point on
  // screen, so they always mean "where this view started". `color` is passed when the palette may have changed.
  private updateStart(first: number | undefined, color?: string) {
    const points = this.points();
    const price = first != null ? points[first]?.value : undefined;
    if (price == null || points.length < 2) {
      if (this.startLine) {
        this.series!.removePriceLine(this.startLine);
        this.startLine = undefined;
      }
      return;
    }
    this.series!.applyOptions({ baseValue: { type: 'price', price } });
    if (this.startLine) {
      this.startLine.applyOptions(color ? { price, color } : { price });
    } else {
      this.startLine = this.series!.createPriceLine({
        price, color: color ?? readChartPalette().muted, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'Start',
      });
    }
  }

  private onVisibleRange(range: LogicalRange | null) {
    const v = visibleIndices(range, this.points().length);
    const current = this.visible();
    if (v?.first === current?.first && v?.last === current?.last) {
      return;
    }
    // Mid-glide the view passes through in-between spans, and before the user touches the chart any difference is
    // just layout settling; only the user's own zoom counts.
    if (!this.gliding) {
      this.visible.set(this.userMoved ? v : null);
    }
    if (this.series) {
      this.updateStart(this.userMoved || this.gliding ? v?.first : this.timeframeSpan()?.first);
    }
  }

  private refitIfUntouched() {
    const span = this.timeframeSpan();
    if (this.chart && span && !this.userMoved && !this.gliding) {
      this.chart.timeScale().setVisibleLogicalRange(rangeFor(this.chart, span.first, span.last));
    }
  }

  private onCrosshair(param: MouseEventParams<Time>) {
    const value = param.time ? this.values.get(param.time as string) : undefined;
    if (!param.point || value == null) {
      this.legend.set(null);
      return;
    }
    const date = new Date(`${param.time as string}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    this.legend.set({ date, value });
  }
}
