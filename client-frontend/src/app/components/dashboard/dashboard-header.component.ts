import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Account, ThemeMode } from './dashboard.models';
import { formatCurrency } from './dashboard.utils';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-header.component.html'
})
export class DashboardHeaderComponent {
  @Input() accounts: Account[] = [];
  @Input() selectedAccountId = 0;
  @Input() themeMode: ThemeMode = 'light';

  @Output() accountChange = new EventEmitter<number>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>();

  readonly formatCurrency = formatCurrency;
  @Output() goToAccount = new EventEmitter<void>();

  onAccountSelect(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    if (Number.isFinite(value)) {
      this.accountChange.emit(value);
    }
  }
}

