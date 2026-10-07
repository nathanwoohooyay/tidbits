import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AllMetricsResponse,
  TradeVolumeByType,
  TradeVolumeByMarket,
  TradeVolumeBySide,
  TradeVolumeOverTime,
  OutlierTrade,
  OutlierPnl,
  AumMetric,
  FeeMetric,
  RewardsMetric
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private readonly baseUrl = `${environment.metricsApiUrl}/metrics`;

  constructor(private http: HttpClient) {}

  getAllMetrics(): Observable<AllMetricsResponse> {
    return this.http.get<AllMetricsResponse>(`${this.baseUrl}/all`).pipe(
      catchError(() => of(this.getMockAllMetrics()))
    );
  }

  getTradeVolumeByType(): Observable<TradeVolumeByType[]> {
    return this.http.get<{ data: TradeVolumeByType[] }>(`${this.baseUrl}/trade-volume/by-type`).pipe(
      map(res => res.data || []),
      catchError(() => of(this.getMockVolumeByType()))
    );
  }

  getTradeVolumeByMarket(): Observable<TradeVolumeByMarket[]> {
    return this.http.get<{ data: TradeVolumeByMarket[] }>(`${this.baseUrl}/trade-volume/by-market`).pipe(
      map(res => res.data || []),
      catchError(() => of(this.getMockVolumeByMarket()))
    );
  }

  getTradeVolumeBySide(): Observable<TradeVolumeBySide[]> {
    return this.http.get<{ data: TradeVolumeBySide[] }>(`${this.baseUrl}/trade-volume/by-side`).pipe(
      map(res => res.data || []),
      catchError(() => of(this.getMockVolumeBySide()))
    );
  }

  getTradeVolumeOverTime(): Observable<TradeVolumeOverTime[]> {
    return this.http.get<{ data: TradeVolumeOverTime[] }>(`${this.baseUrl}/trade-volume/over-time`).pipe(
      map(res => res.data || []),
      catchError(() => of(this.getMockVolumeOverTime()))
    );
  }

  getOutlierTrades(): Observable<OutlierTrade[]> {
    return this.http.get<{ data: OutlierTrade[] }>(`${this.baseUrl}/outliers/trades`).pipe(
      map(res => res.data || []),
      catchError(() => of(this.getMockOutlierTrades()))
    );
  }

  getPnlOutliers(): Observable<OutlierPnl[]> {
    return this.http.get<{ data: OutlierPnl[] }>(`${this.baseUrl}/outliers/pnl`).pipe(
      map(res => res.data || []),
      catchError(() => of(this.getMockPnlOutliers()))
    );
  }

  getAum(): Observable<AumMetric[]> {
    return this.http.get<{ data: AumMetric[] }>(`${this.baseUrl}/revenue/aum`).pipe(
      map(res => res.data || []),
      catchError(() => of(this.getMockAum()))
    );
  }

  getFeeRevenue(): Observable<FeeMetric[]> {
    return this.http.get<{ data: FeeMetric[] }>(`${this.baseUrl}/revenue/fees`).pipe(
      map(res => res.data || []),
      catchError(() => of(this.getMockFees()))
    );
  }

  getRewardsVsVolume(): Observable<RewardsMetric[]> {
    return this.http.get<{ data: RewardsMetric[] }>(`${this.baseUrl}/rewards`).pipe(
      map(res => res.data || []),
      catchError(() => of(this.getMockRewards()))
    );
  }

  // Realistic fallback mock data for testing/offline resilience
  private getMockAllMetrics(): AllMetricsResponse {
    return {
      data: {
        volume_by_type: this.getMockVolumeByType(),
        volume_by_market: this.getMockVolumeByMarket(),
        volume_by_side: this.getMockVolumeBySide(),
        volume_over_time: this.getMockVolumeOverTime(),
        outlier_trades: this.getMockOutlierTrades(),
        pnl_outliers: this.getMockPnlOutliers(),
        aum: this.getMockAum(),
        fee_revenue: this.getMockFees(),
        rewards_volume: this.getMockRewards()
      },
      calculatedAt: new Date().toISOString()
    };
  }

  private getMockVolumeByType(): TradeVolumeByType[] {
    return [
      { instrument_type: 'equity', order_count: 1420, total_quantity: 84500, total_value: 12450000 },
      { instrument_type: 'etf', order_count: 610, total_quantity: 32000, total_value: 4180000 },
      { instrument_type: 'crypto', order_count: 380, total_quantity: 12500, total_value: 2950000 },
      { instrument_type: 'option', order_count: 190, total_quantity: 5400, total_value: 940000 }
    ];
  }

  private getMockVolumeByMarket(): TradeVolumeByMarket[] {
    return [
      { market: 'US', order_count: 1850, total_quantity: 112000, total_value: 16800000 },
      { market: 'GLOBAL', order_count: 420, total_quantity: 21000, total_value: 2850000 },
      { market: 'CRYPTO_EX', order_count: 330, total_quantity: 11400, total_value: 870000 }
    ];
  }

  private getMockVolumeBySide(): TradeVolumeBySide[] {
    return [
      { side: 'BUY', order_count: 1540, total_quantity: 78000, total_value: 11200000 },
      { side: 'SELL', order_count: 1060, total_quantity: 56400, total_value: 9320000 }
    ];
  }

  private getMockVolumeOverTime(): TradeVolumeOverTime[] {
    const dates = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06'];
    return dates.map((d, i) => ({
      time_bucket: d,
      trade_date: d,
      order_count: 140 + Math.floor(Math.sin(i) * 50) + i * 8,
      total_quantity: 8500 + i * 620,
      total_value: 1250000 + i * 95000 + (i % 2 === 0 ? 120000 : -80000)
    }));
  }

  private getMockOutlierTrades(): OutlierTrade[] {
    return [
      { order_id: 1042, account_id: 12, instrument_id: 1, ticker: 'AAPL', order_type: 'BUY', quantity: 5000, stock_price: 242.50, order_value: 1212500, z_score: 3.84, is_outlier: true },
      { order_id: 1189, account_id: 28, instrument_id: 3, ticker: 'NVDA', order_type: 'SELL', quantity: 3800, stock_price: 138.20, order_value: 525160, z_score: 3.12, is_outlier: true },
      { order_id: 1254, account_id: 45, instrument_id: 11, ticker: 'TSLA', order_type: 'BUY', quantity: 4200, stock_price: 275.40, order_value: 1156680, z_score: 3.65, is_outlier: true },
      { order_id: 1302, account_id: 104, instrument_id: 6, ticker: 'GOOG', order_type: 'BUY', quantity: 2900, stock_price: 185.00, order_value: 536500, z_score: 2.89, is_outlier: true }
    ];
  }

  private getMockPnlOutliers(): OutlierPnl[] {
    return [
      { account_id: 12, realized_pnl: 142500, return_pct: 42.5, z_score: 3.42 },
      { account_id: 88, realized_pnl: -89400, return_pct: -31.2, z_score: -3.15 },
      { account_id: 45, realized_pnl: 112000, return_pct: 36.8, z_score: 2.95 }
    ];
  }

  private getMockAum(): AumMetric[] {
    return [
      { account_id: 1, total_value: 28400000, cash_balance: 9200000, holdings_value: 19200000, calculated_at: new Date().toISOString() }
    ];
  }

  private getMockFees(): FeeMetric[] {
    return [
      { trade_date: '2026-10-01', total_fees: 4850, fee_type: 'TRANSACTION' },
      { trade_date: '2026-10-02', total_fees: 5210, fee_type: 'TRANSACTION' },
      { trade_date: '2026-10-03', total_fees: 6140, fee_type: 'TRANSACTION' },
      { trade_date: '2026-10-04', total_fees: 3950, fee_type: 'TRANSACTION' },
      { trade_date: '2026-10-05', total_fees: 5890, fee_type: 'TRANSACTION' },
      { trade_date: '2026-10-06', total_fees: 6420, fee_type: 'TRANSACTION' }
    ];
  }

  private getMockRewards(): RewardsMetric[] {
    return [
      { user_id: 12, username: 'alpha_trader', reward_points: 14500, total_volume: 2450000, rewards_ratio: 0.0059 },
      { user_id: 45, username: 'quant_fund', reward_points: 9800, total_volume: 1840000, rewards_ratio: 0.0053 },
      { user_id: 28, username: 'institutional_x', reward_points: 8200, total_volume: 1420000, rewards_ratio: 0.0058 }
    ];
  }
}
