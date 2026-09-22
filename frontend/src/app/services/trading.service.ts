import { Injectable, signal, computed } from '@angular/core';
import { User, Account, Instrument, Holding, Order, PortfolioSummary, Timeframe, TrendingFilter } from '../models/trading.models';

const INITIAL_USERS: User[] = [
  {
    userId: 1,
    roleId: 1,
    username: 'john_investor',
    fullName: 'John Investor',
    displayName: 'John',
    email: 'john@example.com',
    phoneNumber: '555-0101',
    rewardPoints: 1500,
    accounts: [
      { accountId: 1, nickname: 'Primary Brokerage', cashBalance: 50000.00 },
      { accountId: 2, nickname: 'Retirement Fund', cashBalance: 150000.00 }
    ]
  },
  {
    userId: 2,
    roleId: 1,
    username: 'sarah_trader',
    fullName: 'Sarah Trader',
    displayName: 'Sarah',
    email: 'sarah@example.com',
    phoneNumber: '555-0102',
    rewardPoints: 2300,
    accounts: [
      { accountId: 3, nickname: 'Trading Account', cashBalance: 75000.00 },
      { accountId: 7, nickname: 'Savings Account', cashBalance: 50000.00 }
    ]
  },
  {
    userId: 4,
    roleId: 1,
    username: 'lisa_portfolio',
    fullName: 'Lisa Portfolio',
    displayName: 'Lisa',
    email: 'lisa@example.com',
    phoneNumber: '555-0104',
    rewardPoints: 3200,
    accounts: [
      { accountId: 5, nickname: 'Main Portfolio', cashBalance: 200000.00 }
    ]
  }
];

