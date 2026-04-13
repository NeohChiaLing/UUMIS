import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Make sure this points to your Spring Boot Port (8080)
  private apiUrl = 'https://uumis.com.my/api';

  constructor(private http: HttpClient) { }

  // --- 1. LOGIN ---
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // --- 2. REGISTER ---
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  // --- 3. VERIFY EMAIL (For Registration) ---
  verify(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify`, { email, code });
  }

  // --- 4. FORGOT PASSWORD ---
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  // --- 5. RESET PASSWORD ---
  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  // --- 6. ADMIN DELETE USER ---
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }
}
