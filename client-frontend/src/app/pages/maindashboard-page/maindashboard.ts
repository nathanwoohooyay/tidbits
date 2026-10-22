import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AccountHoldingDto, AccountService, AccountDto } from '../../services/account.service';
import { GetHoldingsResponseDTO, PricingService } from '../../services/pricing.service';
import { SessionService } from '../../services/session.service';
import { tickerToName } from '../../components/dashboard/stock';
import { DashboardChartComponent } from '../../components/dashboard/dashboard-chart.component';

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
  imports: [CommonModule, DashboardChartComponent],
  selector: 'app-maindashboard',
  styleUrl: './maindashboard.css',
  templateUrl: './maindashboard.html',
})
export class Maindashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly accountApi = inject(AccountService);
  private readonly pricingApi = inject(PricingService);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly totalCashBalance = signal(0);
  readonly totalPortfolioValue = signal(0);
  readonly totalPortfolioChangePct = signal(0);
  readonly accountSummaries = signal<AccountSummary[]>([]);

  readonly totalNetWorth = computed(() => this.totalCashBalance() + this.totalPortfolioValue());

  private readonly tickerByInstrumentId: Record<number, string> = Object.fromEntries(
    Array.from(tickerToName.keys()).map((ticker, index) => [index + 1, ticker])
  );

  ngOnInit() {
    const userId = this.session.currentUser()?.userId ?? this.session.getAuthenticatedUserId();
    if (!userId) {
      void this.router.navigateByUrl('/login');
      return;
    }

    this.loadAggregatePortfolio(userId);
  }


  openAccountDashboard(accountId: number) {
    this.session.setSelectedAccountId(accountId);
    void this.router.navigateByUrl('/dashboard');
  }

  private loadAggregatePortfolio(userId: number) {
    this.loading.set(true);
    this.error.set('');

    this.accountApi.listAccounts(userId).subscribe({
      next: accounts => {
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
}