const INITIAL_INSTRUMENTS: Instrument[] = [
  {
    instrumentId: 1,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    market: 'NASDAQ',
    price: 224.25,
    changePercent: 1.84,
    changeAmount: 4.05,
    volume: 64280000,
    volumeFormatted: '64.3M',
    marketCap: '3.42T',
    dayHigh: 225.40,
    dayLow: 220.10,
    trendingRank: 1,
    sparkline: [219, 220.5, 221, 223, 222.4, 224.25]
  },
  {
    instrumentId: 8,
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    type: 'etf',
    market: 'NYSE',
    price: 558.90,
    changePercent: 0.62,
    changeAmount: 3.45,
    volume: 82140000,
    volumeFormatted: '82.1M',
    marketCap: '550B',
    dayHigh: 560.10,
    dayLow: 556.20,
    trendingRank: 2,
    sparkline: [554, 555.2, 556.8, 557.5, 558.9]
  },
  {
    instrumentId: 2,
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    type: 'stock',
    market: 'NASDAQ',
    price: 442.80,
    changePercent: 2.15,
    changeAmount: 9.32,
    volume: 38400000,
    volumeFormatted: '38.4M',
    marketCap: '3.29T',
    dayHigh: 445.00,
    dayLow: 436.50,
    trendingRank: 3,
    sparkline: [433, 436, 439, 440, 442.8]
  },
  {
    instrumentId: 3,
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    type: 'stock',
    market: 'NASDAQ',
    price: 128.45,
    changePercent: 4.38,
    changeAmount: 5.39,
    volume: 112500000,
    volumeFormatted: '112.5M',
    marketCap: '3.16T',
    dayHigh: 130.20,
    dayLow: 124.80,
    trendingRank: 4,
    sparkline: [122, 124.5, 125.8, 127.2, 128.45]
  },
  {
    instrumentId: 4,
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    type: 'stock',
    market: 'NASDAQ',
    price: 243.60,
    changePercent: -1.72,
    changeAmount: -4.26,
    volume: 91400000,
    volumeFormatted: '91.4M',
    marketCap: '775B',
    dayHigh: 251.20,
    dayLow: 241.50,
    trendingRank: 5,
    sparkline: [250, 248.5, 246, 244.2, 243.6]
  },
  {
    instrumentId: 5,
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    market: 'NASDAQ',
    price: 178.50,
    changePercent: 0.94,
    changeAmount: 1.66,
    volume: 29500000,
    volumeFormatted: '29.5M',
    marketCap: '2.21T',
    dayHigh: 180.10,
    dayLow: 176.90,
    trendingRank: 6,
    sparkline: [176.5, 177, 178.1, 177.8, 178.5]
  },
  {
    instrumentId: 6,
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    type: 'stock',
    market: 'NASDAQ',
    price: 189.20,
    changePercent: 1.45,
    changeAmount: 2.70,
    volume: 44200000,
    volumeFormatted: '44.2M',
    marketCap: '1.97T',
    dayHigh: 190.50,
    dayLow: 186.75,
    trendingRank: 7,
    sparkline: [186, 187.2, 188.5, 188.1, 189.2]
  },
  {
    instrumentId: 7,
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    type: 'stock',
    market: 'NYSE',
    price: 216.70,
    changePercent: -0.85,
    changeAmount: -1.86,
    volume: 18900000,
    volumeFormatted: '18.9M',
    marketCap: '620B',
    dayHigh: 219.00,
    dayLow: 215.80,
    trendingRank: 8,
    sparkline: [219, 218.5, 217.4, 216.2, 216.7]
  },
  {
    instrumentId: 9,
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust ETF',
    type: 'etf',
    market: 'NASDAQ',
    price: 478.30,
    changePercent: 1.35,
    changeAmount: 6.37,
    volume: 53200000,
    volumeFormatted: '53.2M',
    marketCap: '280B',
    dayHigh: 480.20,
    dayLow: 473.10,
    trendingRank: 9,
    sparkline: [471, 474, 476.5, 477.2, 478.3]
  },
  {
    instrumentId: 10,
    ticker: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    type: 'etf',
    market: 'NYSE',
    price: 74.20,
    changePercent: 0.18,
    changeAmount: 0.13,
    volume: 12100000,
    volumeFormatted: '12.1M',
    marketCap: '105B',
    dayHigh: 74.45,
    dayLow: 74.05,
    trendingRank: 10,
    sparkline: [74.05, 74.1, 74.15, 74.22, 74.2]
  },
  {
    instrumentId: 11,
    ticker: 'F',
    name: 'Ford Motor Company',
    type: 'stock',
    market: 'NYSE',
    price: 11.24,
    changePercent: -2.43,
    changeAmount: -0.28,
    volume: 48900000,
    volumeFormatted: '48.9M',
    marketCap: '44.8B',
    dayHigh: 11.60,
    dayLow: 11.15,
    trendingRank: 11,
    sparkline: [11.55, 11.45, 11.38, 11.2, 11.24]
  },
  {
    instrumentId: 12,
    ticker: 'IBM',
    name: 'International Business Machines',
    type: 'stock',
    market: 'NYSE',
    price: 218.40,
    changePercent: 0.82,
    changeAmount: 1.78,
    volume: 9800000,
    volumeFormatted: '9.8M',
    marketCap: '201B',
    dayHigh: 219.80,
    dayLow: 216.50,
    trendingRank: 12,
    sparkline: [216, 217.2, 217.9, 218.1, 218.4]
  }
];

interface RawHolding {
  holdingId: number;
  accountId: number;
  instrumentId: number;
  quantity: number;
  amountInvested: number;
}

const INITIAL_RAW_HOLDINGS: RawHolding[] = [
  { holdingId: 1, accountId: 1, instrumentId: 1, quantity: 50.5, amountInvested: 8585.00 },
  { holdingId: 2, accountId: 1, instrumentId: 8, quantity: 100.0, amountInvested: 42500.00 },
  { holdingId: 3, accountId: 1, instrumentId: 3, quantity: 40.0, amountInvested: 4400.00 }
];

