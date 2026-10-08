import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, type SignupField, type SignupFieldErrors } from '../../services/auth.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,30}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

  readonly maxDateOfBirth = this.formatDateForInput(new Date());

  signupUsername = '';
  signupEmail = '';
  signupDateOfBirth = '';
  signupPhoneNumber = '';
  signupPassword = '';
  signupConfirmPassword = '';
  signupError = '';
  signupLoading = false;
  signupSuccess = '';
  signupFieldErrors: Record<SignupField | 'confirmPassword', string> = {
    username: '',
    email: '',
    dateOfBirth: '',
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
    const dateOfBirth = this.signupDateOfBirth.trim();
    const phoneNumber = this.signupPhoneNumber.trim();

    this.signupFieldErrors = {
      username: '',
      email: '',
      dateOfBirth: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    };

    const clientFieldErrors = this.validateSignupFields(username, email, dateOfBirth, phoneNumber);
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
      dateOfBirth,
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

  private validateSignupFields(username: string, email: string, dateOfBirth: string, phoneNumber: string): SignupFieldErrors & { confirmPassword?: string } {
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

    if (!dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required.';
    } else if (!this.isValidDateOfBirth(dateOfBirth)) {
      errors.dateOfBirth = 'Enter a valid date of birth.';
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

  private isValidDateOfBirth(dateOfBirth: string): boolean {
    if (!DATE_ONLY_REGEX.test(dateOfBirth)) {
      return false;
    }

    const [year, month, day] = dateOfBirth.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      Number.isNaN(parsedDate.getTime())
      || parsedDate.getUTCFullYear() !== year
      || parsedDate.getUTCMonth() !== month - 1
      || parsedDate.getUTCDate() !== day
    ) {
      return false;
    }

    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    return parsedDate <= todayUtc;
  }

  private formatDateForInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}


