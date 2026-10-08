import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, AdminAccount, AdminDashboardStats } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = environment.auditApiUrl;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.baseUrl}/admin/dashboard/stats`);
  }

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/admin/users`);
  }

  getUserById(userId: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}/admin/users/${userId}`);
  }

  getUserAccounts(userId: number): Observable<AdminAccount[]> {
    return this.http.get<AdminAccount[]>(`${this.baseUrl}/admin/users/${userId}/accounts`);
  }

  updateUserRole(userId: number, role: string): Observable<any> {
    const roleName = role === 'USER' ? 'CLIENT' : role;
    return this.http.put(`${this.baseUrl}/roles/users/${userId}`, { roleName });
  }

  revokeUserAccess(userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/${userId}/revoke`, {}, { responseType: 'text' });
  }
}
