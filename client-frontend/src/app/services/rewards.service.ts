import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PointsEventType =
  | 'EARN_TRADE'
  | 'CASH_OUT'
  // Retired; still appear in older history.
  | 'STOCK_DROP'
  | 'STOCK_PACK'
  | 'LOTTERY_TICKET'
  | 'LOTTERY_WIN'
  | 'SCRATCH_CARD'
  | 'SCRATCH_WIN';

export interface LotteryDrawDto {
  drawId: number;
  status: 'OPEN' | 'DRAWN';
  ticketPrice: number;
  potPoints: number;
  potCashValue: number;
  ticketsSold: number;
  myTickets: number;
  closesAt: string;
  drawnAt: string | null;
  winnerLabel: string | null;
  wonByMe: boolean;
  /** Null for legacy points-pot draws. */
  prizeCode: string | null;
  prizeName: string | null;
  prizeDescription: string | null;
  fulfillmentStatus: string | null;
}

export interface RewardsSummaryDto {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  maxTicketsPerPurchase: number;
  /** One open draw per prize. */
  draws: LotteryDrawDto[];
  /** Most recent result for each prize. */
  lastDraws: LotteryDrawDto[];
}

export interface PointsTransactionDto {
  pointsTransactionId: number;
  eventType: PointsEventType;
  pointsDelta: number;
  balanceAfter: number;
  accountId: number | null;
  cashValue: number | null;
  instrumentId: number | null;
  ticker: string | null;
  quantity: number | null;
  referenceId: number | null;
  details: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class RewardsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api/users';

  getSummary(userId: number): Observable<RewardsSummaryDto> {
    return this.http.get<RewardsSummaryDto>(`${this.apiBase}/${userId}/rewards`);
  }

  getTransactions(userId: number): Observable<PointsTransactionDto[]> {
    return this.http.get<PointsTransactionDto[]>(`${this.apiBase}/${userId}/rewards/transactions`);
  }

  buyLotteryTickets(userId: number, drawId: number, quantity: number): Observable<PointsTransactionDto> {
    return this.http.post<PointsTransactionDto>(`${this.apiBase}/${userId}/rewards/lottery/tickets`, { drawId, quantity });
  }

}
