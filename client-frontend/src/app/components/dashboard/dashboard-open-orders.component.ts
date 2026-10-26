import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { placedOrderDTO } from '../../services/order.service';
import { TickerLogoComponent } from './ticker-logo.component';
import { formatCurrency, serverTime } from './dashboard.utils';
import { quantityUnit } from './stock';

// Orders waiting to fill: limit orders, and market orders placed while the market was closed. Shown above the trade
// history only while there are some; each can be cancelled, which releases the cash or shares set aside for it.
@Component({
  selector: 'app-dashboard-open-orders',
  standalone: true,
  imports: [CommonModule, TickerLogoComponent],
  template: `
    @if (pending().length) {
      <section class="section-card open-orders" aria-label="Open orders">
        <div class="section-header">
          <span class="section-title">
            Open orders
            <span class="section-meta">{{ pending().length }}</span>
          </span>
          @if (reservedCash() > 0) {
            <span class="section-meta">{{ formatCurrency(reservedCash()) }} set aside</span>
          }
        </div>
        <ul class="open-order-list">
          @for (order of pending(); track order.orderId) {
            <li class="open-order">
              <app-ticker-logo [ticker]="order.instrument.ticker" style="--logo-size: 1.6rem"></app-ticker-logo>
              <div class="instrument-cell">
                <span class="ticker-badge">{{ order.instrument.ticker }}</span>
                <span class="stock-name">{{ order.instrument.name }}</span>
              </div>
              <div class="open-order-terms">
                <span class="order-type-badge" [class.buy]="order.orderType === 'BUY'" [class.sell]="order.orderType === 'SELL'">{{ order.orderType }}</span>
                <span class="open-order-qty">{{ order.quantity | number:'1.0-4' }} {{ quantityUnit(order.instrument.ticker) }}</span>
                <span class="open-order-price">
                  @if (order.executionType === 'LIMIT') {
                    limit {{ formatCurrency(order.limitPrice ?? 0) }}
                  } @else {
                    at the open
                  }
                </span>
              </div>
              <div class="open-order-meta">
                <span>
                  @if (order.expiresAt) {
                    Good until {{ serverTime(order.expiresAt) | date:'MMM d' }}
                  } @else {
                    Fills at the next open
                  }
                  @if (order.reservedAmount) {
                    · {{ formatCurrency(order.reservedAmount) }} set aside
                  }
                </span>
                @if (order.createdAt) {
                  <span>Placed {{ serverTime(order.createdAt) | date:'MMM d, h:mm a' }}</span>
                }
              </div>
              <button type="button" class="btn-trade open-order-cancel" (click)="cancel.emit(order)"
                      [disabled]="cancellingId() === order.orderId" [attr.aria-busy]="cancellingId() === order.orderId"
                      [attr.aria-label]="'Cancel ' + order.orderType.toLowerCase() + ' order for ' + order.instrument.ticker">
                {{ cancellingId() === order.orderId ? 'Cancelling…' : 'Cancel' }}
              </button>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .open-orders {
      margin-bottom: 2.5rem;
    }

    .open-order-list {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .open-order {
      display: grid;
      grid-template-columns: auto minmax(8rem, 1fr) minmax(0, 1.4fr) minmax(0, 1.4fr) auto;
      align-items: center;
      gap: .875rem;
      padding: .75rem 0;
    }

    .open-order + .open-order {
      border-top: 1px solid var(--clr-hairline);
    }

    .open-order-terms {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: .5rem;
      font-size: .86rem;
      font-variant-numeric: tabular-nums;
      color: var(--clr-espresso);
    }

    .open-order-price {
      color: var(--clr-sienna);
    }

    .open-order-meta {
      display: grid;
      gap: .1rem;
      font-size: .76rem;
      color: var(--clr-sienna);
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 720px) {
      .open-order {
        grid-template-columns: auto minmax(0, 1fr) auto;
        row-gap: .35rem;
      }

      .open-order-terms,
      .open-order-meta {
        grid-column: 2 / 3;
      }

      .open-order-cancel {
        grid-column: 3;
        grid-row: 1;
      }
    }
  `]
})
export class DashboardOpenOrdersComponent {
  readonly orders = input<placedOrderDTO[]>([]);
  readonly cancellingId = input<number | null>(null);
  readonly cancel = output<placedOrderDTO>();

  readonly formatCurrency = formatCurrency;
  readonly serverTime = serverTime;
  readonly quantityUnit = quantityUnit;

  // Newest first.
  readonly pending = computed(() => this.orders()
    .filter(order => order.status === 'PENDING')
    .sort((a, b) => (serverTime(b.createdAt)?.getTime() ?? 0) - (serverTime(a.createdAt)?.getTime() ?? 0)));
  readonly reservedCash = computed(() => this.pending().reduce((sum, order) => sum + (order.reservedAmount ?? 0), 0));
}
