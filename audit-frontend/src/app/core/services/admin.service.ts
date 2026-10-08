import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, AdminAccount, AdminDashboardStats } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = environment.auditApiUrl;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.baseUrl}/admin/dashboard/stats`).pipe(
      catchError(() => of({
        totalUsers: 148,
        totalAccounts: 215,
        totalUserLogs: 8420,
        totalTransactionLogs: 24900
      }))
    );
  }

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/admin/users`).pipe(
      catchError(() => of(this.getMockUsers()))
    );
  }

  getUserById(userId: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}/admin/users/${userId}`);
  }

  getUserAccounts(userId: number): Observable<AdminAccount[]> {
    return this.http.get<AdminAccount[]>(`${this.baseUrl}/admin/users/${userId}/accounts`).pipe(
      catchError(() => of(this.getMockAccounts(userId)))
    );
  }

  updateUserRole(userId: number, role: string): Observable<any> {
    const roleName = role === 'USER' ? 'CLIENT' : role;
    return this.http.put(`${this.baseUrl}/roles/users/${userId}`, { roleName });
  }

  revokeUserAccess(userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/${userId}/revoke`, {}, { responseType: 'text' });
  }

  private getMockUsers(): AdminUser[] {
    return [
      { userId: 1, username: 'admin_sys', email: 'admin@tidbits.finance', phone: '+1-555-0100', rewardPoints: 2500, role: 'ADMIN', createdAt: '2026-01-15T09:00:00Z' },
      { userId: 2, username: 'auditor_sarah', email: 'sarah.audit@tidbits.finance', phone: '+1-555-0142', rewardPoints: 1200, role: 'AUDITOR', createdAt: '2026-02-01T10:30:00Z' },
      { userId: 3, username: 'auditor_david', email: 'david.c@tidbits.finance', phone: '+1-555-0189', rewardPoints: 950, role: 'AUDITOR', createdAt: '2026-02-18T14:15:00Z' },
      { userId: 4, username: 'trader_elena', email: 'elena.rostova@quant.io', phone: '+1-555-0211', rewardPoints: 18450, role: 'USER', createdAt: '2026-03-05T11:20:00Z' },
      { userId: 5, username: 'trader_marcus', email: 'marcus.vance@apexcap.com', phone: '+1-555-0278', rewardPoints: 9400, role: 'USER', createdAt: '2026-03-12T08:45:00Z' },
      { userId: 6, username: 'retail_olivia', email: 'olivia.chen@gmail.com', phone: '+1-555-0312', rewardPoints: 420, role: 'USER', createdAt: '2026-04-02T16:20:00Z' },
      { userId: 7, username: 'vip_sterling', email: 'j.sterling@sterlingholdings.ch', phone: '+41-22-555-901', rewardPoints: 34100, role: 'USER', createdAt: '2026-04-18T13:10:00Z' }
    ];
  }

  private getMockAccounts(userId: number): AdminAccount[] {
    return [
      { accountId: 100 + userId, userId, nickname: 'Primary Trading Account', cashBalance: 125400.50, createdAt: '2026-03-01T10:00:00Z' },
      { accountId: 200 + userId, userId, nickname: 'Hedge / Growth Sub-Account', cashBalance: 48900.00, createdAt: '2026-04-15T12:00:00Z' }
    ];
  }
}
