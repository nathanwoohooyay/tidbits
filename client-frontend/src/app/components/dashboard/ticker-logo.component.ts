import { Component, computed, effect, input, signal } from '@angular/core';

// Public logo CDN keyed by ticker; class shares use '-' (BRK.B -> BRK-B). Unknown tickers 404 and fall back.
// It sends Access-Control-Allow-Origin: *, so images can be read back from a canvas and normalised.
const LOGO_URL = (ticker: string) => `https://financialmodelingprep.com/image-stock/${encodeURIComponent(ticker.replace('.', '-'))}.png`;

const OUTPUT_SIZE = 96;     // normalised logo is drawn into a square of this many px
const PADDING = 0.08;       // share of the square left empty on each side
const ALPHA_CUTOFF = 24;    // pixels fainter than this count as background
const WHITE_CUTOFF = 238;   // edge-connected pixels lighter than this on every channel count as background

// 'dark' / 'light' are near-monochrome logos that would vanish on a matching background; 'color' never needs help.
type LogoTone = 'dark' | 'light' | 'color';
interface NormalisedLogo { src: string; tone: LogoTone }

const cache = new Map<string, Promise<NormalisedLogo | null>>();

function normalise(ticker: string): Promise<NormalisedLogo | null> {
  let pending = cache.get(ticker);
  if (!pending) {
    pending = loadImage(LOGO_URL(ticker)).then(trimAndCentre).catch(() => null);
    cache.set(ticker, pending);
  }
  return pending;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Logos arrive with uneven padding (some sit high or to one side, some fill the frame, some are on a white square).
// Erase white backgrounds that touch the edges, crop to the visible artwork, then centre it with even padding.
function trimAndCentre(img: HTMLImageElement): NormalisedLogo | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) {
    return null;
  }
  const source = document.createElement('canvas');
  source.width = w;
  source.height = h;
  const ctx = source.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  const px = image.data;

  const isBackground = (i: number) =>
    px[i + 3] < ALPHA_CUTOFF || (px[i] > WHITE_CUTOFF && px[i + 1] > WHITE_CUTOFF && px[i + 2] > WHITE_CUTOFF);

  // Flood-fill from the border so only the outer white background is cleared, not white details inside the logo.
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop()!;
    if (visited[p]) continue;
    visited[p] = 1;
    if (!isBackground(p * 4)) continue;
    px[p * 4 + 3] = 0;
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }

  let minX = w, minY = h, maxX = -1, maxY = -1;
  let lumSum = 0, satSum = 0, count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (px[i + 3] < ALPHA_CUTOFF) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      lumSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      satSum += Math.max(r, g, b) - Math.min(r, g, b);
      count++;
    }
  }
  if (maxX < 0) {
    return null;
  }
  ctx.putImageData(image, 0, 0);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const inner = OUTPUT_SIZE * (1 - PADDING * 2);
  const scale = Math.min(inner / cropW, inner / cropH);
  const drawW = cropW * scale;
  const drawH = cropH * scale;

  const out = document.createElement('canvas');
  out.width = OUTPUT_SIZE;
  out.height = OUTPUT_SIZE;
  const outCtx = out.getContext('2d')!;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(source, minX, minY, cropW, cropH, (OUTPUT_SIZE - drawW) / 2, (OUTPUT_SIZE - drawH) / 2, drawW, drawH);

  const meanLum = lumSum / count;
  const meanSat = satSum / count;
  const tone: LogoTone = meanSat > 40 ? 'color' : meanLum < 90 ? 'dark' : meanLum > 200 ? 'light' : 'color';
  return { src: out.toDataURL('image/png'), tone };
}

// Company logo for a ticker, trimmed and centred, or a coloured initials badge when no logo is available.
@Component({
  selector: 'app-ticker-logo',
  standalone: true,
  template: `
    @if (logo(); as l) {
      <img [src]="l.src" alt="" [class]="'tone-' + l.tone" />
    } @else if (failed()) {
      <span class="initials" [style.background]="tint()">{{ initials() }}</span>
    }
  `,
  styles: [`
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      width: var(--logo-size, 2rem);
      height: var(--logo-size, 2rem);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    /* Keep monochrome logos visible: black marks turn light in dark mode, white marks turn dark in light mode. */
    :host-context(body.dark-mode) img.tone-dark,
    :host-context(body:not(.dark-mode)) img.tone-light {
      filter: invert(1);
    }

    .initials {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      color: #fff;
      font-size: calc(var(--logo-size, 2rem) * .34);
      font-weight: 700;
      letter-spacing: .02em;
    }
  `]
})
export class TickerLogoComponent {
  readonly ticker = input.required<string>();

  readonly logo = signal<NormalisedLogo | null>(null);
  readonly failed = signal(false);
  readonly initials = computed(() => this.ticker().replace(/[^A-Z]/gi, '').slice(0, 2).toUpperCase());

  // Stable muted hue per ticker, so the same stock always gets the same badge colour.
  readonly tint = computed(() => {
    let hash = 0;
    for (const ch of this.ticker()) {
      hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    }
    return `hsl(${hash % 360} 32% 42%)`;
  });

  constructor() {
    effect(onCleanup => {
      const ticker = this.ticker();
      let active = true;
      onCleanup(() => { active = false; });
      this.logo.set(null);
      this.failed.set(false);
      void normalise(ticker).then(result => {
        if (!active) return;
        if (result) {
          this.logo.set(result);
        } else {
          this.failed.set(true);
        }
      });
    });
  }
}
