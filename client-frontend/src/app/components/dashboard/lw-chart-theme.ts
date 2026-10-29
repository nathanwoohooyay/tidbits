import { BaselineStyleOptions, ColorType, CrosshairMode, DeepPartial, ChartOptions, IChartApi, LineStyle, LogicalRange } from 'lightweight-charts';
import { pricePrecision } from './dashboard.utils';

// Colours for Lightweight Charts, read from the app's CSS variables so charts follow light/dark mode.
export interface ChartPalette {
  text: string;
  muted: string;
  grid: string;
  border: string;
  gain: string;
  loss: string;
  surface: string;
  font: string;
}

export function readChartPalette(): ChartPalette {
  const style = getComputedStyle(document.body);
  const v = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    text: v('--clr-text', '#1E293B'),
    muted: v('--clr-sienna', '#526075'),
    grid: v('--clr-border', '#CBD5E1'),
    border: v('--clr-border-mid', '#A6B3C4'),
    gain: v('--clr-gain', '#007F4B'),
    loss: v('--clr-loss', '#BA0B2F'),
    surface: v('--clr-surface', '#FBFCFD'),
    font: v('--font-body', 'Public Sans, sans-serif'),
  };
}

// Hex colour with an alpha channel ('#007F4B', .3) -> 'rgba(0, 127, 75, 0.3)'.
export function withAlpha(hex: string, alpha: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) {
    return hex;
  }
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}

// Axis and crosshair prices: '$111,000' for big values, '$217.07' for share prices, '$0.0775' for coins under a dollar.
export function formatAxisPrice(price: number): string {
  const digits = Math.abs(price) >= 1000 ? 0 : pricePrecision(price);
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits });
}

const EDGE_PADDING_PX = 14;
const PAN_MS = 420;

const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The logical range that shows data points first..last edge to edge. A logical range counts each end as a whole
// bar, so both ends are pulled in by half a bar to put the first and last points on the edges, then let out by a few
// pixels so their date labels aren't clipped. Candles keep the half bar so the end candles aren't cut in half.
export function rangeFor(chart: IChartApi, first: number, last: number, keepHalfBar = false): LogicalRange {
  if (last <= first) {
    return { from: first - 0.5, to: last + 0.5 } as LogicalRange;
  }
  if (keepHalfBar) {
    return { from: first, to: last } as LogicalRange;
  }
  const width = chart.timeScale().width();
  const pad = width > 0 ? (EDGE_PADDING_PX * (last - first)) / Math.max(width - 2 * EDGE_PADDING_PX, 1) : 0;
  // The right edge lock allows at most half a bar of space after the last point; asking for more on a narrow chart
  // makes the chart shift the whole view left and drop the first point.
  return { from: first + 0.5 - pad, to: last - 0.5 + Math.min(pad, 0.5) } as LogicalRange;
}

// Glides the view from wherever it is to `target` (e.g. 1W -> 3M zooms out smoothly), then calls `onDone`. Jumps
// straight there when nothing is on screen yet or the user prefers reduced motion. Returns a function that stops it.
export function animateRange(chart: IChartApi, target: LogicalRange, onDone: () => void = () => {}): () => void {
  const scale = chart.timeScale();
  const start = scale.getVisibleLogicalRange();
  if (!start || prefersReducedMotion()) {
    scale.setVisibleLogicalRange(target);
    onDone();
    return () => {};
  }
  const t0 = performance.now();
  let frame = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / PAN_MS);
    const e = 1 - Math.pow(1 - t, 3);
    scale.setVisibleLogicalRange({ from: start.from + (target.from - start.from) * e, to: start.to + (target.to - start.to) * e });
    if (t < 1) {
      frame = requestAnimationFrame(step);
    } else {
      onDone();
    }
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

// The first and last data points actually on screen for a visible logical range. Point i is on screen once the
// range's left edge (from - 0.5) has passed it.
export function visibleIndices(range: LogicalRange | null, count: number): { first: number; last: number } | null {
  if (!range || count < 1) {
    return null;
  }
  const first = Math.min(count - 1, Math.max(0, Math.ceil(range.from - 0.5)));
  const last = Math.max(first, Math.min(count - 1, Math.floor(range.to + 0.5)));
  return { first, last };
}

// Line and fill colours for a baseline series: green above the period's starting value, red below it.
export function baselineColors(p: ChartPalette, fade = 1): DeepPartial<BaselineStyleOptions> {
  return {
    topLineColor: withAlpha(p.gain, fade),
    topFillColor1: withAlpha(p.gain, 0.26 * fade),
    topFillColor2: withAlpha(p.gain, 0.02),
    bottomLineColor: withAlpha(p.loss, fade),
    bottomFillColor1: withAlpha(p.loss, 0.02),
    bottomFillColor2: withAlpha(p.loss, 0.26 * fade),
  };
}

// Shared look: transparent background, recessive grid and axes, crosshair, drag to pan and scroll/pinch to zoom.
export function baseChartOptions(p: ChartPalette): DeepPartial<ChartOptions> {
  return {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: p.muted,
      fontFamily: p.font,
      fontSize: 11,
      // The logo overlaps the plot; the licence's TradingView attribution is on the Settings page instead.
      attributionLogo: false,
    },
    localization: { priceFormatter: formatAxisPrice },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: withAlpha(p.grid, 0.55), style: LineStyle.Dotted },
    },
    rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
    // The chart's own edge locks stop a drag or zoom at the first and last points smoothly (correcting the view
    // afterwards made it jitter while dragging). They still allow the slight inset rangeFor uses.
    timeScale: { borderVisible: false, lockVisibleTimeRangeOnResize: true, fixLeftEdge: true, fixRightEdge: true },
    crosshair: {
      mode: CrosshairMode.Magnet,
      vertLine: { color: p.border, width: 1, style: LineStyle.Solid, labelBackgroundColor: p.text },
      horzLine: { color: p.border, width: 1, style: LineStyle.Dashed, labelBackgroundColor: p.text },
    },
    handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: false },
  };
}
