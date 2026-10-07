import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-page.html',
  styleUrl: './account-page.css'
})
export class AccountPageComponent implements OnInit {
  private readonly session = inject(SessionService);
  private readonly userApi = inject(UserService);
  private readonly router = inject(Router);

  currentUsername = '';

  // Update form state
  updateUsername = '';
  updateEmail = '';
  updateLoading = false;
  updateError = '';
  updateSuccess = '';

  // Password change form state
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = '';

  // Delete account state
  deleteLoading = false;
  deleteError = '';
  deleteConfirmation = '';
  showDeleteConfirm = false;

  ngOnInit() {
    const user = this.session.currentUser();
    if (!user) {
      void this.router.navigateByUrl('/login');
      return;
    }

    this.currentUsername = user.username;
    this.updateUsername = user.username;
    this.updateEmail = user.email;
  }

  updateAccount() {
    const user = this.session.currentUser();
    if (!user) return;

    if (!this.updateUsername.trim() || !this.updateEmail.trim()) {
      this.updateError = 'Username and email are required.';
      return;
    }

    this.updateLoading = true;
    this.updateError = '';
    this.updateSuccess = '';

    this.userApi.updateUser(user.user_id, {
      username: this.updateUsername.trim(),
      email: this.updateEmail.trim()
    }).subscribe({
      next: (updatedUser) => {
        this.updateLoading = false;
        this.updateSuccess = 'Account updated successfully.';
        this.session.setCurrentUser(updatedUser as any);
        this.currentUsername = updatedUser.username;
      },
      error: err => {
        this.updateLoading = false;
        this.updateError = err?.error?.error ?? err?.error?.message ?? 'Failed to update account.';
      }
    });
  }

  changePassword() {
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'All password fields are required.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'New password and confirmation do not match.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.passwordError = 'New password must be at least 8 characters.';
      return;
    }

    const user = this.session.currentUser();
    if (!user) return;

    this.passwordLoading = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.userApi.changePassword(user.user_id,  {
      oldPassword: this.oldPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Password changed successfully.';
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: err => {
        this.passwordLoading = false;
        this.passwordError = err?.error?.error ?? err?.error?.message ?? 'Failed to change password.';
      }
    });
  }

  toggleDeleteConfirm() {
    this.showDeleteConfirm = !this.showDeleteConfirm;
    this.deleteConfirmation = '';
    this.deleteError = '';
  }

  deleteAccount() {
    const user = this.session.currentUser();
    if (!user) return;

    if (this.deleteConfirmation !== user.username) {
      this.deleteError = 'Please type your username to confirm deletion.';
      return;
    }

    this.deleteLoading = true;
    this.deleteError = '';

    this.userApi.deleteUser(user.user_id).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.session.clearSession();
        void this.router.navigateByUrl('/login');
      },
      error: err => {
        this.deleteLoading = false;
        this.deleteError = err?.error?.error ?? err?.error?.message ?? 'Failed to delete account.';
      }
    });
  }

  goBack() {
    void this.router.navigateByUrl('/dashboard');
  }
}
