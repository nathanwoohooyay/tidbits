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

export interface ChangeEmailDTO {
  newEmail: string;
}

export interface ChangePhoneNumberDTO {
  newPhoneNumber: string;
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

  changeEmail(userId: number, payload: ChangeEmailDTO): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiBase}/${userId}/change-email`, payload);
  }

  changePhoneNumber(userId: number, payload: ChangePhoneNumberDTO): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiBase}/${userId}/change-phone-number`, payload);
  }

  changePassword(userId: number, payload: ChangePasswordDTO): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiBase}/${userId}/change-password`, payload);
  }

}
