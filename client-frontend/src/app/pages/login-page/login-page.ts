import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  loginUsername = '';
  loginPassword = '';
  loginError = '';
  loginLoading = false;

  onLoginInputChange() {
    this.loginError = '';
  }

  login() {
    const username = this.loginUsername.trim();
    const password = this.loginPassword.trim();

    if (!username || !password) {
      this.loginError = 'Please enter username and password.';
      return;
    }

    this.loginLoading = true;
    this.loginError = '';

    this.authService.login(username, password).subscribe({
      next: async res => {
        if (!res?.token) {
          this.loginLoading = false;
          this.loginError = res?.error ?? 'Login failed. Check credentials.';
          return;
        }

        this.session.setAuthToken(res.token);
        this.loginLoading = false;
        await this.router.navigateByUrl('/dashboard');
      },
      error: err => {
        this.loginLoading = false;
        this.loginError = this.authService.getLoginErrorMessage(err);
      }
    });
  }
}

