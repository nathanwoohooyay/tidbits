import { Injectable, inject } from '@angular/core';
import { QueryClient, queryOptions } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ChartPoint } from '../components/dashboard/dashboard.models';
import { tickerToName } from '../components/dashboard/stock';
import { AccountService, PortfolioSnapshotDto } from './account.service';
import { OrderService } from './order.service';
import { PricingService } from './pricing.service';
import { UserService } from './user.service';

// How often on-screen data refreshes in the background. Queries keep showing their last result while refetching.
export const REFRESH_INTERVAL_MS = 30_000;

export type CandleRange = '1M' | '3M' | '6M' | '1Y' | '5Y';

export interface HoldingDTO {
  holding_id: number;
  instrument_id: number;
  quantity: number;
  amount_invested: number;
  ticker: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  totalValue: number;
  changeValue: number;
  // Change in market value since the previous close (quantity × the quote's per-share change).
  dayChange: number;
}

const QUOTE_BATCH_SIZE = 25; // the pricing API's limit per request
const STOCK_TICKERS = Array.from(tickerToName.keys());

// Query definitions shared by every page, so the dashboard and overview read and refresh the same cache entries.
@Injectable({ providedIn: 'root' })
export class PortfolioQueries {
  private readonly queryClient = inject(QueryClient);
  private readonly accountApi = inject(AccountService);
  private readonly orderApi = inject(OrderService);
  private readonly pricingApi = inject(PricingService);
  private readonly userApi = inject(UserService);

  user(userId: number) {
    return queryOptions({
      queryKey: ['user', userId] as const,
      queryFn: () => lastValueFrom(this.userApi.getUser(userId)),
    });
  }

  accounts(userId: number) {
    return queryOptions({
      queryKey: ['accounts', userId] as const,
      queryFn: () => lastValueFrom(this.accountApi.listAccounts(userId)),
    });
  }

  orders(accountId: number) {
    return queryOptions({
      queryKey: ['account', accountId, 'orders'] as const,
      queryFn: () => lastValueFrom(this.orderApi.getOrders(accountId)),
    });
  }

  // Holdings priced at the latest quotes, fetched in one batch rather than one request per position.
  holdings(accountId: number) {
    return queryOptions({
      queryKey: ['account', accountId, 'holdings'] as const,
      queryFn: async (): Promise<HoldingDTO[]> => {
        const [holdings, orders] = await Promise.all([
          lastValueFrom(this.accountApi.listHoldings(accountId)),
          this.queryClient.fetchQuery(this.orders(accountId)),
        ]);
        const instrumentsById = new Map(orders.map(order => [order.instrument.instrumentId, order.instrument]));

        // Holdings created without an order (retired rewards) fall back to the ticker list's ordering.
        const named = holdings.flatMap(holding => {
          const instrument = instrumentsById.get(holding.instrumentId);
          const ticker = instrument?.ticker ?? STOCK_TICKERS[holding.instrumentId - 1];
          return ticker ? [{ holding, ticker, name: instrument?.name ?? tickerToName.get(ticker) ?? ticker }] : [];
        });

        const prices = await this.latestPrices([...new Set(named.map(item => item.ticker))]);
        return named.flatMap(({ holding, ticker, name }) => {
          const quote = prices.get(ticker);
          if (quote == null) {
            return [];
          }
          const price = quote.price;
          const totalValue = price * holding.quantity;
          const changeValue = totalValue - holding.amountInvested;
          return [{
            holding_id: holding.holdingId,
            instrument_id: holding.instrumentId,
            quantity: holding.quantity,
            amount_invested: holding.amountInvested,
            ticker,
            name,
            currentPrice: price,
            totalValue,
            changeValue,
            changePercent: holding.amountInvested > 0 ? (changeValue / holding.amountInvested) * 100 : 0,
            dayChange: (quote.change ?? 0) * holding.quantity,
          }];
        });
      },
    });
  }

  snapshots(scope: 'user' | 'account', id: number) {
    return queryOptions({
      queryKey: ['snapshots', scope, id] as const,
      queryFn: async () => aggregateSnapshotsByDay(await lastValueFrom(
        scope === 'user' ? this.accountApi.listPortfolioSnapshotsByUser(id) : this.accountApi.listPortfolioSnapshotsByAccount(id)
      )),
    });
  }

  // Every snapshot for the user's accounts, unaggregated. Pages derive views from it with `select`,
  // so the overview's total chart and per-account trend lines share one request.
  userSnapshotsRaw(userId: number) {
    return queryOptions({
      queryKey: ['snapshots', 'user-raw', userId] as const,
      queryFn: () => lastValueFrom(this.accountApi.listPortfolioSnapshotsByUser(userId)),
    });
  }

