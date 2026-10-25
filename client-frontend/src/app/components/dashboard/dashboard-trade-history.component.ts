import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { formatCurrency, statusClass } from './dashboard.utils';
import { placedOrderDTO } from '../../services/order.service';
import { TickerLogoComponent } from './ticker-logo.component';
import { SkeletonRowsComponent } from '../skeleton-rows.component';

type SideFilter = 'ALL' | 'BUY' | 'SELL';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-dashboard-trade-history',
  standalone: true,
  imports: [CommonModule, TickerLogoComponent, SkeletonRowsComponent],
  templateUrl: './dashboard-trade-history.component.html'
})
export class DashboardTradeHistoryComponent {
  readonly formatCurrency = formatCurrency;
  readonly statusClass = statusClass;
  readonly sideFilters: Array<[SideFilter, string]> = [['ALL', 'All'], ['BUY', 'Buys'], ['SELL', 'Sells']];

  @Input() loading = false;

  ordersArray = signal<placedOrderDTO[]>([]);
  dateSortDirection = signal<'desc' | 'asc'>('desc');
  sideFilter = signal<SideFilter>('ALL');
  page = signal(0);
  expandedOrderId = signal<number | null>(null);

  @Input()
  set orders(value: placedOrderDTO[] | null) {
    this.ordersArray.set(value ?? []);
  }

  readonly filteredOrders = computed(() => {
    const side = this.sideFilter();
    const direction = this.dateSortDirection();
    return this.ordersArray()
      .filter(order => side === 'ALL' || order.orderType === side)
      .sort((a, b) => {
        const aTime = new Date(a.statusHistory?.[0]?.changedAt ?? 0).getTime();
        const bTime = new Date(b.statusHistory?.[0]?.changedAt ?? 0).getTime();
        return direction === 'desc' ? bTime - aTime : aTime - bTime;
      });
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredOrders().length / PAGE_SIZE)));
  // Clamp so a background refresh that shrinks the list never leaves an empty page showing.
  readonly currentPage = computed(() => Math.min(this.page(), this.pageCount() - 1));
  readonly pageOrders = computed(() => {
    const start = this.currentPage() * PAGE_SIZE;
    return this.filteredOrders().slice(start, start + PAGE_SIZE);
  });
  readonly rangeLabel = computed(() => {
    const total = this.filteredOrders().length;
    if (!total) {
      return '0 orders';
    }
    const start = this.currentPage() * PAGE_SIZE;
    return `${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}`;
  });

  setDateSort(direction: 'desc' | 'asc') {
    this.dateSortDirection.set(direction);
    this.page.set(0);
  }

  setSideFilter(side: SideFilter) {
    this.sideFilter.set(side);
    this.page.set(0);
  }

  goToPage(page: number) {
    this.page.set(Math.min(Math.max(page, 0), this.pageCount() - 1));
    this.expandedOrderId.set(null);
  }

  toggleOrderHistory(orderId: number) {
    this.expandedOrderId.update(current => (current === orderId ? null : orderId));
  }

  isOrderExpanded(orderId: number): boolean {
    return this.expandedOrderId() === orderId;
  }
}
