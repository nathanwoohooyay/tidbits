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
});