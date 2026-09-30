import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  signup() {
    if (!this.signupUsername.trim() || !this.signupEmail.trim() || !this.signupPhoneNumber.trim()) {
      this.signupError = 'Username, email, and phone number are required.';
      return;
    }

    if (!this.signupPassword || !this.signupConfirmPassword) {
      this.signupError = 'Password and confirmation are required.';
      return;
    }

    if (this.signupPassword !== this.signupConfirmPassword) {
      this.signupError = 'Password confirmation does not match.';
      return;
    }

    this.signupLoading = true;
    this.signupError = '';
    this.signupSuccess = '';

    this.authService.signup({
      username: this.signupUsername.trim(),
      email: this.signupEmail.trim(),
      phoneNumber: this.signupPhoneNumber.trim(),
      password: this.signupPassword
    }).subscribe({
      next: async () => {
        this.signupLoading = false;
        this.signupSuccess = 'Registration successful. You can now sign in.';
        await this.router.navigateByUrl('/login');
      },
      error: err => {
        this.signupLoading = false;
        this.signupError = err?.error?.error ?? err?.error?.message ?? 'Registration failed. Please review your details and try again.';
      }
    });
  }

  goToLogin() {
    void this.router.navigateByUrl('/login');
  }
}


