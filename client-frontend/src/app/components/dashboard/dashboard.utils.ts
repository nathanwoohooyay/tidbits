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

