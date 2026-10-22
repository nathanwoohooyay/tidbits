import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AccountHoldingDto, AccountService, AccountDto, PortfolioSnapshotDto } from '../../services/account.service';
import { GetHoldingsResponseDTO, PricingService } from '../../services/pricing.service';
import { SessionService } from '../../services/session.service';
import { tickerToName } from '../../components/dashboard/stock';
import { DashboardChartComponent } from '../../components/dashboard/dashboard-chart.component';
import { ChartPoint, ChartTimeframe, ThemeMode } from '../../components/dashboard/dashboard.models';
import { DashboardHeaderComponent } from '../../components/dashboard/dashboard-header.component';

interface AccountSummary {
  accountId: number;
  nickname: string;
  cashBalance: number;
  portfolioValue: number;
  portfolioChangePct: number;
  netWorth: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, DashboardChartComponent, DashboardHeaderComponent, RouterLink],
  selector: 'app-maindashboard',
  styleUrl: './maindashboard.css',
  templateUrl: './maindashboard.html',
})
export class Maindashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly accountApi = inject(AccountService);
  private readonly pricingApi = inject(PricingService);
  private readonly themeStorageKey = 'tidbits_theme_mode';

  readonly loading = signal(false);
  readonly error = signal('');
  readonly accounts = signal<AccountDto[]>([]);
  readonly selectedAccountId = signal(0);
  readonly themeMode = signal<ThemeMode>('light');

  readonly totalCashBalance = signal(0);
  readonly totalPortfolioValue = signal(0);
  readonly totalPortfolioChangePct = signal(0);
  readonly accountSummaries = signal<AccountSummary[]>([]);
  readonly portfolioSnapshotPoints = signal<ChartPoint[]>([]);
  readonly chartTimeframe = signal<ChartTimeframe>('1M');

  readonly totalNetWorth = computed(() => this.totalCashBalance() + this.totalPortfolioValue());

  private readonly tickerByInstrumentId: Record<number, string> = Object.fromEntries(
    Array.from(tickerToName.keys()).map((ticker, index) => [index + 1, ticker])
  );

  ngOnInit() {
    this.restoreThemePreference();
    const userId = this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId();
    if (!userId) {
      void this.router.navigateByUrl('/login');
      return;
    }

    this.loadAggregatePortfolio(userId);
    this.loadPortfolioSnapshotChart(userId);
  }

  toggleTheme() {
    const nextMode = this.themeMode() === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextMode);
  }

  signOut() {
    this.session.clearSession();
    void this.router.navigateByUrl('/login');
  }

  onAccountChange(accountId: number) {
    this.selectedAccountId.set(accountId);
    this.session.setSelectedAccountId(accountId);
  }


  openAccountDashboard(accountId: number) {
    this.session.setSelectedAccountId(accountId);
    console.log('Opening dashboard for accountId:', accountId);
    void this.router.navigateByUrl('/dashboard');
  }

  setChartTimeframe(timeframe: ChartTimeframe) {
    this.chartTimeframe.set(timeframe);
  }

  private loadAggregatePortfolio(userId: number) {
    this.loading.set(true);
    this.error.set('');

    this.accountApi.listAccounts(userId).subscribe({
      next: accounts => {
        this.accounts.set(accounts);
        const preferredAccountId = this.session.selectedAccountId();
        const nextAccountId = accounts.some(account => account.accountId === preferredAccountId)
          ? preferredAccountId
          : accounts[0]?.accountId ?? 0;
        this.selectedAccountId.set(nextAccountId);
        this.session.setSelectedAccountId(nextAccountId);


        this.totalCashBalance.set(accounts.reduce((sum, account) => sum + account.cashBalance, 0));

        if (!accounts.length) {
          this.totalPortfolioValue.set(0);
          this.totalPortfolioChangePct.set(0);
          this.accountSummaries.set([]);
          this.loading.set(false);
          return;
        }

        forkJoin(accounts.map(account => this.accountApi.listHoldings(account.accountId))).subscribe({
          next: holdingLists => {
            const holdingsByAccount = new Map<number, AccountHoldingDto[]>(
              accounts.map((account, index) => [account.accountId, holdingLists[index] ?? []])
            );
            this.loadPortfolioFromHoldings(accounts, holdingsByAccount);
          },
          error: err => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? 'Failed to load holdings across accounts.');
          }
        });
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to load accounts.');
      }
    });
  }

  private restoreThemePreference() {
    const saved = localStorage.getItem(this.themeStorageKey);
    const mode = saved === 'dark' ? 'dark' : 'light';
    this.applyTheme(mode);
  }

  private applyTheme(mode: ThemeMode) {
    this.themeMode.set(mode);
    localStorage.setItem(this.themeStorageKey, mode);
    document.body.classList.toggle('dark-mode', mode === 'dark');
  }

  private loadPortfolioFromHoldings(accounts: AccountDto[], holdingsByAccount: Map<number, AccountHoldingDto[]>) {
    const holdings = Array.from(holdingsByAccount.values()).flat();
    if (!holdings.length) {
      this.totalPortfolioValue.set(0);
      this.totalPortfolioChangePct.set(0);
      this.accountSummaries.set(accounts.map(account => ({
        accountId: account.accountId,
        nickname: account.nickname,
        cashBalance: account.cashBalance,
        portfolioValue: 0,
        portfolioChangePct: 0,
        netWorth: account.cashBalance,
      })));
      this.loading.set(false);
      return;
    }

    const accountIdByHolding = new Map<AccountHoldingDto, number>();
    for (const [accountId, accountHoldings] of holdingsByAccount.entries()) {
      for (const holding of accountHoldings) {
        accountIdByHolding.set(holding, accountId);
      }
    }

    const enrichedHoldings = holdings.map(holding => ({
      accountId: accountIdByHolding.get(holding) ?? 0,
      quantity: holding.quantity,
      amountInvested: holding.amountInvested,
      ticker: this.tickerByInstrumentId[holding.instrumentId] ?? ''
    }));

    const tickers = Array.from(new Set(enrichedHoldings.map(item => item.ticker).filter(Boolean)));
    if (!tickers.length) {
      this.totalPortfolioValue.set(0);
      this.totalPortfolioChangePct.set(0);
      this.loading.set(false);
      return;
    }

    this.pricingApi.getQuotes(tickers.join(',')).subscribe({
      next: (resp: GetHoldingsResponseDTO) => {
        const pricesByTicker = new Map(resp.quotes.map(quote => [quote.symbol, quote.price]));

        const calculateSummary = (items: Array<{ quantity: number; amountInvested: number; ticker: string }>) => {
          const totalInvested = items.reduce((sum, item) => sum + item.amountInvested, 0);
          const totalValue = items.reduce((sum, item) => {
            const marketPrice = pricesByTicker.get(item.ticker) ?? 0;
            return sum + (item.quantity * marketPrice);
          }, 0);

          return {
            totalInvested,
            totalValue,
            changePct: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
          };
        };

        const overall = calculateSummary(enrichedHoldings);

        const summaries = accounts.map(account => {
          const accountHoldings = enrichedHoldings.filter(item => item.accountId === account.accountId);
          const summary = calculateSummary(accountHoldings);
          return {
            accountId: account.accountId,
            nickname: account.nickname,
            cashBalance: account.cashBalance,
            portfolioValue: summary.totalValue,
            portfolioChangePct: summary.changePct,
            netWorth: account.cashBalance + summary.totalValue,
          };
        });

        this.totalPortfolioValue.set(overall.totalValue);
        this.totalPortfolioChangePct.set(overall.changePct);
        this.accountSummaries.set(summaries);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to load pricing data.');
      }
    });
  }

  private loadPortfolioSnapshotChart(userId: number) {
    this.accountApi.listPortfolioSnapshotsByUser(userId).subscribe({
      next: snapshots => {
        this.portfolioSnapshotPoints.set(this.aggregateSnapshotsByDay(snapshots));
      },
      error: err => {
        this.portfolioSnapshotPoints.set([]);
        this.error.set(err?.error?.message ?? err?.error?.error ?? 'Failed to load portfolio history.');
      },
    });
  }

  private aggregateSnapshotsByDay(snapshots: PortfolioSnapshotDto[]): ChartPoint[] {
    const latestByAccountDay = new Map<string, PortfolioSnapshotDto>();
    const totalsByDay = new Map<string, number>();

    for (const snapshot of snapshots) {
      const day = snapshot.createdAt?.slice(0, 10);
      if (!day || !Number.isFinite(snapshot.totalValue)) {
        continue;
      }

      const accountDayKey = `${snapshot.accountId}:${day}`;
      const current = latestByAccountDay.get(accountDayKey);

      if (!current || snapshot.createdAt > current.createdAt) {
        latestByAccountDay.set(accountDayKey, snapshot);
      }
    }

    for (const snapshot of latestByAccountDay.values()) {
      const day = snapshot.createdAt.slice(0, 10);
      totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + snapshot.totalValue);
    }

    return Array.from(totalsByDay.entries())
      .sort(([leftDay], [rightDay]) => leftDay.localeCompare(rightDay))
      .map(([day, totalValue]) => ({
        date: `${day}T00:00:00`,
        value: Number(totalValue.toFixed(2)),
      }));
  }
}