const INITIAL_ORDERS: Order[] = [
  {
    orderId: 101,
    accountId: 1,
    instrumentId: 1,
    orderType: 'BUY',
    quantity: 50.5,
    stockPrice: 170.00,
    totalAmount: 8585.00,
    status: 'FILLED',
    createdAt: '2026-09-18 10:14:22'
  },
  {
    orderId: 102,
    accountId: 1,
    instrumentId: 8,
    orderType: 'BUY',
    quantity: 100.0,
    stockPrice: 425.00,
    totalAmount: 42500.00,
    status: 'FILLED',
    createdAt: '2026-09-19 14:32:05'
  },
  {
    orderId: 103,
    accountId: 1,
    instrumentId: 3,
    orderType: 'BUY',
    quantity: 40.0,
    stockPrice: 110.00,
    totalAmount: 4400.00,
    status: 'FILLED',
    createdAt: '2026-09-21 09:45:11'
  }
];

export const TIMEFRAME_TEMPLATES = {
  '1D': {
    labels: ['9:30 AM', '10:30 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'],
    points: [118200, 118900, 119400, 118800, 120100, 122340],
    changePct: '+2.14%'
  },
  '1W': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    points: [115400, 116200, 118100, 119800, 122340],
    changePct: '+6.01%'
  },
  '1M': {
    labels: ['W1', 'W2', 'W3', 'W4'],
    points: [110200, 113500, 117200, 122340],
    changePct: '+11.02%'
  },
  '3M': {
    labels: ['Jul', 'Aug', 'Sep'],
    points: [98500, 107400, 122340],
    changePct: '+24.20%'
  },
  '1Y': {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    points: [82000, 94500, 106000, 122340],
    changePct: '+49.20%'
  },
  'ALL': {
    labels: ['2023', '2024', '2025', '2026'],
    points: [65000, 85000, 102000, 122340],
    changePct: '+88.22%'
  }
};

@Injectable({
  providedIn: 'root'
})
export class TradingService {
  private readonly STORAGE_KEY = 'ttt_angular_trading_state_v1';
  private readonly BACKEND_URL = 'http://localhost:8082/api';

  // Reactive State Signals
  readonly users = signal<User[]>(INITIAL_USERS);
  readonly activeUserId = signal<number>(1);
  readonly activeAccountId = signal<number>(1);
  readonly instruments = signal<Instrument[]>(INITIAL_INSTRUMENTS);
  readonly rawHoldings = signal<RawHolding[]>(INITIAL_RAW_HOLDINGS);
  readonly orders = signal<Order[]>(INITIAL_ORDERS);
  readonly backendConnected = signal<boolean>(false);

  // Active user and account
  readonly currentUser = computed(() => {
    const list = this.users();
    const id = this.activeUserId();
    return list.find(u => u.userId === id) || list[0];
  });

  readonly currentAccount = computed(() => {
    const user = this.currentUser();
    const id = this.activeAccountId();
    return user.accounts.find(a => a.accountId === id) || user.accounts[0];
  });

  // Computed enriched holdings for active account
  readonly holdings = computed<Holding[]>(() => {
    const acct = this.currentAccount();
    const raw = this.rawHoldings().filter(h => h.accountId === acct.accountId);
    const insts = this.instruments();

    return raw.map(h => {
      const inst = insts.find(i => i.instrumentId === h.instrumentId) || {
        ticker: 'UNK',
        name: 'Unknown Asset',
        price: 0,
        changePercent: 0
      } as Instrument;

      const currentPrice = inst.price;
      const totalValue = h.quantity * currentPrice;
      const avgCost = h.quantity > 0 ? h.amountInvested / h.quantity : 0;
      const unrealizedGain = totalValue - h.amountInvested;
      const unrealizedGainPct = h.amountInvested > 0 ? (unrealizedGain / h.amountInvested) * 100 : 0;

      return {
        ...h,
        ticker: inst.ticker,
        name: inst.name,
        currentPrice,
        avgCost,
        totalValue,
        unrealizedGain,
        unrealizedGainPct,
        changePercent: inst.changePercent
      };
    });
  });

