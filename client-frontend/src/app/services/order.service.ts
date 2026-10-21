import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderDTO {
  accountId: number;
  instrumentId: number;
  quantity: number;
  stockPrice: number;
  orderType: 'BUY' | 'SELL';
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
  price: number;
  orderType: 'BUY' | 'SELL';
  status: string,
  instrument:instrumentDTO,
  statusHistory: statusHistoryDTO[]

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
  private readonly apiBase = '/api/accounts';
  private readonly apiBaseShort = '/api';

  placeOrder(accountId: number, payload: OrderDTO): Observable<placedOrderDTO> {
    return this.http.post<placedOrderDTO>(`${this.apiBase}/${accountId}/orders`, payload);
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
