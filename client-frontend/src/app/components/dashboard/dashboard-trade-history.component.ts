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
  orderHistoryLoading = signal(false);
  orderHistoryError = signal('');
  private readonly orderService = inject(OrderService);

  ngOnInit() {
    this.orderHistoryLoading.set(true);
    this.orderHistoryError.set('');


  }
loadHistory(accountId: number){
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
