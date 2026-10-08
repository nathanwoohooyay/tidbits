import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
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
      map((logs: any[]) => this.normalizeUserLogs(logs)),
      catchError(() => of(this.getMockUserLogs()))
    );
  }

  getTransactionLogs(): Observable<TransactionLog[]> {
    return this.http.get<TransactionLog[]>(`${this.baseUrl}/transactions`).pipe(
      catchError(() => of(this.getMockTransactionLogs()))
    );
  }

  private getMockUserLogs(): UserLog[] {
    return [
      { userLogId: 101, userId: 1, username: 'admin_root', action: 'USER_LOGIN', status: 'SUCCESS', ipAddress: '192.168.1.10', deviceInfo: 'Chrome / Windows', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
      { userLogId: 102, userId: 4, username: 'sarah_trader', action: 'CREATE_ORDER', status: 'SUCCESS', ipAddress: '10.0.4.82', deviceInfo: 'Firefox / macOS', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
      { userLogId: 103, userId: 9, username: 'alex_investor', action: 'PASSWORD_RESET_ATTEMPT', status: 'FAILURE', ipAddress: '185.220.101.4', deviceInfo: 'Python-requests', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { userLogId: 104, userId: 2, username: 'compliance_officer', action: 'ROLE_AUDIT_VIEW', status: 'SUCCESS', ipAddress: '192.168.1.15', deviceInfo: 'Edge / Windows', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
      { userLogId: 105, userId: 14, username: 'hedge_fund_llc', action: 'LARGE_ORDER_PLACED', status: 'SUCCESS', ipAddress: '172.16.2.99', deviceInfo: 'Tidbits FIX Gateway', timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString() },
      { userLogId: 106, userId: 22, username: 'guest_user', action: 'UNAUTHORIZED_ACCESS_REVOKED', status: 'FAILURE', ipAddress: '45.142.122.9', deviceInfo: 'Curl / Linux', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() }
    ];
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

  private getMockTransactionLogs(): TransactionLog[] {
    return [
      { logId: 501, accountId: 12, instrumentId: 1, ticker: 'AAPL', orderType: 'BUY', quantity: 500, price: 232.50, status: 'FILLED', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { logId: 502, accountId: 28, instrumentId: 3, ticker: 'NVDA', orderType: 'SELL', quantity: 1200, price: 139.80, status: 'FILLED', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
      { logId: 503, accountId: 45, instrumentId: 11, ticker: 'TSLA', orderType: 'BUY', quantity: 200, price: 268.00, status: 'FILLED', timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString() },
      { logId: 504, accountId: 12, instrumentId: 4, ticker: 'AMZN', orderType: 'BUY', quantity: 450, price: 186.20, status: 'FILLED', timestamp: new Date(Date.now() - 1000 * 60 * 54).toISOString() },
      { logId: 505, accountId: 88, instrumentId: 5, ticker: 'GOOGL', orderType: 'SELL', quantity: 800, price: 178.40, status: 'PENDING_APPROVAL', timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString() }
    ];
  }
}
