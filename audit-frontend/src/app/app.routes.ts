import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { ShellComponent } from './features/shell/shell.component';
import { AnalyticsComponent } from './features/auditor/analytics/analytics.component';
import { ReportsComponent } from './features/auditor/reports/reports.component';
import { LogsComponent } from './features/auditor/logs/logs.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { authGuard, adminGuard, auditorGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'auditor/analytics'
      },
      // Auditor Routes
      {
        path: 'auditor/analytics',
        component: AnalyticsComponent,
        canActivate: [auditorGuard]
      },
      {
        path: 'auditor/reports',
        component: ReportsComponent,
        canActivate: [auditorGuard]
      },
      {
        path: 'auditor/logs',
        component: LogsComponent,
        canActivate: [auditorGuard]
      },
      // Admin Routes
      {
        path: 'admin/dashboard',
        component: AdminDashboardComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'admin/users',
        component: AdminUsersComponent,
        canActivate: [adminGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
