export function formatCurrency(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const absVal = safeValue < 0 ? -safeValue : safeValue;
  const parts = absVal.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (safeValue < 0 ? '-$' : '$') + parts.join('.');
}

export function formatPercent(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue >= 0 ? '+' : ''}${safeValue.toFixed(2)}%`;
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
