import { AfterViewInit, Component, DestroyRef, ElementRef, NgZone, inject, viewChild } from '@angular/core';
import { BrandLogoComponent } from './brand-logo.component';

// Illustrative live candlestick ticker (random data, not a real market) along the bottom of the sign-in screens.
const STEP = 22;            // px between candle centres
const BODY = 12;            // px candle body width
const PERIOD_MS = 600;     // each candle trades live for one period, then the chart slides left one STEP
const RIGHT_GAP = 96;       // px kept clear between the live candle and the right edge
const LEFT_FADE_PX = 90;    // candles fade out over this many px as they leave on the left
const MIN_RANGE = 0.05;     // the price scale always spans at least 5% of the price, so a flat stretch isn't magnified
const WAYPOINTS = 7;        // turning points the live price passes through on its way from open to close
const UP = '#3FAE77';
const DOWN = '#D8607A';
const ALPHA = 0.55;
const LIVE_ALPHA = 0.9;     // the candle that's trading right now stands out a little from the settled ones
const TOP_PAD = 0.08;       // share of the band left empty above the highest high
const BOTTOM_PAD = 0.1;     // and below the lowest low

// `path` is the price's planned route through the period, open first and close last.
interface Candle { open: number; high: number; low: number; close: number; path: number[] }

// Gaussian-ish noise from three uniforms; good enough for a backdrop.
const noise = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

// A slowly rising, wandering level the price is pulled back towards, so the chart swings up and down around a gentle
// uptrend instead of marching off diagonally.
let anchor = 100;

// Next candle from the previous close: pulled towards the anchor plus volatility, with a wavy route between open and
// close so the live price rises and dips on the way. Its high and low are wherever that route peaks and bottoms.
function nextCandle(prevClose: number): Candle {
  anchor *= 1 + 0.0006 + noise() * 0.006;
  const close = prevClose * (1 + (anchor - prevClose) / prevClose * 0.08 + noise() * 0.02);
  const swing = prevClose * 0.008;
  const path = [prevClose];
  for (let k = 1; k < WAYPOINTS - 1; k++) {
    path.push(prevClose + (close - prevClose) * (k / (WAYPOINTS - 1)) + noise() * swing);
  }
  path.push(close);
  let high = Math.max(prevClose, close);
  let low = Math.min(prevClose, close);
  for (let t = 0; t <= 1; t += 0.02) {
    const v = priceAt(path, t);
    high = Math.max(high, v);
    low = Math.min(low, v);
  }
  return { open: prevClose, close, high, low, path };
}

// Price along a candle's route at t (0..1): a Catmull-Rom curve through the waypoints, so it moves smoothly with no
// stop-start at each turning point.
function priceAt(path: number[], t: number): number {
  const x = Math.min(Math.max(t, 0), 1) * (path.length - 1);
  const i = Math.min(Math.floor(x), path.length - 2);
  const f = x - i;
  const p0 = path[Math.max(i - 1, 0)];
  const p1 = path[i];
  const p2 = path[i + 1];
  const p3 = path[Math.min(i + 2, path.length - 1)];
  return 0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f);
}

// A candle that has only just opened: everything at the open until the live price starts moving.
function openCandle(prevClose: number): Candle {
  const c = nextCandle(prevClose);
  return { ...c, high: c.open, low: c.open, close: c.open };
}

// Sign-in / sign-up background: logo and headline, with a candlestick chart ticking along the bottom of the screen.
@Component({
  selector: 'app-auth-brand-panel',
  standalone: true,
  imports: [BrandLogoComponent],
  template: `
    <div class="auth-brand-logo">
      <app-brand-logo [size]="34"></app-brand-logo>
      <span class="auth-wordmark">BitTrader</span>
    </div>

    <h2 class="auth-brand-headline">Grow your wealth,<br>bit by bit.</h2>

    <canvas #ticker class="auth-curve" aria-hidden="true"></canvas>
  `,
})
export class AuthBrandPanelComponent implements AfterViewInit {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('ticker');
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private candles: Candle[] = [];
  private width = 0;
  private height = 0;
  private lo = 0;
  private hi = 0;
  // Null until the chart is first laid out (and while the canvas has no width); then the x the newest settled candle
  // sits at, with the live candle opening one step to its right and sliding into that spot over the period.
  private panX: number | null = null;

