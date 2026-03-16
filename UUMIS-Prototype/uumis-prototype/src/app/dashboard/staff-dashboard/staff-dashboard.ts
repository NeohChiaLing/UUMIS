import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './staff-dashboard.html',
  styles: []
})
export class StaffDashboardComponent implements OnInit {
  isFinancialOpen = false;
  userEmail: string = '';

  // Helpers for cleaner HTML logic
  isFinanceManager: boolean = false;
  isRegisterManager: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    const userData = localStorage.getItem('currentUser') || localStorage.getItem('user');

    if (userData) {
      const parsedUser = JSON.parse(userData);
      this.userEmail = parsedUser.email || '';

      // Set roles based on email
      this.isFinanceManager = this.userEmail === 'finance@uumis.edu.my';
      this.isRegisterManager = this.userEmail === 'register@uumis.edu.my';

      console.log('Logged in as:', this.userEmail);
    } else {
      console.warn('No user data found in localStorage!');
    }
  }

  toggleFinancial() {
    this.isFinancialOpen = !this.isFinancialOpen;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
