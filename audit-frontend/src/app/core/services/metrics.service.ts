import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
    return this.http.get<AllMetricsResponse>(`${this.baseUrl}/all`);
  }

  getTradeVolumeByType(): Observable<TradeVolumeByType[]> {
    return this.http.get<{ data: TradeVolumeByType[] }>(`${this.baseUrl}/trade-volume/by-type`).pipe(
      map(res => res.data || [])
    );
  }

  getTradeVolumeByMarket(): Observable<TradeVolumeByMarket[]> {
    return this.http.get<{ data: TradeVolumeByMarket[] }>(`${this.baseUrl}/trade-volume/by-market`).pipe(
      map(res => res.data || [])
    );
  }

  getTradeVolumeBySide(): Observable<TradeVolumeBySide[]> {
    return this.http.get<{ data: TradeVolumeBySide[] }>(`${this.baseUrl}/trade-volume/by-side`).pipe(
      map(res => res.data || [])
    );
  }

  getTradeVolumeOverTime(): Observable<TradeVolumeOverTime[]> {
    return this.http.get<{ data: TradeVolumeOverTime[] }>(`${this.baseUrl}/trade-volume/over-time`).pipe(
      map(res => res.data || [])
    );
  }

  getOutlierTrades(): Observable<OutlierTrade[]> {
    return this.http.get<{ data: OutlierTrade[] }>(`${this.baseUrl}/outliers/trades`).pipe(
      map(res => res.data || [])
    );
  }

  getPnlOutliers(): Observable<OutlierPnl[]> {
    return this.http.get<{ data: OutlierPnl[] }>(`${this.baseUrl}/outliers/pnl`).pipe(
      map(res => res.data || [])
    );
  }

  getAum(): Observable<AumMetric[]> {
    return this.http.get<{ data: AumMetric[] }>(`${this.baseUrl}/revenue/aum`).pipe(
      map(res => res.data || [])
    );
  }

  getFeeRevenue(): Observable<FeeMetric[]> {
    return this.http.get<{ data: FeeMetric[] }>(`${this.baseUrl}/revenue/fees`).pipe(
      map(res => res.data || [])
    );
  }

  getRewardsVsVolume(): Observable<RewardsMetric[]> {
    return this.http.get<{ data: RewardsMetric[] }>(`${this.baseUrl}/rewards`).pipe(
      map(res => res.data || [])
    );
  }
}
