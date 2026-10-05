import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Order } from './dashboard.models';
import { formatCurrency, statusClass } from './dashboard.utils';

@Component({
  selector: 'app-dashboard-trade-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-trade-history.component.html'
})
export class DashboardTradeHistoryComponent {
  @Input() orders: Order[] = [];

  readonly formatCurrency = formatCurrency;
  readonly statusClass = statusClass;
}


