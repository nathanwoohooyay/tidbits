import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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

  ngOnInit() {
    const user = this.session.currentUser();
    console.log(user);
    if (!user) {
      void this.router.navigateByUrl('/login');
      return;
    }

    this.currentUsername.set(user.username);
    this.currentEmail.set(user.email);
    this.currentPhoneNumber.set(user.phoneNumber ?? '');
    this.updateEmail.set(this.currentEmail());
    this.updatePhoneNumber.set(this.currentPhoneNumber());
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

  goBack() {
    void this.router.navigateByUrl('/dashboard');
  }
}