  ngAfterViewInit() {
    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const widthChanged = rect.width !== this.width;
      this.width = rect.width;
      this.height = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!this.candles.length) {
        this.layout();
      } else if (widthChanged) {
        // Re-anchor to the new right edge rather than rebuilding: mobile browsers fire resize as the URL bar
        // slides, and restarting the walk each time would make the chart stutter.
        this.panX = this.width - RIGHT_GAP;
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    // Animates even when the OS asks for reduced motion (Windows turns that on when "Show animations" is off, which is
    // common on Windows Server and over Remote Desktop): it's a slow, low-contrast backdrop, and the ticking chart is
    // the point of it. Runs outside Angular so 60 frames a second don't trigger change detection.
    let frame = 0;
    let periodStart = performance.now();
    this.zone.runOutsideAngular(() => {
      const tick = (now: number) => {
        let progress = (now - periodStart) / PERIOD_MS;
        if (progress >= 1) {
          this.closeLiveCandle();
          periodStart = progress > 2 ? now : periodStart + PERIOD_MS; // after a background tab, just carry on
          progress = (now - periodStart) / PERIOD_MS;
        }
        this.draw(ctx, progress);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    });
  }

  // Build a chart that already fills the canvas: a fresh random walk of candles ending one step short of the right
  // edge, where the live candle opens. The startup fill is invisible to the viewer, so the panel never shows an empty
  // chart growing from the left, and every period from the first one pans.
  private layout() {
    if (!this.width) {
      return;
    }
    anchor = 100;
    const panX = this.width - RIGHT_GAP;
    // One more than fills the span, so the leftmost candle sits at or just past the edge and there's no bare gap.
    const settled = Math.ceil(panX / STEP) + 1;
    this.candles = [];
    let close = 100;
    for (let i = 0; i < settled; i++) {
      const c = nextCandle(close);
      this.candles.push(c);
      close = c.close;
    }
    this.candles.push(openCandle(close));

    // A random walk's range depends on the path it took, so give the first frame at least MIN_RANGE of headroom;
    // after that the scale eases to whatever the visible candles actually span.
    let lo = Math.min(...this.candles.map(c => c.low));
    let hi = Math.max(...this.candles.map(c => c.high));
    const mid = (lo + hi) / 2;
    if (hi - lo < mid * MIN_RANGE) {
      lo = mid * (1 - MIN_RANGE / 2);
      hi = mid * (1 + MIN_RANGE / 2);
    }
    this.lo = lo;
    this.hi = hi;

    this.panX = panX;
  }

  // The live candle is done: lock in its close and open the next one at the right edge, sliding everything left.
  private closeLiveCandle() {
    const last = this.candles[this.candles.length - 1];
    last.close = last.path[last.path.length - 1];
    this.candles.push(openCandle(last.close));
    if (this.panX === null) {
      this.panX = this.width - RIGHT_GAP;
    }
    // Drop candles once they have slid far enough left to be fully faded out.
    const onScreen = Math.ceil((this.panX + STEP + LEFT_FADE_PX) / STEP) + 1;
    if (this.candles.length > onScreen) {
      this.candles.splice(0, this.candles.length - onScreen);
    }
  }

  private xOf(i: number, progress: number): number {
    const n = this.candles.length;
    // The live candle opens one step right of panX and slides into it over the period, with the rest in tow.
    return (this.panX ?? this.width - RIGHT_GAP) + STEP - progress * STEP - (n - 1 - i) * STEP;
  }

  // `progress` (0..1) is how far through the current period we are: it moves the live candle's price along its
  // route, stretching the wicks whenever it sets a new high or low, and slides the chart left one step.
  private draw(ctx: CanvasRenderingContext2D, progress: number) {
    const { width, height, candles } = this;
    if (!width || !height) {
      return;
    }
    const n = candles.length;
    const newest = candles[n - 1];
    const live = priceAt(newest.path, progress);
    newest.close = live;
    newest.high = Math.max(newest.high, live);
    newest.low = Math.min(newest.low, live);

    // Ease the price scale towards what's on screen so the chart never jumps when an extreme scrolls off.
    let lo = Math.min(...candles.map(c => c.low));
    let hi = Math.max(...candles.map(c => c.high));
    const mid = (lo + hi) / 2;
    if (hi - lo < mid * MIN_RANGE) {
      lo = mid * (1 - MIN_RANGE / 2);
      hi = mid * (1 + MIN_RANGE / 2);
    }
    this.lo += (lo - this.lo) * 0.05;
    this.hi += (hi - this.hi) * 0.05;
    const range = Math.max(this.hi - this.lo, 1e-6);
    const y = (v: number) => height * TOP_PAD + (1 - (v - this.lo) / range) * height * (1 - TOP_PAD - BOTTOM_PAD);

    // Candles fade as they near the left edge, so they leave the frame gradually rather than being cut off.
    const edge = (x: number) => Math.min(1, Math.max(0, x / LEFT_FADE_PX));

    ctx.clearRect(0, 0, width, height);

    // Faint dashed line from the left edge to the right at the live price, like a last-price line.
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = live >= newest.open ? UP : DOWN;
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, Math.round(y(live)) + 0.5);
    ctx.lineTo(width, Math.round(y(live)) + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < n; i++) {
      const c = candles[i];
      const x = this.xOf(i, progress);
      if (x < -STEP || x > width + STEP) {
        continue;
      }
      ctx.globalAlpha = (i === n - 1 ? LIVE_ALPHA : ALPHA) * edge(x);
      ctx.fillStyle = c.close >= c.open ? UP : DOWN;
      ctx.fillRect(Math.round(x) - 0.5, y(c.high), 1, Math.max(1, y(c.low) - y(c.high)));
      const top = y(Math.max(c.open, c.close));
      const bodyHeight = Math.max(1.5, y(Math.min(c.open, c.close)) - top);
      ctx.beginPath();
      ctx.roundRect(Math.round(x - BODY / 2), top, BODY, bodyHeight, 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
