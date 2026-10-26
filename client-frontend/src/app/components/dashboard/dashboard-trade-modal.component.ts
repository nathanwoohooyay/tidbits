import { CommonModule } from '@angular/common';
import {
  Component, ElementRef, OnDestroy, computed, effect, inject, input, output, signal, untracked, viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { OrderDTO, OrderService, placedOrderDTO } from '../../services/order.service';
import { PricingCandlesResponseDTO } from '../../services/pricing.service';
import { CandleRange, PortfolioQueries, REFRESH_INTERVAL_MS, rangeStart } from '../../services/portfolio-queries';
import { TradeMode, TradeTarget } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';
import { ChartTrade, StockChartMode, StockPriceChartComponent } from './stock-price-chart.component';
import { MODAL_EXIT_MS, lockPageScroll, unlockPageScroll } from './page-scroll-lock';
import { TickerLogoComponent } from './ticker-logo.component';
import { ChartSkeletonComponent } from './chart-skeleton.component';
import { ErrorStateComponent } from '../error-state.component';
import { RollingNumberComponent } from '../rolling-number.component';
import { ToastService } from '../../services/toast.service';
import { WatchlistService } from '../../services/watchlist.service';

const formatShares = (qty: number) => qty.toLocaleString(undefined, { maximumFractionDigits: 4 });

type HttpError = { error?: { message?: string; error?: string } } | null;

// Fauxnance answers 202 with no candles while it backfills a symbol it hasn't fetched before.
const isBackfilling = (response: PricingCandlesResponseDTO | undefined) =>
  !!response && !response.asOf && !!response.partial && response.candles.length === 0;

// Modal trade window: live quote, price history and a buy/sell form for the selected account.
// Uses a native <dialog> (focus trap, Esc, inert page) and locks page scrolling while open.
@Component({
  selector: 'app-dashboard-trade-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, StockPriceChartComponent, TickerLogoComponent, ChartSkeletonComponent, ErrorStateComponent,
    RollingNumberComponent,
  ],
  templateUrl: './dashboard-trade-modal.component.html',
  styleUrl: './dashboard-trade-modal.component.css'
})
export class DashboardTradeModalComponent implements OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly queries = inject(PortfolioQueries);
  private readonly toasts = inject(ToastService);
  private readonly watchlist = inject(WatchlistService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly priceChart = viewChild(StockPriceChartComponent);

  readonly target = input<TradeTarget | null>(null);
  readonly accountId = input(0);
  readonly accountName = input('');
  readonly cashBalance = input(0);
  readonly ownedQuantity = input(0);

  readonly closed = output<void>();
  readonly tradeExecuted = output<placedOrderDTO>();

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;
  readonly Math = Math;
  readonly formatShares = formatShares;
  readonly ranges: CandleRange[] = ['1M', '3M', '6M', '1Y', '5Y'];

  readonly mode = signal<TradeMode>('buy');
  readonly quantity = signal<number | null>(null);
  // Orders can be entered as a share count or a dollar amount; dollar amounts become fractional shares.
  readonly inputMode = signal<'shares' | 'dollars'>('shares');
  readonly dollarAmount = signal<number | null>(null);
  readonly range = signal<CandleRange>('3M');
  readonly chartMode = signal<StockChartMode>('line');
  readonly submitting = signal(false);
  // The submit button shows a check for a moment after a fill, then the window closes and a toast confirms.
  readonly filled = signal(false);
  // Second step: the filled-in order is shown for review before it's placed. Editing anything goes back a step.
  readonly reviewing = signal(false);
  readonly result = signal<{ kind: 'success' | 'error'; text: string } | null>(null);
  // What the window shows. Kept for a moment after `target` clears so the content stays put while it animates out.
  readonly shown = signal<TradeTarget | null>(null);
  // Return over the zoomed part of the chart; null when the whole range is on screen.
  readonly zoomInfo = signal<{ change: number; label: string } | null>(null);

  // Follows what's on screen (not `target`), so the quote and chart stay while the window animates closed.
  private readonly ticker = computed(() => this.shown()?.ticker ?? '');

  // Live quote: refreshes in the background while the window is open.
  private readonly quoteQuery = injectQuery(() => ({
    ...this.queries.quotes([this.ticker()]),
    enabled: !!this.ticker(),
    refetchInterval: REFRESH_INTERVAL_MS,
  }));
  private readonly candlesQuery = injectQuery(() => ({
    // Always the full five years: the range buttons only move the chart's view, so zooming out keeps showing history.
    ...this.queries.candles(this.ticker(), '5Y'),
    enabled: !!this.ticker(),
    refetchInterval: query => isBackfilling(query.state.data) ? 5000 : false,
  }));

  readonly quote = computed(() => this.quoteQuery.data()?.[0] ?? null);
  // Quote errors worth retrying (network, server); a symbol that simply can't be traded is not one of them.
  readonly quoteRetryable = computed(() => !!this.quoteQuery.error());
  readonly quoteLoading = computed(() => this.quoteQuery.isPending() && !!this.ticker());
  readonly quoteError = computed(() => {
    if (this.quoteQuery.error()) {
      return (this.quoteQuery.error() as HttpError)?.error?.message ?? 'Failed to fetch the latest quote.';
    }
    if (this.quoteQuery.isSuccess() && !this.quote()) {
      return `No quote found for ${this.ticker()}.`;
    }
    if (this.quote() && !this.quote()!.instrumentId) {
      return `${this.ticker()} is not available to trade.`;
    }
    return '';
  });

  // This account's filled orders on the stock, for buy/sell markers (shares the dashboard's cached orders query).
  private readonly ordersQuery = injectQuery(() => ({
    ...this.queries.orders(this.accountId()),
    enabled: this.accountId() > 0 && !!this.ticker(),
  }));
  readonly chartTrades = computed<ChartTrade[]>(() => (this.ordersQuery.data() ?? [])
    .filter(o => o.instrument?.ticker === this.ticker() && o.status?.toUpperCase() === 'FILLED')
    .map(o => {
      const filledAt = [...(o.statusHistory ?? [])].reverse().find(h => h.newStatus?.toUpperCase() === 'FILLED')?.changedAt
        ?? o.statusHistory?.[0]?.changedAt;
      return { date: (filledAt ?? '').slice(0, 10), side: o.orderType, quantity: o.quantity, price: o.price };
    })
    .filter(t => !!t.date));

  readonly candles = computed(() => this.candlesQuery.data()?.candles ?? []);
  readonly viewFrom = computed(() => rangeStart(this.range()));
  readonly candlesLoading = computed(() =>
    (this.candlesQuery.isPending() && !!this.ticker()) || isBackfilling(this.candlesQuery.data()));
  readonly candlesError = computed(() => {
    const err = this.candlesQuery.error() as HttpError;
    return err ? err.error?.message ?? err.error?.error ?? 'Price history is unavailable right now.' : '';
  });
  // Return over the range, from adjusted closes so splits and dividends don't distort it.
  readonly rangeChange = computed(() => {
    const from = this.viewFrom();
    const closes = this.candles().filter(c => c.date >= from).map(c => c.adjclose ?? c.close).filter((v): v is number => v != null);
    return closes.length >= 2 && closes[0] ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 : null;
  });
  readonly partialFrom = computed(() => {
    const data = this.candlesQuery.data();
    return data?.partial && data.availableFrom ? data.availableFrom : null;
  });

  // Shares actually sent with the order. Dollar amounts round down to the 4 decimal places the backend stores,
  // so a buy never costs more than the amount typed; selling at least the position's value sells all of it.
  readonly orderQuantity = computed(() => {
    if (this.inputMode() === 'shares') {
      return this.quantity() ?? 0;
    }
    const price = this.quote()?.price ?? 0;
    const amount = this.dollarAmount() ?? 0;
    if (price <= 0 || amount <= 0) {
      return 0;
    }
    // Compare against the cent-rounded position value (what Max fills in) so "sell everything" leaves no sliver.
    if (this.mode() === 'sell' && amount >= Math.floor(this.ownedQuantity() * price * 100) / 100) {
      return this.ownedQuantity();
    }
    return Math.floor((amount / price) * 10_000) / 10_000;
  });
  // Rounded down to the cent, as the backend does when it charges or credits the order.
  readonly total = computed(() => Math.floor(this.orderQuantity() * (this.quote()?.price ?? 0) * 100 + 1e-6) / 100);
  readonly maxQuantity = computed(() => {
    const price = this.quote()?.price ?? 0;
    return this.mode() === 'sell' ? this.ownedQuantity() : price > 0 ? Math.floor(this.cashBalance() / price) : 0;
  });
  // Largest dollar amount for the current side: all available cash, or the whole position's value.
  readonly maxDollars = computed(() => {
    const price = this.quote()?.price ?? 0;
    return this.mode() === 'sell' ? Math.floor(this.ownedQuantity() * price * 100) / 100 : Math.floor(this.cashBalance() * 100) / 100;
  });
  readonly validationMessage = computed(() => {
    if (this.inputMode() === 'dollars' && (this.dollarAmount() ?? 0) > 0 && this.orderQuantity() <= 0) {
      return 'That amount is less than the smallest tradable fraction (0.0001 shares).';
    }
    const qty = this.orderQuantity();
    if (!this.quote() || qty <= 0) {
      return '';
    }
    if (this.mode() === 'buy' && this.total() > this.cashBalance()) {
      return `Not enough cash: this order needs ${formatCurrency(this.total())}.`;
    }
    if (this.mode() === 'sell' && qty > this.ownedQuantity()) {
      return `You only own ${this.ownedQuantity()} share${this.ownedQuantity() === 1 ? '' : 's'}.`;
    }
    return '';
  });
  // What the account looks like if the order fills at the current price.
  readonly cashAfter = computed(() => this.mode() === 'buy' ? this.cashBalance() - this.total() : this.cashBalance() + this.total());
  readonly positionAfter = computed(() =>
    Math.max(0, this.mode() === 'buy' ? this.ownedQuantity() + this.orderQuantity() : this.ownedQuantity() - this.orderQuantity()));

  // Whether this stock is on the user's watchlist (the star in the header).
  private readonly watchlistQuery = injectQuery(() => ({
    ...this.watchlist.list(this.watchlist.userId()),
    enabled: this.watchlist.userId() > 0 && !!this.ticker(),
  }));
  readonly watching = computed(() => (this.watchlistQuery.data() ?? []).some(item => item.ticker === this.ticker()));

  readonly canSubmit = computed(() =>
    !!this.quote()?.instrumentId && this.orderQuantity() > 0 && !this.validationMessage() && !this.submitting()
      && !this.filled() && this.accountId() > 0
  );

  private previousFocus: HTMLElement | null = null;
  private scrollLocked = false;
  private clearShownTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Open/close the dialog as the target changes, resetting the form for each new stock.
    effect(() => {
      const target = this.target();
      untracked(() => target ? this.openFor() : this.closeDialog());
    });
  }

  ngOnDestroy() {
    this.unlockScroll();
  }

  setMode(mode: TradeMode) {
    this.mode.set(mode);
    this.reviewing.set(false);
    this.result.set(null);
  }

  setQuantity(value: number | null) {
    this.quantity.set(value);
    this.reviewing.set(false);
    this.result.set(null);
  }

  setDollarAmount(value: number | null) {
    this.dollarAmount.set(value);
    this.reviewing.set(false);
    this.result.set(null);
  }

  // Switching keeps what was entered: shares convert to their dollar value and back.
  setInputMode(mode: 'shares' | 'dollars') {
    if (mode === this.inputMode()) {
      return;
    }
    const price = this.quote()?.price ?? 0;
    if (mode === 'dollars') {
      const qty = this.quantity() ?? 0;
      this.dollarAmount.set(qty > 0 && price > 0 ? Math.round(qty * price * 100) / 100 : null);
    } else {
      const qty = this.orderQuantity();
      this.quantity.set(qty > 0 ? qty : null);
    }
    this.inputMode.set(mode);
    this.reviewing.set(false);
    this.result.set(null);
  }

  setRange(range: CandleRange) {
    if (range === this.range()) {
      this.resetZoom();
    } else {
      this.range.set(range);
    }
  }

  resetZoom() {
    this.priceChart()?.resetZoom();
  }

  retryQuote() {
    void this.quoteQuery.refetch();
  }

  retryCandles() {
    void this.candlesQuery.refetch();
  }

  useMax() {
    if (this.inputMode() === 'dollars') {
      this.setDollarAmount(this.maxDollars() || null);
    } else {
      this.setQuantity(this.maxQuantity() || null);
    }
  }

  review() {
    if (this.canSubmit()) {
      this.result.set(null);
      this.reviewing.set(true);
    }
  }

  editOrder() {
    this.reviewing.set(false);
  }

  toggleWatch() {
    const stock = this.shown();
    if (stock) {
      void this.watchlist.toggle(stock.ticker, stock.name);
    }
  }

  submit() {
    const quote = this.quote();
    const qty = this.orderQuantity();
    const cost = this.total();
    if (!quote || !this.canSubmit()) {
      return;
    }

    const payload: OrderDTO = {
      accountId: this.accountId(),
      instrumentId: quote.instrumentId,
      quantity: qty,
      stockPrice: quote.price,
      orderType: this.mode().toUpperCase() as 'BUY' | 'SELL'
    };

    this.submitting.set(true);
    this.result.set(null);
    this.orderService.placeOrder(this.accountId(), payload).subscribe({
      next: order => {
        this.submitting.set(false);
        this.filled.set(true);
        this.tradeExecuted.emit(order);
        const account = this.accountName();
        // Let the check mark land, then close and confirm with a toast.
        setTimeout(() => {
          this.toasts.show({
            kind: payload.orderType === 'BUY' ? 'buy' : 'sell',
            ticker: quote.symbol,
            title: `${payload.orderType === 'BUY' ? 'Bought' : 'Sold'} ${formatShares(qty)} ${quote.symbol}`,
            message: `${formatCurrency(cost)} at ${formatCurrency(quote.price)}${account ? ' · ' + account : ''}`,
          });
          if (this.target()?.ticker === quote.symbol) {
            this.requestClose();
          }
        }, 650);
      },
      error: err => {
        this.submitting.set(false);
        this.result.set({ kind: 'error', text: err?.error?.message ?? 'Failed to place order.' });
      }
    });
  }

  requestClose() {
    this.closed.emit();
  }

  // Clicks on the backdrop land on the <dialog> element itself; clicks inside land on its content.
  onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog()?.nativeElement) {
      this.requestClose();
    }
  }

  // Esc fires `cancel`; let the parent clear the target so state stays in one place.
  onCancel(event: Event) {
    event.preventDefault();
    this.requestClose();
  }

  private openFor() {
    this.mode.set('buy');
    this.quantity.set(null);
    this.dollarAmount.set(null);
    this.result.set(null);
    this.filled.set(false);
    this.reviewing.set(false);
    this.zoomInfo.set(null);
    if (this.clearShownTimer) {
      clearTimeout(this.clearShownTimer);
      this.clearShownTimer = null;
    }
    this.shown.set(this.target());

    const dialog = this.dialog()?.nativeElement;
    if (dialog && !dialog.open) {
      this.previousFocus = document.activeElement as HTMLElement | null;
      this.lockScroll();
      dialog.showModal();
    }
  }

  private closeDialog() {
    const dialog = this.dialog()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
      this.clearShownTimer = setTimeout(() => this.shown.set(null), MODAL_EXIT_MS);
    }
    this.unlockScroll();
    this.previousFocus?.focus();
    this.previousFocus = null;
  }

  private lockScroll() {
    if (!this.scrollLocked) {
      lockPageScroll();
      this.scrollLocked = true;
    }
  }

  private unlockScroll() {
    if (this.scrollLocked) {
      unlockPageScroll();
      this.scrollLocked = false;
    }
  }
}
