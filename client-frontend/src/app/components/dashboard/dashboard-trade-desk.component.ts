import { CommonModule } from '@angular/common';
import {Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Holding, Instrument, TradeExecution, TradeMode } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';
import {OrderService, OrderDTO} from '../../services/order.service';
import {PricingService,GetHoldingsResponseDTO, PricingQuoteDTO } from '../../services/pricing.service';
import { tickerToName } from './stock';
import { catchError, finalize, map, of, tap } from 'rxjs';


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
  @Input() instruments: Instrument[] = [];
  @Input() holdings: Holding[] = [];
  @Input() cashBalance = 0;
  @Input() selectedMode: TradeMode = 'buy';
  @Input() selectedInstrumentId: number | null = null;

  @Output() tradeExecuted = new EventEmitter<TradeExecution>();

  tradeMode: TradeMode = 'buy';
  tradeInstrumentId: number | null = null;
  tradeQuantity: number | null = null;
  tradeSearchTerm = '';
  tradeError = '';
  tradeSuccess = '';
  tradeLoading = false;
  quoteLoading = false;
  quoteError = '';
  selectedStock: StockOption | null = null;
  selectedQuote: SelectedQuoteView | null = null;


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
      this.tradeMode = this.selectedMode;
    }
    if (changes['selectedInstrumentId']) {
      this.selectStockByInstrumentId(this.selectedInstrumentId);
      this.tradeQuantity = null;
      this.tradeError = '';
      this.tradeSuccess = '';
    }
  }

  get filteredStockOptions(): StockOption[] {
    const term = this.tradeSearchTerm.trim().toLowerCase();

    if (!term) {
      return this.stockOptions.slice(0, 10);
    }

    return this.stockOptions.filter(stock =>
      stock.ticker.toLowerCase().includes(term) || stock.name.toLowerCase().includes(term)
    );
  }

  selectStock(stock: StockOption) {
    this.tradeInstrumentId = stock.instrumentId;
    this.selectedStock = stock;
    this.tradeSearchTerm = `${stock.ticker} — ${stock.name}`;
    this.tradeQuantity = null;
    this.tradeError = '';
    this.tradeSuccess = '';
    this.quoteError = '';
    this.loadSelectedQuote(stock.ticker);
  }

  onSearchTermChange() {
    const matchedStock = this.stockOptions.find(stock => `${stock.ticker} — ${stock.name}` === this.tradeSearchTerm);

    if (!matchedStock) {
      this.tradeInstrumentId = null;
      this.selectedStock = null;
      this.selectedQuote = null;
      this.quoteError = '';
    }

    this.tradeError = '';
    this.tradeSuccess = '';
  }

  selectedInstrumentPrice(): number {
    return this.selectedQuote?.price ?? 0;
  }

  heldQuantity(): number {
    const held = this.holdings.find(h => h.instrument_id === this.tradeInstrumentId);
    return held?.quantity ?? 0;
  }

  tradeTotalCost(): number {
    const quantity = this.tradeQuantity ?? 0;
    return quantity * this.selectedInstrumentPrice();
  }

  canExecuteTrade(): boolean {
    if (!this.selectedQuote || !this.tradeQuantity || this.tradeQuantity <= 0) {
      return false;
    }
    if (this.tradeMode === 'buy') {
      return this.tradeTotalCost() <= this.cashBalance;
    }
    return this.heldQuantity() >= this.tradeQuantity;
  }

  setTradeMode(mode: TradeMode) {
    this.tradeMode = mode;
    this.tradeError = '';
    this.tradeSuccess = '';
  }

  onTradeInstrumentChange() {
    this.tradeError = '';
    this.tradeSuccess = '';
    this.tradeQuantity = null;
  }

  executeTrade() {
      if (!this.selectedAccountId) {
        this.tradeError = 'No account selected.';
        return;
      }
    const stock = this.selectedStock;
    const quote = this.selectedQuote;
    const quantity = this.tradeQuantity ?? 0;

    if (!stock || !quote || !this.canExecuteTrade()) {
      this.tradeError = this.tradeMode === 'buy'
        ? 'Enter a valid quantity within your available cash balance.'
        : 'Enter a valid quantity that does not exceed your holdings.';
      return;
    }

    this.tradeLoading = true;
    this.tradeError = '';
    this.tradeSuccess = '';


//TODO: remove
    this.tradeExecuted.emit({
      instrumentId: stock.instrumentId,
      orderType: this.tradeMode,
      quantity,
      stockPrice: quote.price,
    });

    const payload : OrderDTO  = {
      accountId: this.selectedAccountId,
      instrumentId: stock.instrumentId,
      quantity: quantity,
      stockPrice: quote.price, // get from pricer, load into selected instrument
      orderType: this.tradeMode.toUpperCase() as 'BUY' | 'SELL'
    }
    this.orderService.placeOrder(this.selectedAccountId, payload).subscribe({
      next: placedOrder => {
        console.log(placedOrder);
        this.tradeLoading = false;
        this.tradeSuccess = `Sample order filled: ${payload.orderType} ${quantity} share${quantity > 1 ? 's' : ''} of ${stock.ticker}.`;
        this.tradeQuantity = null;
      },
      error: err => {
        this.tradeLoading = false;
        this.tradeQuantity = null;
        this.tradeError= 'Failed to place order.';
      }
    });
  }

  private selectStockByInstrumentId(instrumentId: number | null) {
    if (!instrumentId) {
      this.tradeInstrumentId = null;
      this.selectedStock = null;
      this.selectedQuote = null;
      this.tradeSearchTerm = '';
      this.quoteError = '';
      return;
    }

    const stock = this.stockOptions.find(option => option.instrumentId === instrumentId) ?? null;

    if (!stock) {
      this.tradeInstrumentId = null;
      this.selectedStock = null;
      this.selectedQuote = null;
      this.tradeSearchTerm = '';
      this.quoteError = '';
      return;
    }

    this.selectStock(stock);
  }

  private loadSelectedQuote(symbol: string) {
    this.quoteLoading = true;
    this.quoteError = '';
    this.selectedQuote = null;

    this.pricingService.getQuotes(symbol).subscribe({
      next: (resp: GetHoldingsResponseDTO) => {
        const quote = resp.quotes[0];

        if (!quote) {
          this.quoteError = 'No quote data was returned.';
          return;
        }

        console.log("Getting market data...");
        console.log(quote);
        this.selectedQuote = {
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change,
          bid: quote.bid,
          ask: quote.ask,
          changePercent: quote.changePercent,
          prevClose: quote.prevClose,
          asOf: quote.asOf,
          source: quote.source,
        };
        this.quoteLoading = false;
      },
      error: err => {
        this.quoteLoading = false;
        this.quoteError = err?.error?.message ?? 'Failed to fetch market price.';
      },
      complete: () => {
        this.quoteLoading = false;
      }
    });
  }

}

