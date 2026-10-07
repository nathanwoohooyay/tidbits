import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDTO {
  user_id: number;
  username: string;
  email: string;
  role_id: number;
  reward_points: number;
}

export interface UserUpdateDTO {
  username?: string;
  email?: string;
}

export interface ChangePasswordDTO {
  oldPassword: string;
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

  updateUser(userId: number, payload: UserUpdateDTO): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.apiBase}/${userId}`, payload,);
  }

  changePassword(userId: number, payload: ChangePasswordDTO): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiBase}/${userId}/change-password`, payload);
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${userId}`);
  }
}
