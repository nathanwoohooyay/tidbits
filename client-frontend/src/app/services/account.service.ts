import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { NotificationsService } from './notifications.service';

export interface AccountTransactionDto {
  transactionId: number;
  orderId: number | null;
  amount: number;
  transactionType: string;
}

export interface AccountDto {
  accountId: number;
  userId: number;
  nickname: string;
  cashBalance: number;
}

export interface AccountHoldingDto {
  holdingId: number;
  instrumentId: number;
  quantity: number;
  amountInvested: number;
}

export interface PortfolioSnapshotDto {
  snapshotId: number;
  accountId: number;
  totalValue: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationsService);
  private readonly userApiBase = '/api/users';
  private readonly accountApiBase = '/api/accounts';
  private readonly portfolioSnapshotApiBase = '/api/portfolio-snapshots';
  private readonly plainTextHeaders = new HttpHeaders({
    'Content-Type': 'text/plain'
  });

  listAccounts(userId: number): Observable<AccountDto[]> {
    return this.http.get<AccountDto[]>(`${this.userApiBase}/${userId}/accounts`);
  }

  getAccount(userId: number, accountId: number): Observable<AccountDto> {
    return this.http.get<AccountDto>(`${this.userApiBase}/${userId}/accounts/${accountId}`);
  }

  listHoldings(accountId: number): Observable<AccountHoldingDto[]> {
    return this.http.get<AccountHoldingDto[]>(`${this.accountApiBase}/${accountId}/holdings`);
  }

  listPortfolioSnapshotsByUser(userId: number): Observable<PortfolioSnapshotDto[]> {
    return this.http.get<PortfolioSnapshotDto[]>(`${this.portfolioSnapshotApiBase}/users/${userId}`);
  }

  listPortfolioSnapshotsByAccount(accountId: number): Observable<PortfolioSnapshotDto[]> {
    return this.http.get<PortfolioSnapshotDto[]>(`${this.portfolioSnapshotApiBase}/accounts/${accountId}`);
  }

  createAccount(userId: number, nickname: string): Observable<AccountDto> {
    return this.http.post<AccountDto>(`${this.userApiBase}/${userId}/accounts`, {"nickname":nickname});
  }

  updateAccount(userId: number, accountId: number, nickname: string): Observable<void> {
    return this.http
      .put(`${this.userApiBase}/${userId}/accounts/${accountId}`, {"nickname":nickname})
      .pipe(map(() => void 0));
  }

  deleteAccount(userId: number, accountId: number): Observable<void> {
    return this.http.delete<void>(`${this.userApiBase}/${userId}/accounts/${accountId}`);
  }

  // Callers confirm cash movements with their own toast, so the matching notifications don't toast again.
  depositCash(accountId: number, amount: number): Observable<AccountTransactionDto> {
    return this.http.post<AccountTransactionDto>(`${this.accountApiBase}/${accountId}/deposit`, amount).pipe(
      tap(tx => this.notifications.markAnnounced('transaction', tx?.transactionId)),
    );
  }

  withdrawCash(accountId: number, amount: number): Observable<AccountTransactionDto> {
    return this.http.post<AccountTransactionDto>(`${this.accountApiBase}/${accountId}/withdraw`, amount).pipe(
      tap(tx => this.notifications.markAnnounced('transaction', tx?.transactionId)),
    );
  }
}


