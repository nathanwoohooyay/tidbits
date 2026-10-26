import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotificationDto, NotificationListDto, NotificationsService, toastKind } from './notifications.service';
import { ToastService } from './toast.service';

const note = (id: number, overrides: Partial<NotificationDto> = {}): NotificationDto => ({
  notificationId: id,
  category: 'ORDER',
  title: 'Bought 2 AAPL',
  message: '$400.00 at $200.00 · Main',
  accountId: 3,
  orderId: 100 + id,
  transactionId: null,
  ticker: 'AAPL',
  createdAt: '2026-10-26T14:00:00',
  read: false,
  ...overrides,
});

const list = (...items: NotificationDto[]): NotificationListDto => ({
  unreadCount: items.filter(item => !item.read).length,
  items: [...items].sort((a, b) => b.notificationId - a.notificationId),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let toasts: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: QueryClient, useValue: new QueryClient() }],
    });
    service = TestBed.inject(NotificationsService);
    toasts = TestBed.inject(ToastService);
  });

  it('does not replay notifications that existed before the first look', () => {
    service.receive(7, list(note(1), note(2)));

    expect(toasts.toasts()).toHaveLength(0);
  });

  it('toasts unread notifications that arrive later, oldest first', () => {
    service.receive(7, list(note(1)));
    service.receive(7, list(note(1), note(2, { title: 'Sold 1 MSFT', ticker: 'MSFT' }), note(3, { category: 'CASH', title: 'Deposited $50.00', ticker: null, orderId: null })));

    expect(toasts.toasts().map(t => [t.kind, t.title, t.ticker])).toEqual([
      ['sell', 'Sold 1 MSFT', 'MSFT'],
      ['success', 'Deposited $50.00', undefined],
    ]);
  });

  it('skips orders and transfers the app already announced', () => {
    service.receive(7, list(note(1)));
    service.markAnnounced('order', 102);
    service.markAnnounced('transaction', 9);

    service.receive(7, list(note(1), note(2), note(3, { category: 'CASH', title: 'Withdrew $5.00', orderId: null, transactionId: 9 })));

    expect(toasts.toasts()).toHaveLength(0);
  });

  it('ignores notifications already read elsewhere', () => {
    service.receive(7, list(note(1)));
    service.receive(7, list(note(1), note(2, { read: true })));

    expect(toasts.toasts()).toHaveLength(0);
  });

  it('keeps a separate baseline per user', () => {
    service.receive(7, list(note(5)));
    service.receive(8, list(note(6)));

    expect(toasts.toasts()).toHaveLength(0);
  });
});

describe('toastKind', () => {
  it('reads fills by side and problems as errors', () => {
    expect(toastKind(note(1))).toBe('buy');
    expect(toastKind(note(1, { title: 'Sold 3 AAPL' }))).toBe('sell');
    expect(toastKind(note(1, { title: 'Order rejected: buy of 3 AAPL' }))).toBe('error');
    expect(toastKind(note(1, { title: 'Limit order expired' }))).toBe('error');
    expect(toastKind(note(1, { title: 'Cancelled limit buy of 3 AAPL' }))).toBe('success');
    expect(toastKind(note(1, { category: 'CASH', title: 'Deposited $5.00' }))).toBe('success');
  });
});
