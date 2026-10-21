import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReportOverview } from './dashboard.models';
import { formatCurrency } from './dashboard.utils';

@Component({
  selector: 'app-dashboard-insight-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-insight-feed.component.html'
})
export class DashboardInsightFeedComponent {
  @Input() reportingOverview: ReportOverview | null = null;
  @Input() instrumentLabels: Record<number, string> = {};

  readonly formatCurrency = formatCurrency;

  tradeVolumeBySide() {
    return this.reportingOverview?.offlineMetrics?.data?.trade_volume_by_side ?? [];
  }

  mostActiveMarkets() {
    return this.reportingOverview?.offlineMetrics?.data?.trade_volume_by_market?.slice(0, 4) ?? [];
  }

  instrumentLabel(instrumentId: number): string {
    return this.instrumentLabels[instrumentId] ?? `ID-${instrumentId}`;
  }
}

