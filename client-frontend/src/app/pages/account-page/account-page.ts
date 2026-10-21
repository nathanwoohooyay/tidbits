import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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

  currentUsername = '';
  currentEmail = '';
  currentPhoneNumber = '';

  // Profile form state
  updateEmail = '';
  updatePhoneNumber = '';
  updateLoading = false;
  updateError = '';
  updateSuccess = '';

  // Password change form state
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = '';

  ngOnInit() {
    const user = this.session.currentUser();
    console.log(user);
    if (!user) {
      void this.router.navigateByUrl('/login');
      return;
    }

    this.currentUsername = user.username;
    this.currentEmail = user.email;
    this.currentPhoneNumber = user.phoneNumber ?? '';
    this.updateEmail = this.currentEmail;
    this.updatePhoneNumber = this.currentPhoneNumber;
  }

  async updateAccount() {
    const user = this.session.currentUser();
    if (!user) return;

    const nextEmail = this.updateEmail.trim();
    const nextPhoneNumber = this.updatePhoneNumber.trim();

    if (!nextEmail || !nextPhoneNumber) {
      this.updateError = 'Email and phone number are required.';
      return;
    }

    const emailChanged = nextEmail !== this.currentEmail.trim();
    const phoneChanged = nextPhoneNumber !== this.currentPhoneNumber.trim();

    if (!emailChanged && !phoneChanged) {
      this.updateError = 'No changes to save.';
      return;
    }

    this.updateLoading = true;
    this.updateError = '';
    this.updateSuccess = '';

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
      this.currentUsername = updatedUser.username;
      this.currentEmail = updatedUser.email;
      this.currentPhoneNumber = updatedUser.phoneNumber ?? nextPhoneNumber;
      this.updateEmail = this.currentEmail;
      this.updatePhoneNumber = this.currentPhoneNumber;
      this.updateSuccess = 'Account updated successfully.';
    } catch (err: any) {
      this.updateError = err?.error?.error ?? err?.error?.message ?? 'Failed to update account.';
    } finally {
      this.updateLoading = false;
    }
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
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

    this.userApi.changePassword(user.userId,  {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Password changed successfully.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: err => {
        this.passwordLoading = false;
        this.passwordError = err?.error?.error ?? err?.error?.message ?? 'Failed to change password.';
      }
    });
  }

  goBack() {
    void this.router.navigateByUrl('/dashboard');
  }
}