  // Computed Portfolio Summary (Total Net Worth, Cash Balance, Portfolio Value)
  readonly portfolioSummary = computed<PortfolioSummary>(() => {
    const acct = this.currentAccount();
    const activeHoldings = this.holdings();

    const cashBalance = acct.cashBalance;
    const portfolioValue = activeHoldings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalNetWorth = cashBalance + portfolioValue;
    const totalInvested = activeHoldings.reduce((sum, h) => sum + h.amountInvested, 0);
    const totalUnrealizedGain = portfolioValue - totalInvested;
    const totalReturnPct = totalInvested > 0 ? (totalUnrealizedGain / totalInvested) * 100 : 0;

    // Day Change Calculation
    const dayChangeAmount = activeHoldings.reduce((sum, h) => {
      const inst = this.instruments().find(i => i.instrumentId === h.instrumentId);
      return sum + (inst ? inst.changeAmount * h.quantity : 0);
    }, 0);
    const dayChangePct = portfolioValue > 0 ? (dayChangeAmount / portfolioValue) * 100 : 0;

    return {
      cashBalance,
      portfolioValue,
      totalNetWorth,
      totalInvested,
      totalUnrealizedGain,
      totalReturnPct,
      dayChangeAmount,
      dayChangePct
    };
  });

  // Active account orders
  readonly accountOrders = computed<Order[]>(() => {
    const acct = this.currentAccount();
    const insts = this.instruments();
    return this.orders()
      .filter(o => o.accountId === acct.accountId)
      .map(o => {
        const inst = insts.find(i => i.instrumentId === o.instrumentId);
        return {
          ...o,
          ticker: inst ? inst.ticker : 'UNK',
          name: inst ? inst.name : 'Unknown'
        };
      });
  });

  constructor() {
    this.loadState();
    this.checkBackendHealth();
  }

