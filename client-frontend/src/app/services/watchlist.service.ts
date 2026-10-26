import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { QueryClient, queryOptions } from '@tanstack/angular-query-experimental';
import { Observable, lastValueFrom } from 'rxjs';
import { SessionService } from './session.service';
import { ToastService } from './toast.service';

export interface WatchlistItemDto {
  ticker: string;
  // The instrument's name when the stock is in the instruments table; otherwise null.
  name: string | null;
  addedAt: string;
}

// The signed-in user's watchlist: stocks they follow on the dashboard. Adding and removing update the cached list
// straight away and roll back if the server refuses.
@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  private readonly session = inject(SessionService);
  private readonly toasts = inject(ToastService);
  private readonly userApiBase = '/api/users';

  list(userId: number) {
    return queryOptions({
      queryKey: ['watchlist', userId] as const,
      queryFn: () => lastValueFrom(this.http.get<WatchlistItemDto[]>(`${this.userApiBase}/${userId}/watchlist`)),
    });
  }

  userId(): number {
    return this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId() ?? 0;
  }

  async toggle(ticker: string, name?: string | null) {
    const userId = this.userId();
    if (!userId) {
      return;
    }
    const key = this.list(userId).queryKey;
    const before = this.queryClient.getQueryData<WatchlistItemDto[]>(key) ?? [];
    const watching = before.some(item => item.ticker === ticker);
    this.queryClient.setQueryData<WatchlistItemDto[]>(key, watching
      ? before.filter(item => item.ticker !== ticker)
      : [...before, { ticker, name: name ?? null, addedAt: new Date().toISOString() }]);

    try {
      if (watching) {
        await lastValueFrom(this.remove(userId, ticker));
      } else {
        await lastValueFrom(this.add(userId, ticker));
      }
      this.toasts.show({
        kind: 'success',
        title: watching ? `Removed ${ticker} from your watchlist` : `Added ${ticker} to your watchlist`,
        message: watching ? undefined : 'Follow it under Holdings on the dashboard.',
      }, 3500);
    } catch (err) {
      this.queryClient.setQueryData(key, before);
      const e = err as { error?: { message?: string; error?: string } };
      this.toasts.show({ kind: 'error', title: 'Watchlist not updated', message: e?.error?.message ?? e?.error?.error ?? 'Please try again.' });
    } finally {
      void this.queryClient.invalidateQueries({ queryKey: key });
    }
  }

  private add(userId: number, ticker: string): Observable<WatchlistItemDto> {
    return this.http.post<WatchlistItemDto>(`${this.userApiBase}/${userId}/watchlist`, { ticker });
  }

  private remove(userId: number, ticker: string): Observable<void> {
    return this.http.delete<void>(`${this.userApiBase}/${userId}/watchlist/${encodeURIComponent(ticker)}`);
  }
}
