import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Holding, Instrument, TradeExecution, TradeMode } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';

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
  tradeError = '';
  tradeSuccess = '';
  tradeLoading = false;

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;
  readonly Math = Math;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedMode']) {
      this.tradeMode = this.selectedMode;
    }
    if (changes['selectedInstrumentId']) {
      this.tradeInstrumentId = this.selectedInstrumentId;
      this.tradeQuantity = null;
      this.tradeError = '';
      this.tradeSuccess = '';
    }
  }

  selectedInstrument(): Instrument | null {
    return this.instruments.find(i => i.instrument_id === this.tradeInstrumentId) ?? null;
  }

  heldQuantity(): number {
    const held = this.holdings.find(h => h.instrument_id === this.tradeInstrumentId);
    return held?.quantity ?? 0;
  }

  tradeTotalCost(): number {
    const quantity = this.tradeQuantity ?? 0;
    return quantity * (this.selectedInstrument()?.price ?? 0);
  }

  canExecuteTrade(): boolean {
    if (!this.selectedInstrument() || !this.tradeQuantity || this.tradeQuantity <= 0) {
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
    const instrument = this.selectedInstrument();
    const quantity = this.tradeQuantity ?? 0;

    if (!instrument || !this.canExecuteTrade()) {
      this.tradeError = this.tradeMode === 'buy'
        ? 'Enter a valid quantity within your available cash balance.'
        : 'Enter a valid quantity that does not exceed your holdings.';
      return;
    }

    this.tradeLoading = true;
    this.tradeError = '';
    this.tradeSuccess = '';

    this.tradeExecuted.emit({
      instrumentId: instrument.instrument_id,
      orderType: this.tradeMode,
      quantity,
      stockPrice: instrument.price,
    });

    this.tradeLoading = false;
    this.tradeSuccess = `Sample order filled: ${this.tradeMode === 'buy' ? 'Bought' : 'Sold'} ${quantity} share${quantity > 1 ? 's' : ''} of ${instrument.ticker}.`;
    this.tradeQuantity = null;
  }
}

