import { describe, expect, it } from 'vitest';
import { assignColors, assignSlots } from './allocation-bar.component';
import { BRAND_COLORS } from './brand-colors';

describe('assignSlots', () => {
  it('gives a ticker the same colour whatever else is shown', () => {
    const dashboard = assignSlots(['ETH', 'AAPL', 'MSFT']);
    const overview = assignSlots(['NVDA', 'ETH', 'TSLA', 'MSFT', 'BTC']);
    expect(dashboard.get('ETH')).toBe(overview.get('ETH'));
    expect(dashboard.get('MSFT')).toBe(overview.get('MSFT'));
  });

  it('does not depend on the order positions are listed in', () => {
    expect(assignSlots(['AAPL', 'TSLA', 'BTC'])).toEqual(assignSlots(['BTC', 'AAPL', 'TSLA']));
  });

  it('never gives two shown tickers the same colour', () => {
    const slots = assignSlots(['AAPL', 'GOOGL', 'JPM', 'V', 'AMZN']);
    expect(new Set(slots.values()).size).toBe(5);
    for (const slot of slots.values()) {
      expect(slot).toBeGreaterThanOrEqual(1);
      expect(slot).toBeLessThanOrEqual(5);
    }
  });
});

describe('assignColors', () => {
  it('gives well-known tickers their brand colour', () => {
    const colors = assignColors(['TSLA', 'NVDA', 'META']);
    expect(colors.get('TSLA')).toBe(BRAND_COLORS['TSLA'].color);
    expect(colors.get('NVDA')).toBe(BRAND_COLORS['NVDA'].color);
    expect(colors.get('META')).toBe(BRAND_COLORS['META'].color);
  });

  it('lets only the biggest of two same-hue brands keep its colour', () => {
    const colors = assignColors(['META', 'INTC']); // both blue; META is the bigger position
    expect(colors.get('META')).toBe(BRAND_COLORS['META'].color);
    expect(colors.get('INTC')).toMatch(/^var\(--alloc-[1-5]\)$/);
    expect(colors.get('INTC')).not.toBe('var(--alloc-1)'); // --alloc-1 is blue too
  });

  it('keeps unbranded tickers off the hues brands already show', () => {
    const colors = assignColors(['AMZN', 'SPY', 'QQQ']); // AMZN takes orange
    expect(colors.get('SPY')).not.toBe('var(--alloc-5)');
    expect(colors.get('QQQ')).not.toBe('var(--alloc-5)');
    expect(new Set(colors.values()).size).toBe(3);
  });

  it('draws black brands in the theme ink so they show in dark mode', () => {
    expect(assignColors(['AAPL']).get('AAPL')).toBe('var(--alloc-ink)');
  });
});
