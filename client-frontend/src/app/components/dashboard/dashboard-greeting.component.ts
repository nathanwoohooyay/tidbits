import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-greeting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-greeting.component.html'
})
export class DashboardGreetingComponent {
  @Input() username = '';
  @Input() accountNickname = '';
  @Input() today: Date = new Date();
  @Input() usingPlaceholderMarketData = false;
  @Input() accountCount = 0;
}


