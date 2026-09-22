export interface User {
  userId: number;
  roleId: number;
  username: string;
  fullName: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  rewardPoints: number;
  accounts: Account[];
}

export interface Account {
  accountId: number;
  userId?: number;
  nickname: string;
  cashBalance: number;
}

export interface Instrument {
  instrumentId: number;
  ticker: string;
  name: string;
  type: string;
  market: string;
  price: number;
  changePercent: number;
  changeAmount: number;
  volume: number;
  volumeFormatted: string;
  marketCap: string;
  dayHigh: number;
  dayLow: number;
  trendingRank: number;
  sparkline: number[];
}

export interface Holding {
  holdingId: number;
  accountId: number;
  instrumentId: number;
  quantity: number;
  amountInvested: number;
  // Computed fields
  ticker: string;
  name: string;
  currentPrice: number;
  avgCost: number;
  totalValue: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
  changePercent: number;
}

export interface Order {
  orderId: number;
  accountId: number;
  instrumentId: number;
  orderType: 'BUY' | 'SELL';
  quantity: number;
  stockPrice: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  ticker?: string;
  name?: string;
}

export interface PortfolioSummary {
  cashBalance: number;
  portfolioValue: number;
  totalNetWorth: number;
  totalInvested: number;
  totalUnrealizedGain: number;
  totalReturnPct: number;
  dayChangeAmount: number;
  dayChangePct: number;
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
export type TrendingFilter = 'trending' | 'gaining' | 'losing' | 'volume';
