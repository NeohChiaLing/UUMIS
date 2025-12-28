import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-dashboard.html',
  styles: []
})
export class TeacherDashboardComponent {

  isAcademicOpen = false;

  constructor(private router: Router, private authService: AuthService) {}

  toggleAcademic() {
    this.isAcademicOpen = !this.isAcademicOpen;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
