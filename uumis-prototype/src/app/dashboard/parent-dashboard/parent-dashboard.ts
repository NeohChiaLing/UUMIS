import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './parent-dashboard.html',
  styles: []
})
export class ParentDashboardComponent {

  // Logic for the Financial Dropdown
  isFinancialMenuOpen: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  toggleFinancialMenu(): void {
    this.isFinancialMenuOpen = !this.isFinancialMenuOpen;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