  private loadState(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.users) this.users.set(parsed.users);
        if (parsed.activeUserId) this.activeUserId.set(parsed.activeUserId);
        if (parsed.activeAccountId) this.activeAccountId.set(parsed.activeAccountId);
        if (parsed.rawHoldings) this.rawHoldings.set(parsed.rawHoldings);
        if (parsed.orders) this.orders.set(parsed.orders);
        return;
      } catch (e) {
        console.error('Error loading saved state:', e);
      }
    }
  }

  private saveState(): void {
    const payload = {
      users: this.users(),
      activeUserId: this.activeUserId(),
      activeAccountId: this.activeAccountId(),
      rawHoldings: this.rawHoldings(),
      orders: this.orders()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 1200);
      const res = await fetch(`${this.BACKEND_URL}/instruments`, {
        signal: ctrl.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(id);
      this.backendConnected.set(res.ok);
      return res.ok;
    } catch {
      this.backendConnected.set(false);
      return false;
    }
  }

  switchUser(userId: number): void {
    const user = this.users().find(u => u.userId === userId);
    if (user) {
      this.activeUserId.set(user.userId);
      this.activeAccountId.set(user.accounts[0].accountId);
      this.saveState();
    }
  }

  switchAccount(accountId: number): void {
    const user = this.currentUser();
    const acct = user.accounts.find(a => a.accountId === accountId);
    if (acct) {
      this.activeAccountId.set(acct.accountId);
      this.saveState();
    }
  }

  getInstrumentByTicker(ticker: string): Instrument | undefined {
    return this.instruments().find(i => i.ticker.toUpperCase() === ticker.toUpperCase());
  }

  getTrendingStocks(filter: TrendingFilter): Instrument[] {
    const list = [...this.instruments()];
    if (filter === 'gaining') {
      return list.sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
    } else if (filter === 'losing') {
      return list.sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);
    } else if (filter === 'volume') {
      return list.sort((a, b) => b.volume - a.volume).slice(0, 10);
    }
    // Default 'trending'
    return list.sort((a, b) => (a.trendingRank || 99) - (b.trendingRank || 99)).slice(0, 10);
  }

  executeTrade(params: { ticker: string; orderType: 'BUY' | 'SELL'; shares: number }): Order {
    const { ticker, orderType, shares } = params;
    const instrument = this.getInstrumentByTicker(ticker);

    if (!instrument) {
      throw new Error(`Instrument ${ticker} not found.`);
    }

    const currentAcct = this.currentAccount();
    const totalCost = shares * instrument.price;

    if (orderType === 'BUY') {
      if (currentAcct.cashBalance < totalCost) {
        throw new Error(
          `Insufficient cash. Needed: $${totalCost.toFixed(2)}, Available: $${currentAcct.cashBalance.toFixed(2)}`
        );
      }

      // Update user cash balance
      const updatedUsers = this.users().map(u => {
        if (u.userId === this.activeUserId()) {
          const updatedAccounts = u.accounts.map(a => {
            if (a.accountId === currentAcct.accountId) {
              return { ...a, cashBalance: a.cashBalance - totalCost };
            }
            return a;
          });
          return { ...u, accounts: updatedAccounts };
        }
        return u;
      });
      this.users.set(updatedUsers);

      // Update or insert holding
      const existing = this.rawHoldings().find(
        h => h.accountId === currentAcct.accountId && h.instrumentId === instrument.instrumentId
      );

      if (existing) {
        this.rawHoldings.update(prev =>
          prev.map(h => {
            if (h === existing) {
              return {
                ...h,
                quantity: h.quantity + shares,
                amountInvested: h.amountInvested + totalCost
              };
            }
            return h;
          })
        );
      } else {
        const nextHoldingId = Math.max(0, ...this.rawHoldings().map(h => h.holdingId)) + 1;
        this.rawHoldings.update(prev => [
          ...prev,
          {
            holdingId: nextHoldingId,
            accountId: currentAcct.accountId,
            instrumentId: instrument.instrumentId,
            quantity: shares,
            amountInvested: totalCost
          }
        ]);
      }
    } else {
      // SELL mode
      const existing = this.rawHoldings().find(
        h => h.accountId === currentAcct.accountId && h.instrumentId === instrument.instrumentId
      );

      if (!existing || existing.quantity < shares) {
        const owned = existing ? existing.quantity : 0;
        throw new Error(`Insufficient shares. You currently own ${owned} shares of ${ticker}.`);
      }

      const costBasisFraction = (existing.amountInvested / existing.quantity) * shares;

      if (existing.quantity - shares <= 0.0001) {
        // Remove holding entirely
        this.rawHoldings.update(prev => prev.filter(h => h !== existing));
      } else {
        this.rawHoldings.update(prev =>
          prev.map(h => {
            if (h === existing) {
              return {
                ...h,
                quantity: h.quantity - shares,
                amountInvested: h.amountInvested - costBasisFraction
              };
            }
            return h;
          })
        );
      }

      // Add proceeds to cash balance
      const updatedUsers = this.users().map(u => {
        if (u.userId === this.activeUserId()) {
          const updatedAccounts = u.accounts.map(a => {
            if (a.accountId === currentAcct.accountId) {
              return { ...a, cashBalance: a.cashBalance + totalCost };
            }
            return a;
          });
          return { ...u, accounts: updatedAccounts };
        }
        return u;
      });
      this.users.set(updatedUsers);
    }

    // Record order
    const nextOrderId = Math.max(100, ...this.orders().map(o => o.orderId)) + 1;
    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const newOrder: Order = {
      orderId: nextOrderId,
      accountId: currentAcct.accountId,
      instrumentId: instrument.instrumentId,
      orderType,
      quantity: shares,
      stockPrice: instrument.price,
      totalAmount: totalCost,
      status: 'FILLED',
      createdAt: timeStr,
      ticker: instrument.ticker,
      name: instrument.name
    };

    this.orders.update(prev => [newOrder, ...prev]);
    this.saveState();

    return newOrder;
  }
}
