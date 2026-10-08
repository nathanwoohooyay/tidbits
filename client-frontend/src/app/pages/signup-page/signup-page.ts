import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, type SignupField, type SignupFieldErrors } from '../../services/auth.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,30}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/;

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup-page.html',
  styleUrl: './signup-page.css'
})
export class SignupPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  signupUsername = '';
  signupEmail = '';
  signupPhoneNumber = '';
  signupPassword = '';
  signupConfirmPassword = '';
  signupError = '';
  signupLoading = false;
  signupSuccess = '';
  signupFieldErrors: Record<SignupField | 'confirmPassword', string> = {
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  };

  onSignupInputChange(field: SignupField | 'confirmPassword') {
    this.signupError = '';
    this.signupSuccess = '';
    this.signupFieldErrors[field] = '';
  }

  signup() {
    const username = this.signupUsername.trim();
    const email = this.signupEmail.trim();
    const phoneNumber = this.signupPhoneNumber.trim();

    this.signupFieldErrors = {
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    };

    const clientFieldErrors = this.validateSignupFields(username, email, phoneNumber);
    this.signupFieldErrors = {
      ...this.signupFieldErrors,
      ...clientFieldErrors,
    };

    const firstFieldError = Object.values(this.signupFieldErrors).find(Boolean);
    if (firstFieldError) {
      this.signupError = firstFieldError;
      return;
    }

    this.signupLoading = true;
    this.signupError = '';
    this.signupSuccess = '';

    this.authService.signup({
      username,
      email,
      phoneNumber,
      password: this.signupPassword
    }).subscribe({
      next: async () => {
        this.signupLoading = false;
        this.signupSuccess = 'Registration successful. You can now sign in.';
        await this.router.navigateByUrl('/login');
      },
      error: err => {
        this.signupLoading = false;
        const backendFieldErrors = this.authService.getSignupFieldErrors(err);
        this.signupFieldErrors = {
          ...this.signupFieldErrors,
          ...backendFieldErrors,
        };
        this.signupError = this.authService.getSignupErrorMessage(err);
      }
    });
  }

  goToLogin() {
    void this.router.navigateByUrl('/login');
  }

  private validateSignupFields(username: string, email: string, phoneNumber: string): SignupFieldErrors & { confirmPassword?: string } {
    const errors: SignupFieldErrors & { confirmPassword?: string } = {};

    if (!username) {
      errors.username = 'Username is required.';
    } else if (!USERNAME_REGEX.test(username)) {
      errors.username = 'Username must be 3-30 characters and use only letters, numbers, periods, underscores, or hyphens.';
    }

    if (!email) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!phoneNumber) {
      errors.phoneNumber = 'Phone number is required.';
    } else if (!this.isValidUsPhoneNumber(phoneNumber)) {
      errors.phoneNumber = 'Enter a valid 10-digit US phone number.';
    }

    if (!this.signupPassword) {
      errors.password = 'Password is required.';
    } else if (!PASSWORD_REGEX.test(this.signupPassword)) {
      errors.password = 'Password must be 8-20 characters and include uppercase, lowercase, and a number.';
    }

    if (!this.signupConfirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (this.signupPassword !== this.signupConfirmPassword) {
      errors.confirmPassword = 'Password confirmation does not match.';
    }

    return errors;
  }

  private isValidUsPhoneNumber(phoneNumber: string): boolean {
    const normalizedDigits = phoneNumber.replace(/\D/g, '');
    return normalizedDigits.length === 10;
  }
}


