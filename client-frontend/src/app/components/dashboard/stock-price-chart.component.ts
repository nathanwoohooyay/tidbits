import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterRenderEffect, computed, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import {
  BaselineSeries, CandlestickSeries, HistogramSeries, IChartApi, ISeriesApi, ISeriesMarkersPluginApi, LogicalRange,
  MouseEventParams, SeriesMarker, SeriesType, Time, createChart, createSeriesMarkers,
} from 'lightweight-charts';
import { PricingCandleDTO } from '../../services/pricing.service';
import { ThemeService } from '../../services/theme.service';
import { formatCompactNumber, formatCurrency, formatDayRange } from './dashboard.utils';
import { ChartPalette, animateRange, baseChartOptions, baselineColors, rangeFor, readChartPalette, visibleIndices, withAlpha } from './lw-chart-theme';

export type StockChartMode = 'line' | 'candles';

// A filled order on this stock, drawn as a marker on the day it happened.
export interface ChartTrade {
  date: string; // YYYY-MM-DD
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
}

interface Legend {
  date: string;
  synthetic: boolean;
  value?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  trades?: string;
}

// Daily price chart for one stock (TradingView Lightweight Charts): adjusted-close line (green above the range's
// starting price, red below) or OHLC candles, a volume histogram, and markers for the user's own trades. Drag to pan,
// scroll or pinch to zoom, crosshair readout on hover; changing range glides the view.
@Component({
  selector: 'app-stock-price-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stock-chart">
      <div #host class="stock-chart-canvas" role="img"
           [attr.aria-label]="'Price chart with ' + validCandles().length + ' trading days. Drag to pan, scroll to zoom.'"></div>
      @if (legend(); as l) {
        <div class="stock-chart-legend" aria-hidden="true">
          <span class="legend-date">{{ l.date }}{{ l.synthetic ? ' · gap-filled' : '' }}</span>
          @if (mode() === 'line') {
            <span class="legend-value">{{ formatCurrency(l.value ?? 0) }}</span>
          } @else {
            <span class="legend-ohlc">
              O <b>{{ formatCurrency(l.open ?? 0) }}</b> H <b>{{ formatCurrency(l.high ?? 0) }}</b>
              L <b>{{ formatCurrency(l.low ?? 0) }}</b> C <b>{{ formatCurrency(l.close ?? 0) }}</b>
            </span>
          }
          @if (l.volume) {
            <span class="legend-date">Vol {{ formatCompactNumber(l.volume) }}</span>
          }
          @if (l.trades) {
            <span class="legend-trades">{{ l.trades }}</span>
          }
        </div>
      }
    </div>
    @if (hasSynthetic() || trades().length) {
      <p class="stock-chart-note">
        @if (trades().length) {
          <span><b class="gain">●</b> your buys · <b class="loss">●</b> your sells (hover a dot for details).</span>
        }
        @if (hasSynthetic()) {
          <span>Faded points are gap-filled data, not real trades.</span>
        }
      </p>
    }
  `,
  styles: [`
    .stock-chart {
      position: relative;
      height: 240px;
    }

    .stock-chart-canvas {
      position: absolute;
      inset: 0;
    }

    .stock-chart-legend {
      position: absolute;
      z-index: 3;
      top: 0;
      left: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: .1rem .5rem;
      padding: .2rem .5rem;
      border-radius: 6px;
      background: color-mix(in oklab, var(--clr-surface) 88%, transparent);
      pointer-events: none;
      font-variant-numeric: tabular-nums;
    }

    .legend-date {
      font-size: .7rem;
      color: var(--clr-sienna);
    }

    .legend-value {
      font-size: .9rem;
      font-weight: 700;
      color: var(--clr-espresso);
    }

    .legend-ohlc {
      font-size: .74rem;
      color: var(--clr-sienna);
    }

    .legend-ohlc b {
      color: var(--clr-espresso);
      font-weight: 600;
      margin-right: .2rem;
    }

    .legend-trades {
      font-size: .74rem;
      font-weight: 600;
      color: var(--clr-espresso);
    }

    .stock-chart-note {
      display: flex;
      flex-wrap: wrap;
      gap: .2rem .75rem;
      margin-top: .5rem;
      font-size: .7rem;
      color: var(--clr-sienna);
    }

    .gain { color: var(--clr-gain); }
    .loss { color: var(--clr-loss); }
  `]
})
export class StockPriceChartComponent {
  readonly candles = input<PricingCandleDTO[]>([]);
  readonly mode = input<StockChartMode>('line');
  readonly trades = input<ChartTrade[]>([]);
  // First day of the selected range (YYYY-MM-DD). The chart holds all the candles it's given, so zooming out past the
  // range keeps showing history; the range only decides what's in view.
  readonly viewFrom = input('');
  // Return over the part on screen after zooming or panning; null when exactly the selected range is showing.
  readonly visibleChange = output<{ change: number; label: string } | null>();

  readonly formatCurrency = formatCurrency;
  readonly formatCompactNumber = formatCompactNumber;
  readonly legend = signal<Legend | null>(null);

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly theme = inject(ThemeService);

  readonly validCandles = computed(() => this.candles().filter(c => c.close != null && !!c.date));
  readonly hasSynthetic = computed(() => this.validCandles().some(c => c.synthetic));
  // Indices of the first and last candles in the selected range.
  private readonly viewSpan = computed(() => {
    const candles = this.validCandles();
    if (!candles.length) {
      return null;
    }
    const first = candles.findIndex(c => c.date >= this.viewFrom());
    return { first: first < 0 ? 0 : first, last: candles.length - 1 };
  });

  private chart?: IChartApi;
  private main?: ISeriesApi<SeriesType>;
  private mainMode?: StockChartMode;
  private volume?: ISeriesApi<'Histogram'>;
  private markers?: ISeriesMarkersPluginApi<Time>;
  private byDate = new Map<string, PricingCandleDTO>();
  private tradesByDate = new Map<string, string>();
  private viewKey = '';
  private visibleKey = '';
  private gliding = false;
  // Set by the user's own wheel/drag/touch on the chart; until then the view is the selected range, even if the
  // chart's size settles after it was drawn (the trade window is still opening when it first renders).
  private userMoved = false;
  private stopGlide = () => {};

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stopGlide();
      this.chart?.remove();
    });
    afterRenderEffect(() => {
      const candles = this.validCandles();
      const mode = this.mode();
      const trades = this.trades();
      const span = this.viewSpan();
      this.theme.mode(); // redraw with the new palette when light/dark changes
      untracked(() => this.render(candles, mode, trades, span));
    });
  }

  // Back to exactly the selected range.
  resetZoom() {
    const span = this.viewSpan();
    if (this.chart && span) {
      this.glideTo(span);
    }
  }

  private render(candles: PricingCandleDTO[], mode: StockChartMode, trades: ChartTrade[], span: { first: number; last: number } | null) {
    const palette = readChartPalette();
    if (!this.chart) {
      this.chart = createChart(this.host().nativeElement, baseChartOptions(palette));
      this.chart.subscribeCrosshairMove(param => this.onCrosshair(param));
      this.chart.timeScale().subscribeVisibleLogicalRangeChange(range => this.onVisibleRange(range));
      this.chart.timeScale().subscribeSizeChange(() => this.refitIfUntouched());
      for (const type of ['wheel', 'pointerdown', 'touchstart']) {
        this.host().nativeElement.addEventListener(type, () => this.userMoved = true, { passive: true });
      }
      this.volume = this.chart.addSeries(HistogramSeries, {
        priceScaleId: 'volume',
        priceFormat: { type: 'volume' },
        lastValueVisible: false,
        priceLineVisible: false,
      });
      this.chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    } else {
      this.chart.applyOptions(baseChartOptions(palette));
    }

    if (!this.main || this.mainMode !== mode) {
      if (this.main) {
        this.markers?.detach();
        this.chart.removeSeries(this.main);
      }
      this.main = mode === 'line'
        ? this.chart.addSeries(BaselineSeries, { lineWidth: 2, priceLineVisible: false, lastValueVisible: true })
        : this.chart.addSeries(CandlestickSeries, { priceLineVisible: false, borderVisible: false });
      this.markers = createSeriesMarkers(this.main, []);
      this.mainMode = mode;
    }

    this.byDate = new Map(candles.map(c => [c.date, c]));
    this.setData(candles, mode, palette);
    this.markers?.setMarkers(this.toMarkers(candles, trades, palette));

    // A new range, new data or a line/candles switch moves the view; a theme change leaves the user's zoom alone.
    const key = span ? `${mode}:${span.first}:${span.last}:${candles.length}` : '';
    if (key !== this.viewKey && span) {
      const firstView = !this.viewKey;
      this.viewKey = key;
      if (firstView) {
        this.chart.timeScale().setVisibleLogicalRange(rangeFor(this.chart, span.first, span.last, mode === 'candles'));
      } else {
        this.glideTo(span);
      }
    }
    this.updateBaseline(this.userMoved
      ? visibleIndices(this.chart.timeScale().getVisibleLogicalRange(), candles.length)?.first
      : span?.first);
  }

  private glideTo(span: { first: number; last: number }) {
    this.stopGlide();
    this.gliding = true;
    this.userMoved = false;
    this.emitVisible(null);
    this.stopGlide = animateRange(this.chart!, rangeFor(this.chart!, span.first, span.last, this.mode() === 'candles'), () => {
      this.gliding = false;
      this.onVisibleRange(this.chart!.timeScale().getVisibleLogicalRange());
    });
  }

  private setData(candles: PricingCandleDTO[], mode: StockChartMode, p: ChartPalette) {
    if (mode === 'line') {
      const line = this.main as ISeriesApi<'Baseline'>;
      line.applyOptions(baselineColors(p));
      // Gap-filled points are drawn faded on whichever side of the baseline they fall.
      const faded = baselineColors(p, 0.35);
      line.setData(candles.map(c => ({
        time: c.date as Time,
        value: c.adjclose ?? c.close!,
        ...(c.synthetic ? { topLineColor: faded.topLineColor, bottomLineColor: faded.bottomLineColor } : {}),
      })));
    } else {
      (this.main as ISeriesApi<'Candlestick'>).applyOptions({
        upColor: p.gain, downColor: p.loss, wickUpColor: p.gain, wickDownColor: p.loss,
      });
      (this.main as ISeriesApi<'Candlestick'>).setData(candles.map(c => {
        const open = c.open ?? c.close!;
        const close = c.close!;
        const color = close >= open ? p.gain : p.loss;
        return {
          time: c.date as Time,
          open,
          high: c.high ?? Math.max(open, close),
          low: c.low ?? Math.min(open, close),
          close,
          ...(c.synthetic ? { color: withAlpha(color, 0.35), wickColor: withAlpha(color, 0.35) } : {}),
        };
      }));
    }

    this.volume?.setData(candles.filter(c => c.volume != null).map(c => ({
      time: c.date as Time,
      value: c.volume!,
      color: withAlpha((c.close ?? 0) >= (c.open ?? c.close ?? 0) ? p.gain : p.loss, c.synthetic ? 0.12 : 0.3),
    })));
  }

  // In line mode the fill turns from green to red at the first price on screen, so it always means "since the start
  // of this view".
  private updateBaseline(first: number | undefined) {
    const candle = first != null ? this.validCandles()[first] : undefined;
    if (this.mainMode === 'line' && candle) {
      (this.main as ISeriesApi<'Baseline'>).applyOptions({ baseValue: { type: 'price', price: candle.adjclose ?? candle.close ?? 0 } });
    }
  }

  // Tells the trade window when the view differs from the selected range, so its header can describe what's on screen.
  private onVisibleRange(range: LogicalRange | null) {
    const candles = this.validCandles();
    const v = visibleIndices(range, candles.length);
    this.updateBaseline(this.userMoved || this.gliding ? v?.first : this.viewSpan()?.first);
    if (this.gliding) {
      return;
    }
    const span = this.viewSpan();
    if (!this.userMoved || !v || !span || (v.first === span.first && v.last === span.last) || v.last - v.first < 1) {
      this.emitVisible(null);
      return;
    }
    const value = (c: PricingCandleDTO) => c.adjclose ?? c.close ?? 0;
    const first = candles[v.first];
    const last = candles[v.last];
    this.emitVisible({
      change: value(first) ? ((value(last) - value(first)) / value(first)) * 100 : 0,
      label: formatDayRange(first.date, last.date),
    }, `${v.first}:${v.last}`);
  }

  private refitIfUntouched() {
    const span = this.viewSpan();
    if (this.chart && span && !this.userMoved && !this.gliding) {
      this.chart.timeScale().setVisibleLogicalRange(rangeFor(this.chart, span.first, span.last, this.mode() === 'candles'));
    }
  }

  private emitVisible(info: { change: number; label: string } | null, key = '') {
    if (key !== this.visibleKey) {
      this.visibleKey = key;
      this.visibleChange.emit(info);
    }
  }

  // A small dot on the line for each trading day with a buy or sell; trades on non-trading days land on the next
  // trading day shown. The details ("Bought 40 · Sold 15") show in the hover legend instead of as text on the chart.
  private toMarkers(candles: PricingCandleDTO[], trades: ChartTrade[], p: ChartPalette): SeriesMarker<Time>[] {
    this.tradesByDate = new Map();
    if (!candles.length || !trades.length) {
      return [];
    }
    const dates = candles.map(c => c.date);
    const grouped = new Map<string, { side: 'BUY' | 'SELL'; quantity: number; date: string }>();
    for (const trade of trades) {
      const day = dates.find(d => d >= trade.date);
      if (!day || trade.date < dates[0]) {
        continue;
      }
      const key = `${day}:${trade.side}`;
      const existing = grouped.get(key);
      grouped.set(key, { side: trade.side, date: day, quantity: (existing?.quantity ?? 0) + trade.quantity });
    }
    const sorted = [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date) || a.side.localeCompare(b.side));
    for (const t of sorted) {
      const text = `${t.side === 'BUY' ? 'Bought' : 'Sold'} ${t.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
      const existing = this.tradesByDate.get(t.date);
      this.tradesByDate.set(t.date, existing ? `${existing} · ${text}` : text);
    }
    return sorted.map(t => ({
      time: t.date as Time,
      position: 'inBar',
      shape: 'circle',
      color: t.side === 'BUY' ? p.gain : p.loss,
      size: 0.6,
    }));
  }

  private onCrosshair(param: MouseEventParams<Time>) {
    if (!param.time || !param.point || !this.main) {
      this.legend.set(null);
      return;
    }
    const candle = this.byDate.get(param.time as string);
    if (!candle) {
      this.legend.set(null);
      return;
    }
    const date = new Date(`${candle.date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    this.legend.set({
      date,
      synthetic: candle.synthetic,
      value: candle.adjclose ?? candle.close ?? undefined,
      open: candle.open ?? undefined,
      high: candle.high ?? undefined,
      low: candle.low ?? undefined,
      close: candle.close ?? undefined,
      volume: candle.volume ?? undefined,
      trades: this.tradesByDate.get(candle.date),
    });
  }
}
