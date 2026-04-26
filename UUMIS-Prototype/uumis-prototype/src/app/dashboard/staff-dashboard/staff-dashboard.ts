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
  userRole: string = '';

  // Helpers for cleaner HTML logic
  isFinanceManager: boolean = false;
  isRegisterManager: boolean = false;
  isGeneralAdmin: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    const userData = localStorage.getItem('currentUser') || localStorage.getItem('user');

    if (userData) {
      const parsedUser = JSON.parse(userData);
      this.userEmail = parsedUser.email || '';

      // THE FIX: Grab the actual role from the database that we saved during login
      this.userRole = parsedUser.role ? parsedUser.role.toLowerCase().trim() : 'staff';

      // Set dashboard permissions based on their true database role, not just their email!
      this.isFinanceManager = this.userRole === 'financial_manager';
      this.isRegisterManager = this.userRole === 'register_manager';
      this.isGeneralAdmin = this.userRole === 'admin' || this.userRole === 'staff';

      console.log('Logged in as:', this.userEmail, '| Role:', this.userRole);
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
