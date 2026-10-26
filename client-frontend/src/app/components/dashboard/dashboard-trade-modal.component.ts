import { CommonModule } from '@angular/common';
import {
  Component, ElementRef, OnDestroy, computed, effect, inject, input, output, signal, untracked, viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ExecutionType, OrderDTO, OrderService, placedOrderDTO } from '../../services/order.service';
import { MarketService, formatMarketTime } from '../../services/market.service';
import { PricingCandlesResponseDTO } from '../../services/pricing.service';
import { CandleRange, PortfolioQueries, REFRESH_INTERVAL_MS, rangeStart } from '../../services/portfolio-queries';
import { TradeMode, TradeTarget } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';
import { isCrypto } from './stock';
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
  private readonly market = inject(MarketService);
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
  // Market fills at the current price (at the next open while the market is closed); limit waits for a price.
  readonly orderKind = signal<'market' | 'limit'>('market');
  readonly limitPrice = signal<number | null>(null);
  readonly quantity = signal<number | null>(null);
  // Orders can be entered as a share count or a dollar amount; dollar amounts become fractional shares.
  readonly inputMode = signal<'shares' | 'dollars'>('shares');
  readonly dollarAmount = signal<number | null>(null);
  readonly range = signal<CandleRange>('3M');
  readonly chartMode = signal<StockChartMode>('line');
  readonly submitting = signal(false);
  // The submit button shows a check for a moment after a fill, then the window closes and a toast confirms.
  readonly filled = signal(false);
  // The order was accepted but waits to fill (a limit order, or a market order queued for the open).
  readonly placedPending = signal(false);
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
      return { date: (filledAt ?? '').slice(0, 10), side: o.orderType, quantity: o.quantity, price: o.price ?? 0 };
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

  private readonly marketQuery = injectQuery(() => ({
    ...this.market.status(),
    enabled: !!this.ticker() && !isCrypto(this.ticker()),
  }));
  // Coins trade around the clock; stocks and ETFs during the US session.
  readonly crypto = computed(() => isCrypto(this.ticker()));
  // Quantity unit after a number: "sh" for shares, the ticker for coins ("0.25 BTC").
  readonly unit = computed(() => this.crypto() ? this.ticker() : 'sh');
  // Treated as open until the status arrives, so the window doesn't flash a "closed" notice.
  readonly marketOpen = computed(() => this.crypto() || (this.marketQuery.data()?.open ?? true));
  readonly marketLabel = computed(() => {
    if (this.crypto()) {
      return 'Crypto trades 24/7';
    }
    const status = this.marketQuery.data();
    if (!status) {
      return '';
    }
    return status.open ? `Market open · closes ${formatMarketTime(status.nextClose)}` : `Market closed · opens ${formatMarketTime(status.nextOpen)}`;
  });
  readonly nextOpenLabel = computed(() => {
    const status = this.marketQuery.data();
    return status ? formatMarketTime(status.nextOpen) : 'the next open';
  });
  readonly queuedForOpen = computed(() => this.orderKind() === 'market' && !this.marketOpen());
  // Unfilled limit orders are cancelled after 90 days (matches the backend).
  readonly limitExpires = computed(() => new Date(Date.now() + 90 * 86_400_000));

  // Cash already set aside by this account's pending buys, and shares promised to its pending sells of this stock.
  readonly reservedCash = computed(() => (this.ordersQuery.data() ?? [])
    .filter(o => o.status === 'PENDING' && o.orderType === 'BUY')
    .reduce((sum, o) => sum + (o.reservedAmount ?? 0), 0));
  readonly reservedShares = computed(() => (this.ordersQuery.data() ?? [])
    .filter(o => o.status === 'PENDING' && o.orderType === 'SELL' && o.instrument?.ticker === this.ticker())
    .reduce((sum, o) => sum + o.quantity, 0));
  readonly availableCash = computed(() => Math.max(0, Math.round((this.cashBalance() - this.reservedCash()) * 100) / 100));
  readonly availableShares = computed(() => Math.max(0, this.ownedQuantity() - this.reservedShares()));

  // What the order is sized and costed at: its limit, or the latest quote for a market order.
  readonly refPrice = computed(() => this.orderKind() === 'limit' ? this.limitPrice() ?? 0 : this.quote()?.price ?? 0);
  // Nudges for limits the market has already passed: they'll fill straight away, at the market price.
  readonly limitHint = computed(() => {
    const q = this.quote();
    const limit = this.limitPrice() ?? 0;
    if (this.orderKind() !== 'limit' || !q || limit <= 0) {
      return '';
    }
    const passed = this.mode() === 'buy' ? limit >= (q.ask || q.price) : limit <= (q.bid || q.price);
    if (!passed) {
      return this.mode() === 'buy'
        ? `Fills only if ${q.symbol} drops to ${formatCurrency(limit)} or lower.`
        : `Fills only if ${q.symbol} rises to ${formatCurrency(limit)} or higher.`;
    }
    return this.marketOpen()
      ? `The current price already meets this limit, so it should fill within a minute, at the current price.`
      : `The current price already meets this limit, so it should fill soon after the open.`;
  });

  // Shares actually sent with the order. Dollar amounts round down to the 4 decimal places the backend stores,
  // so a buy never costs more than the amount typed; selling at least the position's value sells all of it.
  readonly orderQuantity = computed(() => {
    if (this.inputMode() === 'shares') {
      return this.quantity() ?? 0;
    }
    const price = this.refPrice();
    const amount = this.dollarAmount() ?? 0;
    if (price <= 0 || amount <= 0) {
      return 0;
    }
    // Compare against the cent-rounded position value (what Max fills in) so "sell everything" leaves no sliver.
    if (this.mode() === 'sell' && amount >= Math.floor(this.availableShares() * price * 100) / 100) {
      return this.availableShares();
    }
    return Math.floor((amount / price) * 10_000) / 10_000;
  });
  // Rounded down to the cent, as the backend does when it charges or credits the order (and sets cash aside).
  // For a limit order it's the most a buy can cost, or the least a sell can raise.
  readonly total = computed(() => Math.floor(this.orderQuantity() * this.refPrice() * 100 + 1e-6) / 100);
  readonly maxQuantity = computed(() => {
    const price = this.refPrice();
    if (this.mode() === 'sell') {
      return this.availableShares();
    }
    if (price <= 0) {
      return 0;
    }
    // Coins come in fractions (to 4 places); shares are bought whole here.
    return this.crypto() ? Math.floor((this.availableCash() / price) * 10_000) / 10_000 : Math.floor(this.availableCash() / price);
  });
  // Largest dollar amount for the current side: all available cash, or the whole position's value.
  readonly maxDollars = computed(() => {
    const price = this.refPrice();
    return this.mode() === 'sell' ? Math.floor(this.availableShares() * price * 100) / 100 : Math.floor(this.availableCash() * 100) / 100;
  });
  readonly validationMessage = computed(() => {
    if (this.inputMode() === 'dollars' && (this.dollarAmount() ?? 0) > 0 && this.orderQuantity() <= 0) {
      return 'That amount is less than the smallest tradable fraction (0.0001 shares).';
    }
    const qty = this.orderQuantity();
    if (this.orderKind() === 'limit' && (this.quantity() ?? 0) > 0 && !((this.limitPrice() ?? 0) > 0)) {
      return 'Enter a limit price.';
    }
    if (!this.quote() || qty <= 0) {
      return '';
    }
    if (this.mode() === 'buy' && this.total() > this.availableCash()) {
      return this.reservedCash() > 0
        ? `Not enough cash: this order needs ${formatCurrency(this.total())} and ${formatCurrency(this.availableCash())} is available (${formatCurrency(this.reservedCash())} is set aside for open orders).`
        : `Not enough cash: this order needs ${formatCurrency(this.total())}.`;
    }
    if (this.mode() === 'sell' && qty > this.availableShares()) {
      const shares = formatShares(this.availableShares());
      return this.reservedShares() > 0
        ? `You can sell up to ${shares} share${this.availableShares() === 1 ? '' : 's'}; ${formatShares(this.reservedShares())} are already in open sell orders.`
        : `You only own ${shares} share${this.availableShares() === 1 ? '' : 's'}.`;
    }
    return '';
  });
  // What the account looks like once the order fills (at the current price, or at its limit).
  readonly cashAfter = computed(() => this.mode() === 'buy' ? this.availableCash() - this.total() : this.availableCash() + this.total());
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
      && !this.filled() && this.accountId() > 0 && (this.orderKind() === 'market' || (this.limitPrice() ?? 0) > 0)
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

  // Switching to a limit starts it at the current price, rounded to the cent.
  setOrderKind(kind: 'market' | 'limit') {
    if (kind === 'limit' && this.limitPrice() == null && this.quote()?.price) {
      this.limitPrice.set(Math.round(this.quote()!.price * 100) / 100);
    }
    this.orderKind.set(kind);
    this.reviewing.set(false);
    this.result.set(null);
  }

  setLimitPrice(value: number | null) {
    this.limitPrice.set(value);
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
    const price = this.refPrice();
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

    const executionType: ExecutionType = this.orderKind() === 'limit' ? 'LIMIT' : 'MARKET';
    const limit = this.limitPrice() ?? 0;
    const payload: OrderDTO = {
      accountId: this.accountId(),
      instrumentId: quote.instrumentId,
      quantity: qty,
      orderType: this.mode().toUpperCase() as 'BUY' | 'SELL',
      executionType,
      ...(executionType === 'LIMIT' ? { limitPrice: limit } : {}),
    };

    this.submitting.set(true);
    this.result.set(null);
    this.orderService.placeOrder(this.accountId(), payload).subscribe({
      next: order => {
        const pending = order.status === 'PENDING';
        this.submitting.set(false);
        this.placedPending.set(pending);
        this.filled.set(true);
        this.tradeExecuted.emit(order);
        const account = this.accountName();
        const side = payload.orderType === 'BUY' ? 'buy' : 'sell';
        // Let the check mark land, then close and confirm with a toast. A waiting order gets a plain confirmation;
        // its fill is announced by a notification later.
        setTimeout(() => {
          this.toasts.show(pending
            ? {
              kind: 'success',
              title: executionType === 'LIMIT'
                ? `Limit ${side} placed: ${formatShares(qty)} ${quote.symbol}`
                : `Queued for the open: ${side} ${formatShares(qty)} ${quote.symbol}`,
              message: (executionType === 'LIMIT'
                ? `Fills at ${formatCurrency(limit)} or ${side === 'buy' ? 'lower' : 'higher'}`
                : `Fills when the market opens, ${this.nextOpenLabel()}`) + (account ? ' · ' + account : ''),
            }
            : {
              kind: side,
              ticker: quote.symbol,
              title: `${side === 'buy' ? 'Bought' : 'Sold'} ${formatShares(qty)} ${quote.symbol}`,
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
    this.orderKind.set('market');
    this.limitPrice.set(null);
    this.placedPending.set(false);
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
