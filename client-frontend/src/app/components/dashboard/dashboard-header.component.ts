import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, effect, inject, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { AccountDto } from '../../services/account.service';
import { AuthSessionService } from '../../services/auth-session.service';
import { NOTIFICATION_POLL_MS, NotificationsService } from '../../services/notifications.service';
import { SessionService } from '../../services/session.service';
import { ThemeService } from '../../services/theme.service';
import { formatCurrency } from './dashboard.utils';
import { BrandLogoComponent } from '../brand-logo.component';

// App-wide navigation sidebar shown on every signed-in page. It owns the theme
// toggle and sign-out so pages only need to supply the account selector data,
// and checks for new notifications (toasts) while any signed-in page is open.
@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, BrandLogoComponent],
  templateUrl: './dashboard-header.component.html'
})
export class DashboardHeaderComponent {
  private readonly session = inject(SessionService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notifications = inject(NotificationsService);
  private readonly theme = inject(ThemeService);

  @Input() accounts: AccountDto[] = [];
  @Input() selectedAccountId = 0;
  @Input() showAccountSelector = true;
  @Input() rewardPoints: number | null = null;

  @Output() accountChange = new EventEmitter<number>();

  readonly formatCurrency = formatCurrency;
  readonly themeMode = this.theme.mode;
  private readonly sessionPoints = computed(() => this.session.currentUser()?.reward_points ?? 0);

  private readonly userId = this.session.getAuthenticatedUserId() ?? 0;
  private readonly notificationsQuery = injectQuery(() => ({
    ...this.notifications.list(this.userId),
    enabled: this.userId > 0,
    refetchInterval: NOTIFICATION_POLL_MS,
  }));

  constructor() {
    effect(() => {
      const list = this.notificationsQuery.data();
      if (list) {
        untracked(() => this.notifications.receive(this.userId, list));
      }
    });
  }

  get points(): number {
    return this.rewardPoints ?? this.sessionPoints();
  }

  toggleTheme() {
    this.theme.toggle();
  }

  signOut() {
    this.authSession.signOut();
  }

  onAccountSelect(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    if (Number.isFinite(value)) {
      this.accountChange.emit(value);
    }
  }
}