  quotes(symbols: string[]) {
    return queryOptions({
      queryKey: ['quotes', symbols.join(',')] as const,
      queryFn: async () => (await lastValueFrom(this.pricingApi.getQuotes(symbols.join(',')))).quotes ?? [],
    });
  }

  candles(symbol: string, range: CandleRange) {
    return queryOptions({
      queryKey: ['candles', symbol, range] as const,
      queryFn: () => lastValueFrom(this.pricingApi.getCandles(symbol, rangeStart(range))),
      // Daily candles only change once a day; avoid spending the API's daily quota on repeat views.
      staleTime: 60 * 60 * 1000,
    });
  }

  // After a trade or cash movement: refresh the account's cash, positions, orders and history.
  invalidateAccount(userId: number, accountId: number) {
    void this.queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
    void this.queryClient.invalidateQueries({ queryKey: ['account', accountId] });
    void this.queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    void this.queryClient.invalidateQueries({ queryKey: ['overview', userId] });
  }

  private async latestPrices(tickers: string[]): Promise<Map<string, { price: number; change: number }>> {
    const batches = [];
    for (let i = 0; i < tickers.length; i += QUOTE_BATCH_SIZE) {
      batches.push(tickers.slice(i, i + QUOTE_BATCH_SIZE));
    }
    const responses = await Promise.all(batches.map(batch => lastValueFrom(this.pricingApi.getQuotes(batch.join(',')))));
    return new Map(responses.flatMap(r => r.quotes ?? [])
      .filter(quote => quote.symbol && quote.price != null)
      .map(quote => [quote.symbol.toUpperCase(), { price: quote.price, change: Number(quote.change ?? 0) }] as [string, { price: number; change: number }]));
  }
}

export function rangeStart(range: CandleRange): string {
  const start = new Date();
  switch (range) {
    case '1M': start.setMonth(start.getMonth() - 1); break;
    case '3M': start.setMonth(start.getMonth() - 3); break;
    case '6M': start.setMonth(start.getMonth() - 6); break;
    case '1Y': start.setFullYear(start.getFullYear() - 1); break;
    case '5Y': start.setFullYear(start.getFullYear() - 5); break;
  }
  return start.toISOString().slice(0, 10);
}

// One point per day: each account's latest snapshot that day, summed across accounts.
export function aggregateSnapshotsByDay(snapshots: PortfolioSnapshotDto[]): ChartPoint[] {
  const latestByAccountDay = new Map<string, PortfolioSnapshotDto>();
  for (const snapshot of snapshots) {
    const day = snapshot.createdAt?.slice(0, 10);
    if (!day || !Number.isFinite(snapshot.totalValue)) {
      continue;
    }
    const key = `${snapshot.accountId}:${day}`;
    const current = latestByAccountDay.get(key);
    if (!current || snapshot.createdAt > current.createdAt) {
      latestByAccountDay.set(key, snapshot);
    }
  }

  const totalsByDay = new Map<string, number>();
  for (const snapshot of latestByAccountDay.values()) {
    const day = snapshot.createdAt.slice(0, 10);
    totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + snapshot.totalValue);
  }

  return Array.from(totalsByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, total]) => ({ date: `${day}T00:00:00`, value: Number(total.toFixed(2)) }));
}

// Each account's daily values (latest snapshot per day) over the last `days` days, oldest first.
export function snapshotSeriesByAccount(snapshots: PortfolioSnapshotDto[], days = 30): Map<number, number[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDay = cutoff.toISOString().slice(0, 10);

  const latest = new Map<string, PortfolioSnapshotDto>();
  for (const snapshot of snapshots) {
    const day = snapshot.createdAt?.slice(0, 10);
    if (!day || day < cutoffDay || !Number.isFinite(snapshot.totalValue)) {
      continue;
    }
    const key = `${snapshot.accountId}:${day}`;
    const current = latest.get(key);
    if (!current || snapshot.createdAt > current.createdAt) {
      latest.set(key, snapshot);
    }
  }

  const series = new Map<number, Array<[string, number]>>();
  for (const snapshot of latest.values()) {
    const list = series.get(snapshot.accountId) ?? [];
    list.push([snapshot.createdAt.slice(0, 10), snapshot.totalValue]);
    series.set(snapshot.accountId, list);
  }
  return new Map([...series].map(([id, points]) => [id, points.sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)]));
}
