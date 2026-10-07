import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page';
import { SignupPageComponent } from './pages/signup-page/signup-page';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page';
import { AccountPageComponent } from './pages/account-page/account-page';
import {authGuard} from './services/auth-guard';

export const routes: Routes = [
  { path: '',
    pathMatch: 'full',
    redirectTo: 'login' },
  { path: 'login',
    component: LoginPageComponent },
  { path: 'signup',
    component: SignupPageComponent },
  { path: 'dashboard', canActivate:[authGuard],
    component: DashboardPageComponent },
  { path: 'account', canActivate:[authGuard],
    component: AccountPageComponent },
  { path: '**',
    redirectTo: 'login' },
];
