import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';
import { SessionService, SessionUser } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { AccountService } from '../../services/account.service';
import { OrderService, placedOrderDTO } from '../../services/order.service';
import { AccountOrderStats, DashboardInsightFeedComponent } from '../../components/dashboard/dashboard-insight-feed.component';
import { ReportOverview } from '../../components/dashboard/dashboard.models';
import { DashboardHeaderComponent } from '../../components/dashboard/dashboard-header.component';
import { SessionsPanelComponent } from '../../components/sessions-panel/sessions-panel.component';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardInsightFeedComponent, DashboardHeaderComponent, SessionsPanelComponent],
  templateUrl: './account-page.html',
  styleUrl: './account-page.css'
})
export class AccountPageComponent implements OnInit {
  private readonly session = inject(SessionService);
  private readonly userApi = inject(UserService);
  private readonly accountApi = inject(AccountService);
  private readonly orderApi = inject(OrderService);
  private readonly router = inject(Router);

  currentUsername = signal('');
  currentEmail = signal('');
  currentPhoneNumber = signal('');

  // Profile form state
  updateEmail = signal('');
  updatePhoneNumber = signal('');
  updateLoading = signal(false);
  updateError = signal('');
  updateSuccess = signal('');

  // Password change form state
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  passwordLoading = signal(false);
  passwordError = signal('');
  passwordSuccess = signal('');
  activePanel = signal<'account' | 'statistics'>('account');
  reportingOverview = signal<ReportOverview | null>(null);
  instrumentLabels = signal<Record<number, string>>({});
  accountOrderStats = signal<AccountOrderStats[]>([]);

  // The profile is usually already in the session (the dashboard loads it). Opened directly or reloaded, it isn't,
  // so it's fetched first; only when that fails does the user go back to sign in.
  ngOnInit() {
    const user = this.session.currentUser();
    if (user) {
      this.showUser(user);
      return;
    }

    const userId = this.session.getAuthenticatedUserId();
    if (!userId) {
      void this.router.navigateByUrl('/login');
      return;
    }
    this.userApi.getUser(userId).subscribe({
      next: loaded => {
        this.session.setCurrentUser(loaded);
        this.showUser(loaded);
      },
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  private showUser(user: SessionUser) {
    this.currentUsername.set(user.username);
    this.currentEmail.set(user.email);
    this.currentPhoneNumber.set(user.phoneNumber ?? '');
    this.updateEmail.set(this.currentEmail());
    this.updatePhoneNumber.set(this.currentPhoneNumber());
    this.loadStatistics(user.userId);
  }

  selectPanel(panel: 'account' | 'statistics') {
    this.activePanel.set(panel);
  }

  private loadStatistics(userId: number) {
    this.accountApi.listAccounts(userId).subscribe({
      next: accounts => {
        if (!accounts.length) {
          this.setStatistics([], []);
          return;
        }

        forkJoin(accounts.map(account => this.orderApi.getOrders(account.accountId))).subscribe({
          next: orderLists => this.setStatistics(accounts, orderLists),
          error: () => this.setStatistics(accounts, accounts.map(() => [])),
        });
      },
      error: () => this.setStatistics([], []),
    });
  }

  private setStatistics(accounts: { accountId: number; nickname: string }[], orderLists: placedOrderDTO[][]) {
    const orders = orderLists.flat();
    const volumeBySide = ['buy', 'sell'].map(side => {
      const sideOrders = orders.filter(order => order.orderType.toLowerCase() === side);
      return {
        side,
        total_value: sideOrders.reduce((total, order) => total + order.quantity * (order.price ?? 0), 0),
        order_count: sideOrders.length,
      };
    }).filter(item => item.order_count > 0);

    this.instrumentLabels.set(Object.fromEntries(
      orders.map(order => [order.instrument.instrumentId, order.instrument.ticker])
    ));
    this.accountOrderStats.set(accounts.map((account, index) => {
      const accountOrders = orderLists[index] ?? [];
      return {
        accountId: account.accountId,
        nickname: account.nickname,
        totalOrders: accountOrders.length,
        filledOrders: accountOrders.filter(order => order.status.toLowerCase() === 'filled').length,
        placedOrders: accountOrders.filter(order => order.status.toLowerCase() === 'placed').length,
        totalNotional: accountOrders.reduce((total, order) => total + order.quantity * (order.price ?? 0), 0),
      };
    }));
    this.reportingOverview.set({
      generatedAt: new Date().toISOString(),
      liveSummary: {
        totalOrders: orders.length,
        filledOrders: orders.filter(order => order.status.toLowerCase() === 'filled').length,
        placedOrders: orders.filter(order => order.status.toLowerCase() === 'placed').length,
        totalNotional: orders.reduce((total, order) => total + order.quantity * (order.price ?? 0), 0),
      },
      topInstrumentNotional: [],
      offlineMetrics: {
        available: true,
        source: 'account-orders',
        data: { trade_volume_by_side: volumeBySide },
      },
    });
  }

  async updateAccount() {
    const user = this.session.currentUser();
    if (!user) return;

    const nextEmail = this.updateEmail().trim();
    const nextPhoneNumber = this.updatePhoneNumber().trim();

    if (!nextEmail || !nextPhoneNumber) {
      this.updateError.set('Email and phone number are required.');
      return;
    }

    const emailChanged = nextEmail !== this.currentEmail().trim();
    const phoneChanged = nextPhoneNumber !== this.currentPhoneNumber().trim();

    if (!emailChanged && !phoneChanged) {
      this.updateError.set('No changes to save.');
      return;
    }

    this.updateLoading.set(true);
    this.updateError.set('');
    this.updateSuccess.set('');

    try {
      let updatedUser = user;

      if (emailChanged) {
        updatedUser = await firstValueFrom(this.userApi.changeEmail(user.userId, { newEmail: nextEmail }));
      }

      if (phoneChanged) {
        updatedUser = await firstValueFrom(this.userApi.changePhoneNumber(user.userId, { newPhoneNumber: nextPhoneNumber }));
      }

      //update stored user
      this.session.setCurrentUser({
        ...updatedUser,
        username: updatedUser.username,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
      });

// Update form values
      this.currentUsername.set(updatedUser.username);
      this.currentEmail.set(updatedUser.email);
      this.currentPhoneNumber.set(updatedUser.phoneNumber ?? nextPhoneNumber);
      this.updateEmail.set(this.currentEmail());
      this.updatePhoneNumber.set(this.currentPhoneNumber());
      this.updateSuccess.set('Account updated successfully.');
    } catch (err: any) {
      this.updateError.set(err?.error?.error ?? err?.error?.message ?? 'Failed to update account.');
    } finally {
      this.updateLoading.set(false);
    }
  }

  changePassword() {
    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.passwordError.set('All password fields are required.');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('New password and confirmation do not match.');
      return;
    }

    if (this.newPassword().length < 8) {
      this.passwordError.set('New password must be at least 8 characters.');
      return;
    }

    const user = this.session.currentUser();
    if (!user) return;

    this.passwordLoading.set(true);
    this.passwordError.set('');
    this.passwordSuccess.set('');

    this.userApi.changePassword(user.userId,  {
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
      confirmPassword: this.confirmPassword()
    }).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.passwordSuccess.set('Password changed successfully.');
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
      },
      error: err => {
        this.passwordLoading.set(false);
        this.passwordError.set(err?.error?.error ?? err?.error?.message ?? 'Failed to change password.');
      }
    });
  }
}
