import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../../services/session.service';
import { DashboardHeaderComponent } from '../../components/dashboard/dashboard-header.component';
import {
  LotteryDrawDto,
  PointsEventType,
  PointsTransactionDto,
  RewardsService,
  RewardsSummaryDto
} from '../../services/rewards.service';

type ActivityFilter = 'ALL' | 'EARNED' | 'SPENT';

interface DrawFeedback {
  drawId: number;
  kind: 'error' | 'success';
  text: string;
}

// Placeholder icon for each prize in the backend's LotteryPrize catalog, shown until its image loads.
const PRIZE_ICONS: Record<string, string> = {
  SPORTS_TICKETS: '🏟️',
  WINE_COLLECTION: '🍷',
  CHEFS_TABLE: '🍽️',
  YACHT_CHARTER: '🛥️',
  LUXURY_WATCH: '⌚',
  SUPERCAR_WEEKEND: '🏎️',
  PRIVATE_JET: '🛩️'
};

const EVENT_LABELS: Record<PointsEventType, string> = {
  EARN_TRADE: 'Trade reward',
  CASH_OUT: 'Cash out',
  STOCK_DROP: 'Stock drop',
  STOCK_PACK: 'Stock pack',
  LOTTERY_TICKET: 'Lottery tickets',
  LOTTERY_WIN: 'Lottery win',
  SCRATCH_CARD: 'Scratch card',
  SCRATCH_WIN: 'Scratch win'
};

@Component({
  selector: 'app-rewards-page',
  standalone: true,
  imports: [CommonModule, DashboardHeaderComponent],
  templateUrl: './rewards-page.html',
  styleUrls: ['./rewards-page.css']
})
export class RewardsPageComponent implements OnInit, OnDestroy {
  private readonly session = inject(SessionService);
  private readonly rewardsApi = inject(RewardsService);
  private readonly router = inject(Router);
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  userId = signal<number | null>(null);
  summary = signal<RewardsSummaryDto | null>(null);
  transactions = signal<PointsTransactionDto[]>([]);
  loading = signal(true);
  loadError = signal('');
  now = signal(Date.now());

  // Lottery, keyed by drawId
  ticketQuantities = signal<Record<number, number>>({});
  busyDrawId = signal<number | null>(null);
  drawFeedback = signal<DrawFeedback | null>(null);
  missingImages = signal<ReadonlySet<string>>(new Set());

  activityFilter = signal<ActivityFilter>('ALL');

  balance = computed(() => this.summary()?.balance ?? 0);
  draws = computed(() => this.summary()?.draws ?? []);
  lastDraws = computed(() => this.summary()?.lastDraws ?? []);
  nextDraw = computed(() =>
    this.draws().reduce<LotteryDrawDto | null>((next, draw) => !next || draw.closesAt < next.closesAt ? draw : next, null)
  );

  filteredTransactions = computed(() => {
    const filter = this.activityFilter();
    return this.transactions().filter(tx =>
      filter === 'ALL' || (filter === 'EARNED' ? tx.pointsDelta > 0 : tx.pointsDelta < 0)
    );
  });

  ngOnInit() {
    const userId = this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId();
    if (!userId) {
      void this.router.navigateByUrl('/login');
      return;
    }

    this.userId.set(userId);
    this.countdownTimer = setInterval(() => this.now.set(Date.now()), 1000);
    void this.loadAll();
  }

  ngOnDestroy() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  async loadAll() {
    const userId = this.userId();
    if (!userId) return;

    this.loading.set(true);
    this.loadError.set('');
    try {
      const [summary, transactions] = await Promise.all([
        firstValueFrom(this.rewardsApi.getSummary(userId)),
        firstValueFrom(this.rewardsApi.getTransactions(userId))
      ]);
      this.summary.set(summary);
      this.transactions.set(transactions);
    } catch (err: any) {
      this.loadError.set(this.errorMessage(err, 'Failed to load your rewards.'));
    } finally {
      this.loading.set(false);
    }
  }

