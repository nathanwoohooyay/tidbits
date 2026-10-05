import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DashboardNotices } from './dashboard.models';

@Component({
  selector: 'app-dashboard-notices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-notices.component.html'
})
export class DashboardNoticesComponent {
  @Input() notices!: DashboardNotices;

  get hasNotices(): boolean {
    if (!this.notices) {
      return false;
    }

    return Boolean(
      this.notices.marketNotice ||
      this.notices.accountNotice ||
      this.notices.holdingsNotice ||
      this.notices.ordersNotice ||
      this.notices.reportingNotice
    );
  }
}

