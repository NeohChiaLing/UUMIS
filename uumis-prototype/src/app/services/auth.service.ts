import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  // Mock User Database
  // IMPORTANT: The 'role' must be lowercase to match the Login Component switch cases.
  private users = [
    { username: 'admin@uumis.edu.my', password: '123', role: 'admin' },
    { username: 'student@uumis.edu.my', password: '123', role: 'student' },
    { username: 'teacher@uumis.edu.my', password: '123', role: 'teacher' },
    { username: 'staff@uumis.edu.my', password: '123', role: 'staff' },
    { username: 'parent@uumis.edu.my', password: '123', role: 'parent' }
  ];

  // Login: Returns the role string if successful, null if failed
  login(username: string, pass: string): string | null {
    const user = this.users.find(u => u.username === username && u.password === pass);

    if (user) {
      // Save role to localStorage so it persists on refresh
      localStorage.setItem('userRole', user.role);
      return user.role;
    }

    return null;
  }

  // Get Role: Used by dashboard components to display user info
  getRole(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('userRole');
    }
    return null;
  }

  // Logout: Clears the stored role
  logout() {
    localStorage.removeItem('userRole');
  }
}
