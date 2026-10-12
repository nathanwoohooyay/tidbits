import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDTO {
  userId: number;
  username: string;
  email: string;
  phoneNumber: string;
  role_id: number;
  reward_points: number;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly apiBase = '/api/users';

  getUser(userId: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiBase}/${userId}`);
  }

  changeEmail(userId: number, newEmail: string): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiBase}/${userId}/change-email`, newEmail);
  }

  changePhoneNumber(userId: number, newPhoneNumber: string): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiBase}/${userId}/change-phone-number`, newPhoneNumber);
  }

  changePassword(userId: number, payload: ChangePasswordDTO): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiBase}/${userId}/change-password`, payload);
  }

}
