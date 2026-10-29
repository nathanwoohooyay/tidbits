// Brand colours for the stocks, coins and funds the platform lists, so a ticker is drawn in the colour people know it
// by (Bitcoin orange, Nvidia green, Coca-Cola red) wherever the app colours stocks.
// The client app has an identical copy (client-frontend/src/app/components/dashboard/stock-colors.ts); change both
// together.
//
// Brands share colours (a dozen blues, a dozen reds), so assignStockColors() gives each ticker in a chart its main
// brand colour when that is distinct from the colours already used, then its other brand colours, then lighter or
// darker shades of them, and only then a neutral palette. Tickers without an entry go straight to that palette.
// Better-known brands come first in BRAND_COLORS and claim their colour first when two clash.

export type ColorTheme = 'light' | 'dark';

// The first colour is the brand's main one; any others come from the same brand's palette.
export const BRAND_COLORS: Record<string, string[]> = {
  // Technology
  AAPL: ['#A2AAAD', '#555555'],
  MSFT: ['#00A4EF', '#7FBA00', '#F25022', '#FFB900'],
  NVDA: ['#76B900'],
  GOOGL: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
  GOOG: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
  AMZN: ['#FF9900', '#232F3E'],
  META: ['#0866FF'],
  TSLA: ['#E31937'],
  AVGO: ['#CC092F'],
  ORCL: ['#C74634'],
  ADBE: ['#FA0F00'],
  NFLX: ['#E50914'],
  CRM: ['#00A1E0'],
  AMD: ['#ED1C24', '#000000'],
  CSCO: ['#049FD9'],
  INTC: ['#0071C5'],
  TXN: ['#CC0000'],
  QCOM: ['#3253DC'],
  IBM: ['#0F62FE'],
  NOW: ['#81B5A1'],
  INTU: ['#236CFF'],
  ACN: ['#A100FF'],
  ADP: ['#D0271D'],
  PANW: ['#FA582D'],
  // Financials
  V: ['#1A1F71', '#F7B600'],
  MA: ['#EB001B', '#F79E1B'],
  JPM: ['#117ACA'],
  BAC: ['#E31837', '#012169'],
  WFC: ['#D71E28', '#FFCD41'],
  GS: ['#7399C6'],
  C: ['#056DAE', '#ED1C24'],
  AXP: ['#016FD0'],
  BLK: ['#000000'],
  SCHW: ['#00A0DF'],
  SPGI: ['#D6002A'],
  // Health care
  UNH: ['#002677', '#FF612B'],
  LLY: ['#D52B1E'],
  JNJ: ['#EB1700'],
  MRK: ['#00857C'],
  ABBV: ['#071D49'],
  PFE: ['#0093D0'],
  TMO: ['#E71316'],
  ABT: ['#009CDE'],
  AMGN: ['#0063C3'],
  SYK: ['#FFB500'],
  GILD: ['#C5203E'],
  MDT: ['#004B87'],
  BMY: ['#BE2BBB'],
  ZTS: ['#FF6400'],
  // Consumer
  WMT: ['#0071CE', '#FFC220'],
  PG: ['#003DA5'],
  HD: ['#F96302'],
  COST: ['#E31837', '#005DAA'],
  KO: ['#F40009'],
  PEP: ['#004B93', '#C9002B'],
  MCD: ['#FFC72C', '#DA291C'],
  DIS: ['#113CCF'],
  NKE: ['#111111', '#FA5400'],
  SBUX: ['#00704A'],
  LOW: ['#004990'],
  TJX: ['#C8102E'],
  MDLZ: ['#4F2170'],
  // Telecoms
  VZ: ['#EE0000'],
  T: ['#00A8E0'],
  TMUS: ['#E20074'],
  // Energy and industrials
  XOM: ['#ED1B2D'],
  COP: ['#D61F26'],
  SLB: ['#0014DC'],
  CAT: ['#FFCD11'],
  GE: ['#005EB8'],
  HON: ['#DC1E35'],
  DE: ['#367C2B', '#FFDE00'],
  ETN: ['#005EB8'],
  LIN: ['#00A0E1'],
  BKNG: ['#003580'],
  // Crypto
  BTC: ['#F7931A'],
  ETH: ['#627EEA'],
  SOL: ['#9945FF', '#14F195'],
  XRP: ['#23292F'],
  BNB: ['#F3BA2F'],
  DOGE: ['#C2A633'],
  ADA: ['#0033AD'],
  AVAX: ['#E84142'],
  LINK: ['#2A5ADA'],
  LTC: ['#345D9D', '#BFBBBB'],
  // ETFs: the fund issuer's colour, as on the client app's ETF badges
  SPY: ['#3B7A48'], DIA: ['#3B7A48'], GLD: ['#3B7A48'], XLK: ['#3B7A48'],
  VOO: ['#8E1B22'], VTI: ['#8E1B22'],
  QQQ: ['#1F4E8C'],
  IWM: ['#4A535C'], TLT: ['#4A535C'],
  ARKK: ['#5B4A8B'],
};

