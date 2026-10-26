import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

export interface MarketStatusDto {
  open: boolean;
  // ISO instants. While open, nextOpen is the following session's open; while closed, nextClose is that session's close.
  nextOpen: string;
  nextClose: string;
}

const MARKET_TIME = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });
const MARKET_DAY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' });
const MARKET_DATE = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });

// US market session (9:30am-4:00pm New York, weekdays, NYSE holidays off), as the backend sees it.
@Injectable({ providedIn: 'root' })
export class MarketService {
  private readonly http = inject(HttpClient);

  status() {
    return queryOptions({
      queryKey: ['market-status'] as const,
      queryFn: () => lastValueFrom(this.http.get<MarketStatusDto>('/api/market/status')),
      staleTime: 60_000,
      refetchInterval: 60_000,
    });
  }
}

// "4:00 PM ET" today, or "Mon 9:30 AM ET" on another day (both in New York time).
export function formatMarketTime(iso: string, now = new Date()): string {
  const at = new Date(iso);
  const sameDay = MARKET_DATE.format(at) === MARKET_DATE.format(now);
  return `${sameDay ? '' : MARKET_DAY.format(at) + ' '}${MARKET_TIME.format(at)} ET`;
}
