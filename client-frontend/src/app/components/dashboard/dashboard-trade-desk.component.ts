import { CommonModule } from '@angular/common';
import {Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TradeMode } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';
import {OrderService, OrderDTO, placedOrderDTO} from '../../services/order.service';
import {PricingService,GetHoldingsResponseDTO, PricingQuoteDTO } from '../../services/pricing.service';
import { tickerToName } from './stock';


interface StockOption {
  instrumentId: number;
  ticker: string;
  name: string;
}

type SelectedQuoteView = Omit<PricingQuoteDTO, 'instrumentId' | 'stale' | 'currency'>;

@Component({
  selector: 'app-dashboard-trade-desk',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-trade-desk.component.html'
})
export class DashboardTradeDeskComponent implements OnChanges {
  @Input() cashBalance = 0;
  @Input() selectedMode: TradeMode = 'buy';
  @Input() selectedInstrumentId: number | null = null;

  @Output() tradeExecuted = new EventEmitter<placedOrderDTO>();

  tradeMode = signal<TradeMode>('buy');
  tradeInstrumentId = signal<number | null>(null);
  tradeQuantity = signal<number | null>(null);
  tradeSearchTerm = signal('');
  tradeError = signal('');
  tradeSuccess = signal('');
  tradeLoading = signal(false);
  quoteLoading = signal(false);
  quoteError = signal('');
  selectedStock = signal<StockOption | null>(null);
  selectedQuote = signal<SelectedQuoteView | null>(null);


  readonly stockOptions: StockOption[] = Array.from(tickerToName.entries()).map(([ticker, name], index) => ({
    instrumentId: index + 1,
    ticker,
    name,
  }));

  private _selectedAccountId: number | null = null;

    @Input()
    set selectedAccountId(value: number | null) {
      this._selectedAccountId = value;
    }

    get selectedAccountId(): number | null {
      return this._selectedAccountId;
    }

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;
  readonly Math = Math;
  private readonly orderService = inject(OrderService);
  private readonly pricingService = inject(PricingService);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedMode']) {
      this.tradeMode.set(this.selectedMode);
    }
    if (changes['selectedInstrumentId']) {
      this.selectStockByInstrumentId(this.selectedInstrumentId);
      this.tradeQuantity.set(null);
      this.tradeError.set('');
      this.tradeSuccess.set('');
    }
  }

  get filteredStockOptions(): StockOption[] {
    const term = this.tradeSearchTerm().trim().toLowerCase();

    if (!term) {
      return this.stockOptions.slice(0, 10);
    }

    return this.stockOptions.filter(stock =>
      stock.ticker.toLowerCase().includes(term) || stock.name.toLowerCase().includes(term)
    );
  }

  selectStock(stock: StockOption) {
    this.tradeInstrumentId.set(stock.instrumentId);
    this.selectedStock.set(stock);
    this.tradeSearchTerm.set(`${stock.ticker} — ${stock.name}`);
    this.tradeQuantity.set(null);
    this.tradeError.set('');
    this.tradeSuccess.set('');
    this.quoteError.set('');
    this.loadSelectedQuote(stock.ticker);
  }

  onSearchTermChange() {
    const matchedStock = this.stockOptions.find(stock => `${stock.ticker} — ${stock.name}` === this.tradeSearchTerm());

    if (!matchedStock) {
      this.tradeInstrumentId.set(null);
      this.selectedStock.set(null);
      this.selectedQuote.set(null);
      this.quoteError.set('');
    }

    this.tradeError.set('');
    this.tradeSuccess.set('');
  }

  selectedInstrumentPrice(): number {
    return this.selectedQuote()?.price ?? 0;
  }


  tradeTotalCost(): number {
    const quantity = this.tradeQuantity() ?? 0;
    return quantity * this.selectedInstrumentPrice();
  }

  canExecuteTrade(): boolean {
    if (!this.selectedQuote() || !this.tradeQuantity() || !this.tradeQuantity() || this.tradeQuantity()! <= 0) {
      return false;
    }
    if (this.tradeMode() === 'buy') {
      return this.tradeTotalCost() <= this.cashBalance;
    }
return true;
  }

  setTradeMode(mode: TradeMode) {
    this.tradeMode.set(mode);
    this.tradeError.set('');
    this.tradeSuccess.set('');
  }

  onTradeInstrumentChange() {
    this.tradeError.set('');
    this.tradeSuccess.set('');
    this.tradeQuantity.set(null);
  }

  executeTrade() {
      if (!this.selectedAccountId) {
        this.tradeError.set('No account selected.');
        return;
      }
    const stock = this.selectedStock();
    const quote = this.selectedQuote();
    const quantity = this.tradeQuantity() ?? 0;

    if (!stock || !quote || !this.canExecuteTrade()) {
      this.tradeError.set('Cannot execute trade');
      return;
    }

    this.tradeLoading.set(true);
    this.tradeError.set('');
    this.tradeSuccess.set('');

    const payload : OrderDTO  = {
      accountId: this.selectedAccountId,
      instrumentId: stock.instrumentId,
      quantity: quantity,
      stockPrice: quote.price, // get from pricer, load into selected instrument
      orderType: this.tradeMode().toUpperCase() as 'BUY' | 'SELL'
    }
    this.orderService.placeOrder(this.selectedAccountId, payload).subscribe({
      next: (placedOrder) => {
        console.log(placedOrder);
        this.tradeExecuted.emit(placedOrder);
        this.tradeLoading.set(false);
        this.tradeSuccess.set(`Sample order filled: ${payload.orderType} ${quantity} share${quantity > 1 ? 's' : ''} of ${stock.ticker}.`);
        this.tradeQuantity.set(null);

      },
      error: err => {
        this.tradeLoading.set(false);
        this.tradeQuantity.set(null);
        this.tradeError.set('Failed to place order.');
      }
    });
  }

  private selectStockByInstrumentId(instrumentId: number | null) {
    if (!instrumentId) {
      this.tradeInstrumentId.set(null);
      this.selectedStock.set(null);
      this.selectedQuote.set(null);
      this.tradeSearchTerm.set('');
      this.quoteError.set('');
      return;
    }

    const stock = this.stockOptions.find(option => option.instrumentId === instrumentId) ?? null;

    if (!stock) {
      this.tradeInstrumentId.set(null);
      this.selectedStock.set(null);
      this.selectedQuote.set(null);
      this.tradeSearchTerm.set('');
      this.quoteError.set('');
      return;
    }

    this.selectStock(stock);
  }

  private loadSelectedQuote(symbol: string) {
    this.quoteLoading.set(true);
    this.quoteError.set('');
    this.selectedQuote.set(null);

    this.pricingService.getQuotes(symbol).subscribe({
      next: (resp: GetHoldingsResponseDTO) => {
        const quote = resp.quotes[0];

        if (!quote) {
          this.quoteError.set('No quote data was returned.');
          return;
        }

        console.log("Getting market data...");
        console.log(quote);
        this.selectedQuote.set({
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          bid: quote.bid,
          ask: quote.ask,
          changePercent: quote.changePercent,
          prevClose: quote.prevClose,
          asOf: quote.asOf,
          source: quote.source,
        });
        this.quoteLoading.set(false);
      },
      error: err => {
        this.quoteLoading.set(false);
        this.quoteError.set(err?.error?.message ?? 'Failed to fetch market price.');
      },
      complete: () => {
        this.quoteLoading.set(false);
      }
    });
  }

}

