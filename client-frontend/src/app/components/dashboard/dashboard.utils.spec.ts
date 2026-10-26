import { describe, expect, it } from 'vitest';
import { formatCurrency, pricePrecision, serverTime } from './dashboard.utils';

describe('serverTime', () => {
  it('reads times without an offset as UTC', () => {
    expect(serverTime('2026-10-26T13:40:12.5')?.toISOString()).toBe('2026-10-26T13:40:12.500Z');
  });

  it('keeps an explicit offset', () => {
    expect(serverTime('2026-10-26T09:40:12-04:00')?.toISOString()).toBe('2026-10-26T13:40:12.000Z');
    expect(serverTime('2026-10-26T13:40:12Z')?.toISOString()).toBe('2026-10-26T13:40:12.000Z');
  });

  it('passes empty values through as null', () => {
    expect(serverTime(null)).toBeNull();
    expect(serverTime('')).toBeNull();
  });
});

describe('formatCurrency', () => {
  it('keeps cents from a dollar up', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(-12)).toBe('-$12.00');
  });

  it('shows coins under a dollar with enough places', () => {
    expect(formatCurrency(0.0775)).toBe('$0.0775');
    expect(formatCurrency(0.20631)).toBe('$0.2063');
    expect(formatCurrency(0.5)).toBe('$0.50');
    expect(formatCurrency(0.30000000000000004)).toBe('$0.30');
  });
});

describe('pricePrecision', () => {
  it('adds places as prices fall below a dollar', () => {
    expect(pricePrecision(80136.3)).toBe(2);
    expect(pricePrecision(0.2)).toBe(4);
    expect(pricePrecision(0.0775)).toBe(5);
    expect(pricePrecision(0.00001234)).toBe(8);
  });
});
