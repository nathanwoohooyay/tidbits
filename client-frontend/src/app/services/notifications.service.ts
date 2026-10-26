import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { QueryClient, queryOptions } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ToastKind, ToastService } from './toast.service';

export type NotificationCategory = 'ORDER' | 'CASH';

export interface NotificationDto {
  notificationId: number;
  category: NotificationCategory;
  title: string;
  message: string | null;
  accountId: number | null;
  orderId: number | null;
  transactionId: number | null;
  ticker: string | null;
  createdAt: string;
  read: boolean;
}

export interface NotificationListDto {
  unreadCount: number;
  items: NotificationDto[];
}

// How often the sidebar checks for new notifications while signed in.
export const NOTIFICATION_POLL_MS = 30_000;
// A toast the app already showed for an order or transfer stands in for its notification for this long.
const ANNOUNCED_FOR_MS = 2 * 60_000;

// The user's notifications (orders filling, cash moving). The sidebar polls the list; anything new since the last
// look pops a toast, unless the app already announced it (the trade window's own "Bought..." toast, say), and
// refreshes account data, since a limit order may have filled in the background.
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  private readonly toasts = inject(ToastService);
  private readonly userApiBase = '/api/users';

  private readonly newestSeen = new Map<number, number>();
  private readonly announced = new Map<string, number>();

  list(userId: number) {
    return queryOptions({
      queryKey: ['notifications', userId] as const,
      queryFn: () => lastValueFrom(this.http.get<NotificationListDto>(`${this.userApiBase}/${userId}/notifications`, { params: { limit: 100 } })),
    });
  }

  async markAllRead(userId: number) {
    const key = this.list(userId).queryKey;
    this.queryClient.setQueryData<NotificationListDto>(key, data => data && {
      unreadCount: 0,
      items: data.items.map(item => ({ ...item, read: true })),
    });
    try {
      await lastValueFrom(this.http.post<void>(`${this.userApiBase}/${userId}/notifications/read-all`, {}));
    } finally {
      void this.queryClient.invalidateQueries({ queryKey: key });
    }
  }

  // Call when the app has already told the user about this order or transaction with its own toast.
  markAnnounced(kind: 'order' | 'transaction', id: number | null | undefined) {
    if (id != null) {
      this.announced.set(`${kind}:${id}`, Date.now() + ANNOUNCED_FOR_MS);
    }
  }

  // Called with each fresh copy of the list. The first copy only sets the baseline, so signing in doesn't replay
  // old notifications.
  receive(userId: number, list: NotificationListDto) {
    const newest = list.items.reduce((max, item) => Math.max(max, item.notificationId), 0);
    const previous = this.newestSeen.get(userId);
    this.newestSeen.set(userId, Math.max(previous ?? 0, newest));
    if (previous === undefined) {
      return;
    }

    const fresh = list.items.filter(item => item.notificationId > previous && !item.read).reverse();
    if (!fresh.length) {
      return;
    }
    const now = Date.now();
    for (const item of fresh) {
      if (!this.wasAnnounced(item, now)) {
        this.toasts.show({ kind: toastKind(item), title: item.title, message: item.message ?? undefined, ticker: toastTicker(item) });
      }
    }
    void this.queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
    void this.queryClient.invalidateQueries({ queryKey: ['account'] });
    void this.queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    void this.queryClient.invalidateQueries({ queryKey: ['overview', userId] });
  }

  private wasAnnounced(item: NotificationDto, now: number): boolean {
    const key = item.orderId != null ? `order:${item.orderId}` : item.transactionId != null ? `transaction:${item.transactionId}` : null;
    const until = key ? this.announced.get(key) : undefined;
    return until !== undefined && until > now;
  }
}

// Fills, by side; problems as errors; everything else (cancellations, cash) as plain confirmations.
export function toastKind(item: NotificationDto): ToastKind {
  if (item.category === 'ORDER') {
    if (item.title.startsWith('Bought')) {
      return 'buy';
    }
    if (item.title.startsWith('Sold')) {
      return 'sell';
    }
    if (/rejected|expired/i.test(item.title)) {
      return 'error';
    }
  }
  return 'success';
}

function toastTicker(item: NotificationDto): string | undefined {
  const kind = toastKind(item);
  return (kind === 'buy' || kind === 'sell') && item.ticker ? item.ticker : undefined;
}