// For tickers without a brand entry, or whose brand colours are all taken.
const FALLBACK: Record<ColorTheme, string[]> = {
  light: ['#2A78D6', '#EDA100', '#E87BA4', '#6250D6', '#EB6834', '#1BAF7A'],
  dark: ['#3987E5', '#C98500', '#D55181', '#9085E9', '#D95926', '#199E70'],
};

// Colours closer than this (CIE76 ΔE) read as the same slice.
const MIN_DISTANCE = 20;
// Lightness (CIE L*) a colour must stay within to stand out from each theme's page background.
const LIGHTNESS_RANGE: Record<ColorTheme, [number, number]> = { light: [0, 80], dark: [40, 100] };
// Lightness steps (HSL %) tried when a brand colour is too close to one already used.
const SHADES = [14, -14, 26, -26];

const PRIORITY = new Map(Object.keys(BRAND_COLORS).map((ticker, i) => [ticker, i]));

// One colour per ticker, distinct from each other and from `reserved` (a chart's "Other" or "Cash" colours). Tickers
// are placed in BRAND_COLORS order (then alphabetically), so the same set of tickers always gets the same colours,
// whatever order they're shown in.
export function assignStockColors(tickers: string[], theme: ColorTheme, reserved: string[] = []): Map<string, string> {
  const ordered = [...new Set(tickers.map(t => t.toUpperCase()))].sort((a, b) =>
    (PRIORITY.get(a) ?? Infinity) - (PRIORITY.get(b) ?? Infinity) || a.localeCompare(b));
  const used = reserved.map(hex => toLab(hexToRgb(hex)));
  const colors = new Map<string, string>();
  ordered.forEach((ticker, i) => {
    // Main brand colours of the tickers still to place: a fallback colour mustn't take one of those.
    const claimed = ordered.slice(i + 1).flatMap(other => BRAND_COLORS[other]?.slice(0, 1) ?? [])
      .map(hex => toLab(hexToRgb(fitTheme(hex, theme))));
    const color = pickColor(ticker, theme, used, claimed);
    used.push(toLab(hexToRgb(color)));
    colors.set(ticker, color);
  });
  return colors;
}

function pickColor(ticker: string, theme: ColorTheme, used: Lab[], claimed: Lab[]): string {
  const brand = (BRAND_COLORS[ticker] ?? []).map(hex => fitTheme(hex, theme));
  const fallbacks = [
    ...brand.slice(1),
    ...brand.flatMap(hex => SHADES.map(step => fitTheme(shade(hex, step), theme))),
    ...FALLBACK[theme],
    // Evenly spread hues, as a last resort for crowded charts.
    ...Array.from({ length: 24 }, (_, i) => fitTheme(hslToHex((i * 137.5) % 360, 55, theme === 'dark' ? 60 : 45), theme)),
  ];
  const clearOf = (others: Lab[]) => (hex: string) => {
    const lab = toLab(hexToRgb(hex));
    return others.every(other => deltaE(lab, other) >= MIN_DISTANCE);
  };
  if (brand.length && clearOf(used)(brand[0])) {
    return brand[0];
  }
  return fallbacks.find(clearOf([...used, ...claimed])) ?? fallbacks.find(clearOf(used)) ?? brand[0] ?? fallbacks[0];
}

// Lightens near-black brands on the dark theme and darkens near-white ones on the light theme.
function fitTheme(hex: string, theme: ColorTheme): string {
  const [min, max] = LIGHTNESS_RANGE[theme];
  let color = hex;
  for (let i = 0; i < 40; i++) {
    const lightness = toLab(hexToRgb(color))[0];
    if (lightness < min) {
      color = shade(color, 3);
    } else if (lightness > max) {
      color = shade(color, -3);
    } else {
      break;
    }
  }
  return color;
}

type Rgb = [number, number, number];
type Lab = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map(c => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Moves a colour's HSL lightness by `step` percentage points.
function shade(hex: string, step: number): string {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return hslToHex(h, s, Math.min(100, Math.max(0, l + step)));
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return [0, 0, l * 100];
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (ln - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return rgbToHex([channel(0), channel(8), channel(4)]);
}

// sRGB to CIE L*a*b* (D65), for distances that match how different two colours look.
function toLab(rgb: Rgb): Lab {
  const [r, g, b] = rgb.map(c => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function deltaE(a: Lab, b: Lab): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
