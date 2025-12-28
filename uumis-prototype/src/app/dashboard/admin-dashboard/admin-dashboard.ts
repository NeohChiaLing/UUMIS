import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
// 1. 引入 LanguageService
import { LanguageService } from '../../language.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent {

  isAcademicOpen = false;
  isFinancialOpen = false;

  get showDashboardContent(): boolean {
    return this.router.url === '/dashboard/admin';
  }

  // 2. 这里的 'public lang' 是必须的，这样 HTML 才能访问到它
  constructor(private router: Router, public lang: LanguageService) {}

  toggleAcademic() { this.isAcademicOpen = !this.isAcademicOpen; }
  toggleFinancialMenu() { this.isFinancialOpen = !this.isFinancialOpen; }

  onLogout() {
    this.router.navigate(['/login']);
  }
}