  async buyTickets(draw: LotteryDrawDto) {
    if (this.busyDrawId() !== null) return;
    const userId = this.userId();
    const quantity = this.quantityFor(draw);
    const cost = this.ticketCost(draw);
    this.drawFeedback.set(null);

    if (cost > this.balance()) {
      this.drawFeedback.set({ drawId: draw.drawId, kind: 'error', text: `You need ${cost.toLocaleString()} points for ${quantity} ticket(s).` });
      return;
    }

    this.busyDrawId.set(draw.drawId);
    try {
      await firstValueFrom(this.rewardsApi.buyLotteryTickets(userId!, draw.drawId, quantity));
      this.drawFeedback.set({ drawId: draw.drawId, kind: 'success', text: `${quantity} ticket${quantity === 1 ? '' : 's'} entered. Good luck!` });
      this.ticketQuantities.update(quantities => ({ ...quantities, [draw.drawId]: 1 }));
      await this.refresh();
    } catch (err: any) {
      this.drawFeedback.set({ drawId: draw.drawId, kind: 'error', text: this.errorMessage(err, 'Could not buy tickets.') });
    } finally {
      this.busyDrawId.set(null);
    }
  }

  quantityFor(draw: LotteryDrawDto): number {
    return this.ticketQuantities()[draw.drawId] ?? 1;
  }

  ticketCost(draw: LotteryDrawDto): number {
    return this.quantityFor(draw) * draw.ticketPrice;
  }

  adjustTickets(draw: LotteryDrawDto, delta: number) {
    const max = this.summary()?.maxTicketsPerPurchase ?? 50;
    const quantity = Math.min(max, Math.max(1, this.quantityFor(draw) + delta));
    this.ticketQuantities.update(quantities => ({ ...quantities, [draw.drawId]: quantity }));
  }

  feedbackFor(draw: LotteryDrawDto): DrawFeedback | null {
    const feedback = this.drawFeedback();
    return feedback?.drawId === draw.drawId ? feedback : null;
  }

  winOdds(draw: LotteryDrawDto): number | null {
    if (draw.ticketsSold === 0 || draw.myTickets === 0) {
      return null;
    }
    return draw.myTickets / draw.ticketsSold;
  }

  countdown(draw: LotteryDrawDto): string {
    const remaining = Date.parse(draw.closesAt) - this.now();
    if (remaining <= 0) {
      return 'Drawing now…';
    }
    const totalMinutes = Math.floor(remaining / 60_000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((remaining % 60_000) / 1000);
    return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`;
  }

  prizeIcon(draw: LotteryDrawDto): string {
    return PRIZE_ICONS[draw.prizeCode ?? ''] ?? '🎟️';
  }

  /** Thumbnail served from public/prizes, e.g. YACHT_CHARTER -> prizes/yacht-charter.jpg. */
  prizeImage(draw: LotteryDrawDto): string | null {
    if (!draw.prizeCode || this.missingImages().has(draw.prizeCode)) return null;
    return `prizes/${draw.prizeCode.toLowerCase().replaceAll('_', '-')}.jpg`;
  }

  markImageMissing(draw: LotteryDrawDto) {
    if (draw.prizeCode) {
      this.missingImages.update(missing => new Set(missing).add(draw.prizeCode!));
    }
  }

  lastDrawFor(draw: LotteryDrawDto): LotteryDrawDto | null {
    return draw.prizeCode ? this.lastDraws().find(last => last.prizeCode === draw.prizeCode) ?? null : null;
  }

  eventLabel(type: PointsEventType): string {
    return EVENT_LABELS[type] ?? type;
  }

  drawResult(draw: LotteryDrawDto): string {
    if (draw.prizeName) {
      if (!draw.winnerLabel) return 'No tickets sold; no prize awarded.';
      return `${draw.wonByMe ? 'You' : draw.winnerLabel} won ${draw.prizeName}. Fulfillment pending.`;
    }
    if (draw.wonByMe) {
      return `You won ${draw.potPoints.toLocaleString()} points!`;
    }
    if (!draw.winnerLabel) {
      return 'No tickets sold; no prize awarded.';
    }
    return `${draw.winnerLabel} won ${draw.potPoints.toLocaleString()} points`;
  }

  private async refresh() {
    const userId = this.userId();
    if (!userId) return;
    try {
      const [summary, transactions] = await Promise.all([
        firstValueFrom(this.rewardsApi.getSummary(userId)),
        firstValueFrom(this.rewardsApi.getTransactions(userId))
      ]);
      this.summary.set(summary);
      this.transactions.set(transactions);
      const user = this.session.currentUser();
      if (user) {
        this.session.setCurrentUser({ ...user, reward_points: summary.balance });
      }
    } catch {
      // Keep the last good state; the action itself already reported success or failure.
    }
  }

  private errorMessage(err: any, fallback: string): string {
    return err?.error?.message ?? err?.error?.error ?? fallback;
  }
}
