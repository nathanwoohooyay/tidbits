import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page';
import { SignupPageComponent } from './pages/signup-page/signup-page';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page';
import { Maindashboard } from './pages/maindashboard-page/maindashboard';
import { AccountPageComponent } from './pages/account-page/account-page';
import { AccountManagementPageComponent } from './pages/account-management-page/account-management-page';
import { RewardsPageComponent } from './pages/rewards-page/rewards-page';
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
  { path: 'maindashboard', canActivate:[authGuard],
      component: Maindashboard },
  { path: 'account', canActivate:[authGuard],
    component: AccountPageComponent },
  { path: 'account-management', canActivate:[authGuard],
    component: AccountManagementPageComponent },
  { path: 'rewards', canActivate:[authGuard],
    component: RewardsPageComponent },
  { path: '**',
    redirectTo: 'login' },
];
