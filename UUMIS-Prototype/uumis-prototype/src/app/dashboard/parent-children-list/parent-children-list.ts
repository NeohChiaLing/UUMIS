import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // <-- Added Location
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-children-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-children-list.html'
})
export class ParentChildrenListComponent implements OnInit {
  myChildren: any[] = [];
  currentUser: any = null;
  isLoading: boolean = true;

  // <-- Added Location to the constructor
  constructor(private authService: AuthService, private router: Router, private location: Location) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {
          this.myChildren = students.filter(s => s.parentId === this.currentUser.id);
          this.isLoading = false;
        },
        error: () => {
          console.error('Failed to load children');
          this.isLoading = false;
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  viewProfile(childId: string) {
    sessionStorage.setItem('parentActiveChildId', childId);
    this.router.navigate(['/dashboard/parent/profile']);
  }

  // --- THE FIX: Added the goBack method! ---
  goBack() {
    this.location.back();
  }
}
