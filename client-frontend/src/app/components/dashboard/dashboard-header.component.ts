import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ThemeMode } from './dashboard.models';
import {RouterLink} from '@angular/router';
import { AccountDto } from '../../services/account.service';
import { formatCurrency } from './dashboard.utils';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-header.component.html'
})
export class DashboardHeaderComponent {
  @Input() accounts: AccountDto[] = [];
  @Input() selectedAccountId = 0;
  @Input() themeMode: ThemeMode = 'light';
  @Input() showAccountSelector = true;
  @Input() rewardPoints = 0;

  @Output() accountChange = new EventEmitter<number>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>();

  readonly formatCurrency = formatCurrency;
  @Output() goToAccount = new EventEmitter<void>();
  @Output() goToAccountManagement = new EventEmitter<void>();
  @Output() goToRewards = new EventEmitter<void>();

  onAccountSelect(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    if (Number.isFinite(value)) {
      this.accountChange.emit(value);
    }
  }
}

