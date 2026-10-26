import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page';
import { SignupPageComponent } from './pages/signup-page/signup-page';
import { AuthShellComponent } from './pages/auth-shell/auth-shell';
import {authGuard} from './services/auth-guard';

// Sign-in and sign-up load with the app; everything behind sign-in (and its charting library) loads on first visit.
export const routes: Routes = [
  { path: '',
    pathMatch: 'full',
    redirectTo: 'login' },
  // Sign-in and sign-up share one frame, so switching between them only swaps the form.
  { path: '',
    component: AuthShellComponent,
    children: [
      { path: 'login', component: LoginPageComponent },
      { path: 'signup', component: SignupPageComponent },
    ] },
  { path: 'dashboard', canActivate:[authGuard],
    loadComponent: () => import('./pages/dashboard-page/dashboard-page').then(m => m.DashboardPageComponent) },
  { path: 'maindashboard', canActivate:[authGuard],
    loadComponent: () => import('./pages/maindashboard-page/maindashboard').then(m => m.Maindashboard) },
  { path: 'account', canActivate:[authGuard],
    loadComponent: () => import('./pages/account-page/account-page').then(m => m.AccountPageComponent) },
  // Trading accounts are now managed from the Overview's Manage accounts panel.
  { path: 'account-management', redirectTo: 'maindashboard' },
  // Notifications live in the bell beside the dashboard search.
  { path: 'notifications', redirectTo: 'dashboard' },
  { path: 'rewards', canActivate:[authGuard],
    loadComponent: () => import('./pages/rewards-page/rewards-page').then(m => m.RewardsPageComponent) },
  { path: '**',
    loadComponent: () => import('./pages/not-found-page/not-found-page').then(m => m.NotFoundPageComponent) },
];
