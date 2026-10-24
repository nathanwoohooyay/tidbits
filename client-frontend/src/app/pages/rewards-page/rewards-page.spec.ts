import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from '../../services/session.service';
import { LotteryDrawDto, PointsTransactionDto, RewardsService, RewardsSummaryDto } from '../../services/rewards.service';
import { RewardsPageComponent } from './rewards-page';

describe('Prize draws', () => {
  const draw = (drawId: number, prizeCode: string, ticketPrice: number): LotteryDrawDto => ({
    drawId, status: 'OPEN', ticketPrice, potPoints: 0, potCashValue: 0, ticketsSold: 4, myTickets: 1,
    closesAt: '2026-10-30T20:00:00', drawnAt: null, winnerLabel: null, wonByMe: false,
    prizeCode, prizeName: prizeCode, prizeDescription: null, fulfillmentStatus: 'NOT_DRAWN'
  });
  const wine = draw(7, 'WINE_COLLECTION', 500);
  const yacht = draw(8, 'YACHT_CHARTER', 1000);
  const summary: RewardsSummaryDto = {
    balance: 5000, lifetimeEarned: 5000, lifetimeSpent: 0, maxTicketsPerPurchase: 50,
    draws: [wine, yacht], lastDraws: []
  };
  const ticketTx: PointsTransactionDto = {
    pointsTransactionId: 42, eventType: 'LOTTERY_TICKET', pointsDelta: -2000, balanceAfter: 3000,
    accountId: null, cashValue: null, instrumentId: null, ticker: null, quantity: null,
    referenceId: 8, details: '2 tickets for draw #8', createdAt: '2026-10-23T12:00:00'
  };
  let component: RewardsPageComponent;
  let api: { buyLotteryTickets: ReturnType<typeof vi.fn>; getSummary: ReturnType<typeof vi.fn>; getTransactions: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = {
      buyLotteryTickets: vi.fn(() => of(ticketTx)),
      getSummary: vi.fn(() => of({ ...summary, balance: 3000 })),
      getTransactions: vi.fn(() => of([ticketTx]))
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: RewardsService, useValue: api },
        { provide: SessionService, useValue: { currentUser: () => null } },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } }
      ]
    });
    component = TestBed.runInInjectionContext(() => new RewardsPageComponent());
    component.userId.set(1);
    component.summary.set(summary);
  });

  it('tracks ticket quantity and cost separately for each draw', () => {
    component.adjustTickets(yacht, 1);
    expect(component.quantityFor(yacht)).toBe(2);
    expect(component.ticketCost(yacht)).toBe(2000);
    expect(component.quantityFor(wine)).toBe(1);
    expect(component.ticketCost(wine)).toBe(500);
  });

  it('clamps ticket quantity to the purchase limit', () => {
    component.adjustTickets(wine, -5);
    expect(component.quantityFor(wine)).toBe(1);
    component.adjustTickets(wine, 100);
    expect(component.quantityFor(wine)).toBe(50);
  });

  it('enters the chosen draw and refreshes the balance', async () => {
    component.adjustTickets(yacht, 1);
    await component.buyTickets(yacht);
    expect(api.buyLotteryTickets).toHaveBeenCalledWith(1, 8, 2);
    expect(component.balance()).toBe(3000);
    expect(component.feedbackFor(yacht)?.kind).toBe('success');
    expect(component.feedbackFor(wine)).toBeNull();
    expect(component.quantityFor(yacht)).toBe(1);
  });

  it('does not submit when the balance is insufficient', async () => {
    component.summary.set({ ...summary, balance: 900 });
    await component.buyTickets(yacht);
    expect(api.buyLotteryTickets).not.toHaveBeenCalled();
    expect(component.feedbackFor(yacht)?.text).toContain('1,000');
  });

  it('ignores another purchase while one is pending', async () => {
    const pending = new Subject<PointsTransactionDto>();
    api.buyLotteryTickets.mockReturnValue(pending);
    const buying = component.buyTickets(wine);
    await component.buyTickets(yacht);
    expect(api.buyLotteryTickets).toHaveBeenCalledTimes(1);
    expect(component.busyDrawId()).toBe(7);
    pending.next(ticketTx);
    pending.complete();
    await buying;
    expect(component.busyDrawId()).toBeNull();
  });

  it('shows the server error on the draw that failed', async () => {
    api.buyLotteryTickets.mockReturnValue(throwError(() => ({ error: { message: 'Draw #8 is closed.' } })));
    await component.buyTickets(yacht);
    expect(component.feedbackFor(yacht)).toEqual({ drawId: 8, kind: 'error', text: 'Draw #8 is closed.' });
    expect(component.balance()).toBe(5000);
  });

  it('matches each draw to the last result for the same prize', () => {
    const lastYacht = { ...yacht, drawId: 3, status: 'DRAWN' as const, winnerLabel: 'a***z' };
    component.summary.set({ ...summary, lastDraws: [lastYacht] });
    expect(component.lastDrawFor(yacht)).toEqual(lastYacht);
    expect(component.lastDrawFor(wine)).toBeNull();
    expect(component.drawResult(lastYacht)).toBe('a***z won YACHT_CHARTER. Fulfillment pending.');
  });

  it('points each prize at its thumbnail and falls back to the icon when it is missing', () => {
    expect(component.prizeImage(yacht)).toBe('prizes/yacht-charter.jpg');
    component.markImageMissing(yacht);
    expect(component.prizeImage(yacht)).toBeNull();
    expect(component.prizeImage(wine)).toBe('prizes/wine-collection.jpg');
    expect(component.prizeIcon(yacht)).toBe('🛥️');
  });

  it('counts down to the soonest closing draw', () => {
    const early = { ...wine, drawId: 9, closesAt: '2026-10-29T20:00:00' };
    component.summary.set({ ...summary, draws: [wine, early, yacht] });
    expect(component.nextDraw()).toEqual(early);
  });
});
