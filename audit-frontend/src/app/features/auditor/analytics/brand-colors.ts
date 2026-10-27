// Brand colours for well-known tickers, so a slice looks like the company (Tesla red, Nvidia green, Meta blue).
// Kept in step with client-frontend/src/app/components/dashboard/brand-colors.ts; the two apps build separately.
//
// `family` groups colours a viewer would confuse side by side. When two shown tickers share a family, only the
// bigger one keeps its brand colour; the other takes a palette colour, so no two slices look alike.
export type ColorFamily =
  | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'cyan' | 'blue' | 'navy' | 'indigo' | 'purple' | 'magenta'
  | 'brown' | 'olive' | 'black';

export interface FamilyColor {
  color: string;
  family: ColorFamily;
}

export const BRAND_COLORS: Record<string, FamilyColor> = {
  // Tech
  AAPL: { color: '#1D1D1F', family: 'black' },
  MSFT: { color: '#00A4EF', family: 'cyan' },
  GOOGL: { color: '#4285F4', family: 'blue' },
  GOOG: { color: '#4285F4', family: 'blue' },
  AMZN: { color: '#FF9900', family: 'orange' },
  META: { color: '#0866FF', family: 'blue' },
  NVDA: { color: '#76B900', family: 'green' },
  TSLA: { color: '#E31937', family: 'red' },
  NFLX: { color: '#E50914', family: 'red' },
  AMD: { color: '#ED1C24', family: 'red' },
  INTC: { color: '#0071C5', family: 'blue' },
  IBM: { color: '#0F62FE', family: 'blue' },
  ORCL: { color: '#C74634', family: 'red' },
  CSCO: { color: '#049FD9', family: 'cyan' },
  ADBE: { color: '#FA0F00', family: 'red' },
  CRM: { color: '#00A1E0', family: 'cyan' },
  AVGO: { color: '#CC092F', family: 'red' },
  QCOM: { color: '#3253DC', family: 'blue' },
  // Consumer
  KO: { color: '#F40009', family: 'red' },
  PEP: { color: '#004B93', family: 'navy' },
  SBUX: { color: '#00704A', family: 'green' },
  NKE: { color: '#111111', family: 'black' },
  WMT: { color: '#0071CE', family: 'blue' },
  COST: { color: '#E31837', family: 'red' },
  HD: { color: '#F96302', family: 'orange' },
  DIS: { color: '#113CCF', family: 'blue' },
  // Finance
  V: { color: '#1A1F71', family: 'navy' },
  MA: { color: '#FF5F00', family: 'orange' },
  JPM: { color: '#5B3F2E', family: 'brown' },
  BAC: { color: '#E31837', family: 'red' },
  AXP: { color: '#006FCF', family: 'blue' },
  GS: { color: '#6F9FD8', family: 'blue' },
  // Telecom, health, energy
  TMUS: { color: '#E20074', family: 'magenta' },
  T: { color: '#00A8E0', family: 'cyan' },
  VZ: { color: '#CD040B', family: 'red' },
  UNH: { color: '#002677', family: 'navy' },
  LLY: { color: '#D52B1E', family: 'red' },
  JNJ: { color: '#D51900', family: 'red' },
  PFE: { color: '#0000C9', family: 'blue' },
  XOM: { color: '#ED1B2F', family: 'red' },
  // Crypto
  BTC: { color: '#F7931A', family: 'orange' },
  ETH: { color: '#627EEA', family: 'indigo' },
  SOL: { color: '#9945FF', family: 'purple' },
  XRP: { color: '#23292F', family: 'black' },
  BNB: { color: '#F3BA2F', family: 'yellow' },
  DOGE: { color: '#C2A633', family: 'yellow' },
  ADA: { color: '#0033AD', family: 'navy' },
  AVAX: { color: '#E84142', family: 'red' },
  LINK: { color: '#2A5ADA', family: 'blue' },
  LTC: { color: '#345D9D', family: 'blue' },
};

// Brands people recognise by colour. When one shares a hue with a less famous brand, it keeps the colour even if its
// slice is smaller: Tesla stays red next to a bigger Eli Lilly.
const ICONIC = new Set([
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'KO', 'SBUX', 'NKE', 'TMUS', 'BTC', 'ETH', 'SOL',
]);

// Which labels keep their brand colour: iconic brands claim their hue first, then the rest; within each group the
// order given (biggest first) decides. Labels sharing a hue with an earlier claim get none.
export function claimBrandColors(labels: string[]): Map<string, FamilyColor> {
  const usedFamilies = new Set<ColorFamily>();
  const claimed = new Map<string, FamilyColor>();
  const iconicFirst = [...labels.filter(l => ICONIC.has(l.toUpperCase())), ...labels.filter(l => !ICONIC.has(l.toUpperCase()))];
  for (const label of iconicFirst) {
    const brand = BRAND_COLORS[label.toUpperCase()];
    if (brand && !usedFamilies.has(brand.family)) {
      usedFamilies.add(brand.family);
      claimed.set(label, brand);
    }
  }
  return claimed;
}

// Picks one colour per label, in the order given (biggest first). Labels without a brand colour, or whose hue another
// brand already claimed, take the first palette colour whose family isn't shown yet.
export function pickColors(labels: string[], palette: FamilyColor[]): FamilyColor[] {
  const claimed = claimBrandColors(labels);
  const usedFamilies = new Set([...claimed.values()].map(c => c.family));
  const usedColors = new Set([...claimed.values()].map(c => c.color));
  const picked = labels.map(label => claimed.get(label) ?? null);

  return picked.map(choice => {
    if (choice) {
      return choice;
    }
    const fallback = palette.find(p => !usedFamilies.has(p.family) && !usedColors.has(p.color))
      ?? palette.find(p => !usedColors.has(p.color))
      ?? palette[usedColors.size % palette.length];
    usedFamilies.add(fallback.family);
    usedColors.add(fallback.color);
    return fallback;
  });
}
