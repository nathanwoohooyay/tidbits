import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AccountDto } from '../../services/account.service';
import { SessionService } from '../../services/session.service';
import { ThemeService } from '../../services/theme.service';
import { formatCurrency } from './dashboard.utils';
import { BrandLogoComponent } from '../brand-logo.component';

// App-wide navigation sidebar shown on every signed-in page. It owns the theme
// toggle and sign-out so pages only need to supply the account selector data.
@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, BrandLogoComponent],
  templateUrl: './dashboard-header.component.html'
})
export class DashboardHeaderComponent {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly theme = inject(ThemeService);

  @Input() accounts: AccountDto[] = [];
  @Input() selectedAccountId = 0;
  @Input() showAccountSelector = true;
  @Input() rewardPoints: number | null = null;

  @Output() accountChange = new EventEmitter<number>();

  readonly formatCurrency = formatCurrency;
  readonly themeMode = this.theme.mode;
  private readonly sessionPoints = computed(() => this.session.currentUser()?.reward_points ?? 0);

  get points(): number {
    return this.rewardPoints ?? this.sessionPoints();
  }

  toggleTheme() {
    this.theme.toggle();
  }

  signOut() {
    this.session.clearSession();
    void this.router.navigateByUrl('/login');
  }

  onAccountSelect(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    if (Number.isFinite(value)) {
      this.accountChange.emit(value);
    }
  }
}
