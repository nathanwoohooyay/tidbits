// Core Models

export type UserRole = 'ADMIN' | 'AUDITOR' | 'REPORTER' | 'USER';

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
  phoneNumber: string;
  rewardPoints: number;
  role?: string;
  createdAt: string;
}

export interface RoleDefinition {
  roleId: number;
  name: string;
}

export interface AdminAccount {
  accountId: number;
  userId: number;
  nickname: string;
  cashBalance: number;
  createdAt: string;
}

// From the gateway's service status check (see gateway/src/system-health.service.ts).
export type HealthStatus = 'up' | 'slow' | 'degraded' | 'down' | 'unknown';

export interface ComponentHealth {
  id: string;
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  reason?: string;
  lastSuccessAt?: string;
}

export interface SystemHealth {
  checkedAt: string;
  components: ComponentHealth[];
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
  // Browser and OS read from the user agent ("Chrome on macOS"); the raw header is kept for the tooltip.
  deviceInfo?: string;
  userAgent?: string;
  timestamp: string;
  happenedAt?: string;
}

export interface TransactionLog {
  logId: number;
  userId?: number;
  accountId: number;
  instrumentId: number;
  ticker?: string;
  transactionId?: number;
  orderId?: number;
  orderType: string;
  event?: string;
  quantity: number;
  price: number;
  stockPrice?: number;
  amount?: number;
  status: string;
  timestamp: string;
  happenedAt?: string;
}

export interface PointsLog {
  logId: number;
  userId: number;
  username?: string;
  accountId?: number;
  pointsTransactionId?: number;
  event: string;
  pointsDelta: number;
  balanceAfter?: number;
  cashValue?: number;
  instrumentId?: number;
  ticker?: string;
  quantity?: number;
  referenceId?: number;
  details?: string;
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
