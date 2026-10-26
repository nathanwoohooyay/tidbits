import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { NotificationsService } from './notifications.service';

export type ExecutionType = 'MARKET' | 'LIMIT';

export interface OrderDTO {
  accountId: number;
  instrumentId: number;
  quantity: number;
  orderType: 'BUY' | 'SELL';
  executionType: ExecutionType;
  // Limit orders only.
  limitPrice?: number;
}

export interface instrumentDTO{
  instrumentId: number,
  ticker: string,
  name: string,
  type:string,
  exchange: string
}

export interface placedOrderDTO{
  orderId: number;
  quantity: number;
  // The fill price; null until the order fills.
  price: number | null;
  orderType: 'BUY' | 'SELL';
  status: string,
  instrument:instrumentDTO,
  statusHistory: statusHistoryDTO[],
  executionType: ExecutionType;
  limitPrice: number | null;
  // Cash set aside while a buy is pending.
  reservedAmount: number | null;
  createdAt: string | null;
  expiresAt: string | null;
}
export interface statusHistoryDTO {
  historyId: number,
  changedAt: string,
  oldStatus: string | null,
  newStatus: string
}

export type OrderHistoryEntryDTO = statusHistoryDTO;

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private readonly notifications = inject(NotificationsService);
  private readonly apiBase = '/api/accounts';
  private readonly apiBaseShort = '/api';

  // Callers confirm with their own toast, so the order's notifications don't toast again. A pending order (limit,
  // or queued for the open) is the exception: its fill comes later and is announced then.
  placeOrder(accountId: number, payload: OrderDTO): Observable<placedOrderDTO> {
    return this.http.post<placedOrderDTO>(`${this.apiBase}/${accountId}/orders`, payload).pipe(
      tap(order => order.status !== 'PENDING' && this.notifications.markAnnounced('order', order.orderId)),
    );
  }

  cancelOrder(accountId: number, orderId: number): Observable<placedOrderDTO> {
    this.notifications.markAnnounced('order', orderId);
    return this.http.post<placedOrderDTO>(`${this.apiBase}/${accountId}/orders/${orderId}/cancel`, {});
  }

  getOrder(accountId: number, orderId: number): Observable<placedOrderDTO> {
    return this.http.get<placedOrderDTO>(`${this.apiBase}/${accountId}/orders/${orderId}`);
  }

  getOrders(accountId: number): Observable<placedOrderDTO[]> {
    return this.http.get<placedOrderDTO[]>(`${this.apiBase}/${accountId}/orders`);
  }

  viewOrderHistory(orderId: number): Observable<OrderHistoryEntryDTO[]> {
    return this.http.get<OrderHistoryEntryDTO[]>(`${this.apiBaseShort}/orders/${orderId}/history`);
  }

}
