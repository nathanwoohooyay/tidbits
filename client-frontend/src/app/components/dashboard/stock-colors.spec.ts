import { describe, expect, it } from 'vitest';
import { assignStockColors, BRAND_COLORS } from './stock-colors';

describe('assignStockColors', () => {
  it('uses the brand colour when nothing else in the chart is close to it', () => {
    const colors = assignStockColors(['BTC', 'NVDA', 'KO'], 'light');

    expect(colors.get('BTC')).toBe('#F7931A');
    expect(colors.get('NVDA')).toBe('#76B900');
    expect(colors.get('KO')).toBe('#F40009');
  });

  it('gives a ticker the same colour whatever else is shown, when nothing clashes with it', () => {
    const dashboard = assignStockColors(['ETH', 'AAPL', 'NVDA'], 'light');
    const overview = assignStockColors(['NVDA', 'ETH', 'TSLA', 'BTC', 'AAPL'], 'light');

    expect(dashboard.get('ETH')).toBe(overview.get('ETH'));
    expect(dashboard.get('NVDA')).toBe(overview.get('NVDA'));
  });

  it('does not depend on the order positions are listed in', () => {
    expect(assignStockColors(['MSFT', 'CRM', 'IBM'], 'light')).toEqual(assignStockColors(['IBM', 'MSFT', 'CRM'], 'light'));
  });

  it('lets the better-known of two near-identical brands keep its colour', () => {
    // Microsoft and Salesforce are both sky blue; Meta and IBM are both bright blue.
    const colors = assignStockColors(['CRM', 'MSFT', 'IBM', 'META'], 'light');

    expect(colors.get('MSFT')).toBe('#00A4EF');
    expect(colors.get('CRM')).not.toBe('#00A1E0');
    expect(colors.get('META')).toBe('#0866FF');
    expect(colors.get('IBM')).not.toBe('#0F62FE');
    expect(new Set(colors.values()).size).toBe(4);
  });

  it('tries the brand\u2019s other colours before shades of the main one', () => {
    // GOOG and GOOGL are the same company: the second takes Google red.
    const colors = assignStockColors(['GOOG', 'GOOGL'], 'light');

    expect(colors.get('GOOGL')).toBe('#4285F4');
    expect(colors.get('GOOG')).toBe('#EA4335');
  });

  it('never gives a fallback colour that is another shown stock\u2019s brand colour', () => {
    // GOOG can't have Google blue (GOOGL has it), and Google red would look like Tesla.
    const colors = assignStockColors(['GOOG', 'GOOGL', 'TSLA'], 'light');

    expect(colors.get('TSLA')).toBe('#E31937');
    expect(colors.get('GOOG')).not.toBe('#EA4335');
  });

  it('stays clear of reserved colours', () => {
    const colors = assignStockColors(['BTC'], 'light', ['#F7931A']);

    expect(colors.get('BTC')).not.toBe('#F7931A');
  });

  it('lightens near-black brands in dark mode and leaves them alone in light mode', () => {
    expect(assignStockColors(['BLK'], 'light').get('BLK')).toBe('#000000');
    expect(assignStockColors(['BLK'], 'dark').get('BLK')).not.toBe('#000000');
  });

  it('falls back to the palette for tickers without a brand entry', () => {
    expect(BRAND_COLORS['TRX']).toBeUndefined();
    expect(assignStockColors(['TRX'], 'light').get('TRX')).toBe('#2A78D6');
  });

  it('keeps every colour in a crowded chart distinct', () => {
    const tickers = ['JPM', 'BAC', 'WFC', 'C', 'GS', 'AXP', 'SCHW', 'V', 'MA'];
    expect(new Set(assignStockColors(tickers, 'dark').values()).size).toBe(tickers.length);
  });
});
