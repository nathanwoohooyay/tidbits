import { describe, expect, it, vi } from 'vitest';
import { DashboardStockSearchComponent } from './dashboard-stock-search.component';

describe('DashboardStockSearchComponent', () => {
  it('does not select a hidden suggestion after Escape', () => {
    const component = new DashboardStockSearchComponent();
    const emit = vi.spyOn(component.stockSelected, 'emit');
    component.onInput('AAPL');

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(emit).not.toHaveBeenCalled();
    expect(component.term()).toBe('AAPL');
  });

  it('selects a visible suggestion with Enter', () => {
    const component = new DashboardStockSearchComponent();
    const emit = vi.spyOn(component.stockSelected, 'emit');
    component.onInput('AAPL');

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ ticker: 'AAPL' }));
    expect(component.term()).toBe('');
    expect(component.open()).toBe(false);
  });

  it('looks up a typed ticker when there are no suggestions', () => {
    const component = new DashboardStockSearchComponent();
    const emit = vi.spyOn(component.stockSelected, 'emit');
    component.onInput('ZZZZNOTASTOCK');

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(emit).toHaveBeenCalledWith({
      instrumentId: null,
      ticker: 'ZZZZNOTASTOCK',
      name: 'ZZZZNOTASTOCK',
    });
  });

  it('finds coins and ETFs by name, nickname and Fauxnance symbol', () => {
    const component = new DashboardStockSearchComponent();
    const first = (term: string) => { component.onInput(term); return component.results()[0]?.ticker; };

    expect(first('bitcoin')).toBe('BTC');
    expect(first('btc')).toBe('BTC');
    expect(first('X:BTC-USD')).toBe('BTC');
    expect(first('doge')).toBe('DOGE');
    expect(first('gold')).toBe('GLD');
    expect(first('dow jones')).toBe('DIA');
    component.onInput('s&p 500');
    expect(component.results().map(r => r.ticker)).toEqual(expect.arrayContaining(['SPY', 'VOO']));
  });

  it('labels coins and ETFs in the results', () => {
    const component = new DashboardStockSearchComponent();
    component.onInput('crypto');
    expect(component.results().length).toBeGreaterThan(0);
    expect(component.results().every(r => r.kind === 'crypto')).toBe(true);
    component.onInput('AAPL');
    expect(component.results()[0].kind).toBe('stock');
  });
});
