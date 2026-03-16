import { Component } from '@angular/core';
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
export class StaffDashboardComponent {

  // Controls the Financial Dropdown in the sidebar
  isFinancialOpen = false;

  constructor(private router: Router, private authService: AuthService) {}

  toggleFinancial() {
    this.isFinancialOpen = !this.isFinancialOpen;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
