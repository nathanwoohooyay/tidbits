import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { TickerLogoComponent } from '../dashboard/ticker-logo.component';
import { SkeletonRowsComponent } from '../skeleton-rows.component';
import { serverTime } from '../dashboard/dashboard.utils';
import { NOTIFICATION_POLL_MS, NotificationCategory, NotificationDto, NotificationsService, toastKind } from '../../services/notifications.service';
import { SessionService } from '../../services/session.service';
import { PortfolioQueries } from '../../services/portfolio-queries';

type Filter = 'ALL' | NotificationCategory;

interface DayGroup {
  label: string;
  items: NotificationDto[];
}

// How long the panel is open before what's in it counts as read.
const MARK_READ_AFTER_MS = 1500;

const DAY_LABEL = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
const DAY_LABEL_WITH_YEAR = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// Bell with an unread count; clicking it drops down the user's notifications from all their accounts (orders
// filling, cash moving), newest first and grouped by day, each tagged with its account when there's more than one. Opening it marks everything read; what was unread stays highlighted until it closes.
// Closes on Esc, on a click outside, or on the bell again. Shares the sidebar's polled list, so it costs no requests.
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, TickerLogoComponent, SkeletonRowsComponent],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'close(true)',
  },
})
export class NotificationBellComponent implements OnDestroy {
  private readonly notifications = inject(NotificationsService);
  private readonly session = inject(SessionService);
  private readonly queries = inject(PortfolioQueries);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly bell = viewChild<ElementRef<HTMLButtonElement>>('bell');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly userId = this.session.getAuthenticatedUserId() ?? 0;

  readonly filters: Array<[Filter, string]> = [['ALL', 'All'], ['ORDER', 'Orders'], ['CASH', 'Cash']];
  readonly filter = signal<Filter>('ALL');
  readonly open = signal(false);
  readonly toastKind = toastKind;
  readonly serverTime = serverTime;

  private readonly listQuery = injectQuery(() => ({
    ...this.notifications.list(this.userId),
    enabled: this.userId > 0,
    refetchInterval: NOTIFICATION_POLL_MS,
  }));

  // Account names by id, for the tag on each notification (the same cached list the pages use).
  private readonly accountsQuery = injectQuery(() => ({
    ...this.queries.accounts(this.userId),
    enabled: this.userId > 0,
  }));
  private readonly accountNames = computed(() =>
    new Map((this.accountsQuery.data() ?? []).map(account => [account.accountId, account.nickname])));
  readonly showAccounts = computed(() => this.accountNames().size > 1);

  readonly loading = computed(() => this.listQuery.isPending() && this.userId > 0);
  readonly error = computed(() => this.listQuery.isError() && !this.listQuery.data());
  readonly items = computed(() => this.listQuery.data()?.items ?? []);
  readonly unreadCount = computed(() => this.listQuery.data()?.unreadCount ?? 0);
  // Unread when seen while the panel is open; kept so marking them read doesn't make them blink.
  private readonly highlighted = signal<ReadonlySet<number>>(new Set());

  readonly groups = computed<DayGroup[]>(() => {
    const filter = this.filter();
    const groups: DayGroup[] = [];
    for (const item of this.items()) {
      if (filter !== 'ALL' && item.category !== filter) {
        continue;
      }
      const label = dayLabel(item.createdAt);
      const last = groups[groups.length - 1];
      if (last?.label === label) {
        last.items.push(item);
      } else {
        groups.push({ label, items: [item] });
      }
    }
    return groups;
  });

  private markReadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // While open, anything unread (including what arrives meanwhile) is highlighted, then marked read.
    effect(() => {
      const items = this.items();
      if (!this.open()) {
        return;
      }
      untracked(() => {
        const unread = items.filter(item => !item.read).map(item => item.notificationId);
        if (!unread.length) {
          return;
        }
        this.highlighted.update(set => new Set([...set, ...unread]));
        this.scheduleMarkRead();
      });
    });
  }

  ngOnDestroy() {
    this.cancelMarkRead();
  }

  toggle() {
    if (this.open()) {
      this.close(false);
      return;
    }
    this.highlighted.set(new Set());
    this.filter.set('ALL');
    this.open.set(true);
    setTimeout(() => this.panel()?.nativeElement.focus());
  }

  // `restoreFocus` returns focus to the bell (Esc); a click elsewhere leaves it where the click put it.
  close(restoreFocus: boolean) {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.cancelMarkRead();
    if (restoreFocus) {
      this.bell()?.nativeElement.focus();
    }
  }

  onDocumentClick(event: MouseEvent) {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close(false);
    }
  }

  accountName(item: NotificationDto): string | null {
    return item.accountId == null ? null : this.accountNames().get(item.accountId) ?? null;
  }

  isHighlighted(item: NotificationDto): boolean {
    return this.highlighted().has(item.notificationId);
  }

  markAllRead() {
    void this.notifications.markAllRead(this.userId);
  }

  retry() {
    void this.listQuery.refetch();
  }

  private scheduleMarkRead() {
    if (this.markReadTimer) {
      return;
    }
    this.markReadTimer = setTimeout(() => {
      this.markReadTimer = null;
      this.markAllRead();
    }, MARK_READ_AFTER_MS);
  }

  private cancelMarkRead() {
    if (this.markReadTimer) {
      clearTimeout(this.markReadTimer);
      this.markReadTimer = null;
    }
  }
}

function dayLabel(iso: string): string {
  const date = serverTime(iso) ?? new Date();
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(date)) / 86_400_000);
  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  return date.getFullYear() === today.getFullYear() ? DAY_LABEL.format(date) : DAY_LABEL_WITH_YEAR.format(date);
}
