// Decimal places that show a price meaningfully: 2 from a dollar up, more below it so a coin at $0.0775 doesn't read
// as $0.08 (four significant figures past the leading zeros, up to 8 places).
export function pricePrecision(price: number): number {
  const abs = Math.abs(price);
  if (!Number.isFinite(abs) || abs >= 1 || abs === 0) {
    return 2;
  }
  return Math.min(8, Math.max(2, Math.ceil(-Math.log10(abs)) + 3));
}

// Dollars with cents; values under a dollar keep more places (see pricePrecision), trailing zeros dropped past the cents.
export function formatCurrency(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const absVal = safeValue < 0 ? -safeValue : safeValue;
  const places = pricePrecision(absVal);
  let fixed = absVal.toFixed(places);
  if (places > 2) {
    fixed = fixed.replace(/(\.\d{2}\d*?)0+$/, '$1');
  }
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (safeValue < 0 ? '-$' : '$') + parts.join('.');
}

export function formatPercent(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue >= 0 ? '+' : ''}${safeValue.toFixed(2)}%`;
}

// The backend sends times in UTC without an offset ("2026-10-26T13:40:12"); a bare string like that would be read
// as local time, so add the Z.
export function serverTime(iso: string | null | undefined): Date | null {
  if (!iso) {
    return null;
  }
  return new Date(/(?:[zZ]|[+-]\d\d:?\d\d)$/.test(iso) ? iso : `${iso}Z`);
}

export function statusClass(status: string): string {
  return `status-${String(status ?? '').toLowerCase()}`;
}

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
	return '0';
  }
  if (value >= 1_000_000_000) {
	return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
	return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
	return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}


// 'Sep 3 – Oct 12' for two YYYY-MM-DD days; years are added when the days fall in different years.
export function formatDayRange(from: string, to: string): string {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  const withYear = a.getFullYear() !== b.getFullYear();
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
  return `${fmt(a)} – ${fmt(b)}`;
}
