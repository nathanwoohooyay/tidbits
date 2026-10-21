export type ThemeMode = 'light' | 'dark';
export type TrendFilter = 'trending' | 'gainers' | 'losers' | 'volume';
export type TradeMode = 'buy' | 'sell';
export type ChartTimeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface User {
  user_id: number;
  username: string;
  email: string;
  role_id: number;
  reward_points: number;
}

export interface Account {
  account_id: number;
  user_id: number;
  nickname: string;
  cash_balance: number;
  created_at: string;
}

export interface Instrument {
  instrument_id: number;
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
  sparkline: number[];
}

export interface Holding {
  account_id: number;
  instrument_id: number;
  quantity: number;
  amount_invested: number;
  ticker: string;
  name: string;
  type: string;
  market: string;
  currentPrice: number;
  changePercent: number;
  totalValue: number;
  avgCost: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
}

export interface Order {
  order_id: number;
  account_id: number;
  instrument_id: number;
  quantity: number;
  stock_price: number;
  order_type: string;
  status: string;
  ticker: string;
  name: string;
  created_at: string;
}

export interface ReportOverview {
  generatedAt: string;
  liveSummary: {
    totalOrders: number;
    filledOrders: number;
    acceptedOrders: number;
    totalNotional: number;
  };
  topInstrumentNotional: Array<{ instrumentId: number; notional: number }>;
  offlineMetrics: {
    available: boolean;
    source?: string;
    message?: string;
    data?: {
      trade_volume_by_side?: Array<{ side: string; total_value: number; order_count: number }>;
      trade_volume_by_market?: Array<{ market: string; total_value: number; order_count: number }>;
    };
  };
}

export interface DashboardNotices {
  marketNotice: string;
  holdingsNotice: string;
  ordersNotice: string;
  accountNotice: string;
  reportingNotice: string;
}

export interface ChartSeries {
  labels: string[];
  values: number[];
}

export type ChartDataMap = Record<ChartTimeframe, ChartSeries>;

export interface TradeExecution {
  instrumentId: number;
  orderType: TradeMode;
  quantity: number;
  stockPrice: number;
}

export interface QuickTradeSelection {
  instrumentId: number;
  mode: TradeMode;
}

export interface DashboardMockData {
  user: User;
  accounts: Account[];
  instruments: Instrument[];
  holdingsByAccount: Record<number, Holding[]>;
  ordersByAccount: Record<number, Order[]>;
  reportingOverview: ReportOverview;
  usingPlaceholderMarketData: boolean;
}

