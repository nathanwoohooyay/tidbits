import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserLog, TransactionLog } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly baseUrl = `${environment.auditApiUrl}/logs`;

  constructor(private http: HttpClient) {}

  getUserLogs(): Observable<UserLog[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`).pipe(
      map((logs: any[]) => this.normalizeUserLogs(logs))
    );
  }

  getTransactionLogs(): Observable<TransactionLog[]> {
    return this.http.get<any[]>(`${this.baseUrl}/transactions`).pipe(
      map((logs: any[]) => this.normalizeTransactionLogs(logs))
    );
  }

  private normalizeUserLogs(logs: any[]): UserLog[] {
    if (!Array.isArray(logs)) {
      return [];
    }

    return logs
      .map((log) => {
        const timestamp = log.timestamp || log.happenedAt || '';
        return {
          userLogId: Number(log.userLogId ?? log.logId ?? 0),
          userId: Number(log.userId ?? 0),
          username: log.username,
          action: String(log.action ?? log.event ?? ''),
          status: String(log.status ?? 'UNKNOWN'),
          ipAddress: log.ipAddress,
          deviceInfo: log.deviceInfo,
          timestamp
        };
      })
      .sort((a, b) => {
        const left = Date.parse(a.timestamp || '');
        const right = Date.parse(b.timestamp || '');
        return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
      });
  }

  private normalizeTransactionLogs(logs: any[]): TransactionLog[] {
    if (!Array.isArray(logs)) {
      return [];
    }

    return logs
      .map((log) => {
        const timestamp = log.timestamp || log.happenedAt || '';
        const event = String(log.event ?? '').toUpperCase();
        const orderType = String(log.orderType ?? '').toUpperCase();
        const status = String(log.status ?? 'UNKNOWN').toUpperCase();
        const price = Number(log.price ?? log.stockPrice ?? 0);
        const quantity = Number(log.quantity ?? 0);
        const amount = log.amount == null ? undefined : Number(log.amount);

        return {
          logId: Number(log.logId ?? 0),
          accountId: Number(log.accountId ?? 0),
          instrumentId: Number(log.instrumentId ?? 0),
          transactionId: log.transactionId == null ? undefined : Number(log.transactionId),
          orderId: log.orderId == null ? undefined : Number(log.orderId),
          orderType: orderType || event,
          event: event || undefined,
          quantity,
          price,
          stockPrice: log.stockPrice == null ? undefined : Number(log.stockPrice),
          amount,
          status,
          timestamp,
          happenedAt: log.happenedAt
        } as TransactionLog;
      })
      .sort((a, b) => {
        const left = Date.parse(a.timestamp || a.happenedAt || '');
        const right = Date.parse(b.timestamp || b.happenedAt || '');
        return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
      });
  }
}
