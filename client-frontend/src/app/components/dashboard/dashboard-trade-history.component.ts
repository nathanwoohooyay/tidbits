import { CommonModule } from '@angular/common';
import {Component, inject, Input, OnInit, signal} from '@angular/core';
import { Order } from './dashboard.models';
import { formatCurrency, statusClass } from './dashboard.utils';
import {OrderService, placedOrderDTO} from '../../services/order.service';

@Component({
  selector: 'app-dashboard-trade-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-trade-history.component.html'
})
export class DashboardTradeHistoryComponent implements OnInit{
  @Input() orders: Order[] = [];

  readonly formatCurrency = formatCurrency;
  readonly statusClass = statusClass;

  private _selectedAccountId: number | null = null;

  @Input()
  set selectedAccountId(value: number | null) {
    this._selectedAccountId = value;
    if (value != null && value > 0) {
      this.loadHistory(value);
    }
  }

  get selectedAccountId(): number | null {
    return this._selectedAccountId;
  }

  ordersArray = signal<placedOrderDTO[]>([]);
  dateSortDirection = signal<'desc' | 'asc'>('desc');
  expandedOrderId = signal<number | null>(null);
  orderHistoryLoading = signal(false);
  orderHistoryError = signal('');
  private readonly orderService = inject(OrderService);

  ngOnInit() {
    this.orderHistoryLoading.set(true);
    this.orderHistoryError.set('');


  }

  setDateSort(direction: 'desc' | 'asc') {
    this.dateSortDirection.set(direction);
  }

  toggleOrderHistory(orderId: number) {
    this.expandedOrderId.update(current => (current === orderId ? null : orderId));
  }

  isOrderExpanded(orderId: number): boolean {
    return this.expandedOrderId() === orderId;
  }

  sortedOrders(): placedOrderDTO[] {
    const direction = this.dateSortDirection();

    return [...this.ordersArray()].sort((a, b) => {
      const aTime = new Date(a.statusHistory?.[0]?.changedAt ?? 0).getTime();
      const bTime = new Date(b.statusHistory?.[0]?.changedAt ?? 0).getTime();
      return direction === 'desc' ? bTime - aTime : aTime - bTime;
    });
  }

loadHistory(accountId: number){
    this.orderHistoryLoading.set(true);
    this.ordersArray.set([]);
    this.expandedOrderId.set(null);
      this.orderService.getOrders(accountId).subscribe({
        next: ordersArray => {
          console.log(ordersArray);
          this.ordersArray.set(ordersArray);
          this.orderHistoryLoading.set(false);
        },
        error: err => {
          this.orderHistoryError.set(err?.error?.message ?? 'Failed to load orders.');
          this.ordersArray.set([]);
          this.orderHistoryLoading.set(false);
        }
      });
    }
}
