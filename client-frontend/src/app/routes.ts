import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page';
import { SignupPageComponent } from './pages/signup-page/signup-page';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page';

export const routes: Routes = [
  { path: '',
    pathMatch: 'full',
    redirectTo: 'login' },
  { path: 'login',
    component: LoginPageComponent },
  { path: 'signup',
    component: SignupPageComponent },
  { path: 'dashboard',
    component: DashboardPageComponent },
  { path: '**',
    redirectTo: 'login' },
];
