import { describe, expect, it } from 'vitest';
import { assignSlots } from './allocation-bar.component';

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
