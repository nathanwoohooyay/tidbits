// Core Models

export type UserRole = 'ADMIN' | 'AUDITOR' | 'USER';

export interface AuthUser {
  userId?: number;
  username: string;
  role: UserRole;
  token: string;
  expiresAt?: number;
}

export interface LoginResponse {
  message?: string;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
}

export interface AdminUser {
  userId: number;
  username: string;
  email: string;
  phone: string;
  rewardPoints: number;
  role: string;
  createdAt: string;
}

export interface AdminAccount {
  accountId: number;
  userId: number;
  nickname: string;
  cashBalance: number;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalAccounts: number;
  totalUserLogs: number;
  totalTransactionLogs: number;
}

export interface UserLog {
  userLogId: number;
  userId: number;
  username?: string;
  action: string;
  event?: string;
  status: 'SUCCESS' | 'FAILURE' | string;
  ipAddress?: string;
  deviceInfo?: string;
  timestamp: string;
  happenedAt?: string;
}

export interface TransactionLog {
  logId: number;
  accountId: number;
  instrumentId: number;
  ticker?: string;
  orderType: string;
  quantity: number;
  price: number;
  status: string;
  timestamp: string;
}

// Metrics Models
export interface TradeVolumeByType {
  instrument_type: string;
  order_count: number;
  total_quantity: number;
  total_value: number;
  metric_type?: string;
  calculated_at?: string;
}

export interface TradeVolumeByMarket {
  market: string;
  order_count: number;
  total_quantity: number;
  total_value: number;
}

export interface TradeVolumeBySide {
  side: string;
  order_count: number;
  total_quantity: number;
  total_value: number;
}

export interface TradeVolumeOverTime {
  time_bucket?: string;
  trade_date?: string;
  order_count: number;
  total_quantity: number;
  total_value: number;
}

export interface OutlierTrade {
  order_id: number;
  account_id: number;
  instrument_id: number;
  ticker?: string;
  order_type?: string;
  quantity: number;
  stock_price: number;
  order_value?: number;
  z_score?: number;
  is_outlier?: boolean;
}

export interface OutlierPnl {
  account_id: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  total_pnl?: number;
  return_pct?: number;
  z_score?: number;
}

export interface AumMetric {
  account_id?: number;
  total_value?: number;
  cash_balance?: number;
  holdings_value?: number;
  calculated_at?: string;
}

export interface FeeMetric {
  trade_date?: string;
  fee_amount?: number;
  total_fees?: number;
  fee_type?: string;
}

export interface RewardsMetric {
  user_id: number;
  username?: string;
  reward_points: number;
  total_volume?: number;
  rewards_ratio?: number;
}

export interface AllMetricsResponse {
  data: {
    volume_by_type?: TradeVolumeByType[];
    volume_by_market?: TradeVolumeByMarket[];
    volume_by_side?: TradeVolumeBySide[];
    volume_over_time?: TradeVolumeOverTime[];
    outlier_trades?: OutlierTrade[];
    pnl_outliers?: OutlierPnl[];
    aum?: AumMetric[];
    fee_revenue?: FeeMetric[];
    rewards_volume?: RewardsMetric[];
    [key: string]: any;
  };
  calculatedAt: string;
}
