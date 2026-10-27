import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserLog, TransactionLog, PointsLog } from '../models/models';

// "Chrome on macOS" from a User-Agent header, matching the client app's session list. Undefined when the event has
// no user agent (events recorded before it was captured, or calls that didn't come from a browser).
export function describeDevice(userAgent: string | null | undefined): string | undefined {
  if (!userAgent) {
    return undefined;
  }
  const ua = userAgent;
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) && /Version\//.test(ua) ? 'Safari'
    : null;
  const os = /iPhone/.test(ua) ? 'iOS'
    : /iPad/.test(ua) ? 'iPadOS'
    : /Android/.test(ua) ? 'Android'
    : /CrOS/.test(ua) ? 'ChromeOS'
    : /Windows NT/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : null;
  return browser && os ? `${browser} on ${os}` : browser ?? os ?? 'Unknown device';
}

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

  getPointsLogs(): Observable<PointsLog[]> {
    return this.http.get<any[]>(`${this.baseUrl}/points`).pipe(
      map((logs: any[]) => this.normalizePointsLogs(logs))
    );
  }

  private normalizePointsLogs(logs: any[]): PointsLog[] {
    if (!Array.isArray(logs)) {
      return [];
    }

    const optionalNumber = (value: any) => (value == null ? undefined : Number(value));

    return logs
      .map((log) => ({
        logId: Number(log.logId ?? 0),
        userId: Number(log.userId ?? 0),
        username: log.username || undefined,
        accountId: optionalNumber(log.accountId),
        pointsTransactionId: optionalNumber(log.pointsTransactionId),
        event: String(log.event ?? '').toUpperCase(),
        pointsDelta: Number(log.pointsDelta ?? 0),
        balanceAfter: optionalNumber(log.balanceAfter),
        cashValue: optionalNumber(log.cashValue),
        instrumentId: optionalNumber(log.instrumentId),
        ticker: log.ticker || undefined,
        quantity: optionalNumber(log.quantity),
        referenceId: optionalNumber(log.referenceId),
        details: log.details || undefined,
        status: String(log.status ?? 'UNKNOWN').toUpperCase(),
        timestamp: log.timestamp || log.happenedAt || ''
      }))
      .sort((a, b) => {
        const left = Date.parse(a.timestamp || '');
        const right = Date.parse(b.timestamp || '');
        return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
      });
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
          deviceInfo: describeDevice(log.userAgent),
          userAgent: log.userAgent || undefined,
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
          userId: log.userId == null ? undefined : Number(log.userId),
          accountId: Number(log.accountId ?? 0),
          instrumentId: Number(log.instrumentId ?? 0),
          ticker: log.ticker,
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
