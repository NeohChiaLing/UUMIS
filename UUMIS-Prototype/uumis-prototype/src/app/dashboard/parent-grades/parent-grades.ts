import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-grades.html',
  styles: []
})
export class ParentGradesComponent implements OnInit {

  currentUser: any = null;
  viewState: string = 'children';

  myChildren: any[] = [];
  selectedChild: any = null;

  grades: any[] = [];
  isLoading: boolean = false;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser && this.currentUser.role.toLowerCase() === 'parent') {
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {
          this.myChildren = students.filter(s => s.parentId === this.currentUser.id);
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  selectChild(child: any) {
    this.selectedChild = child;
    this.viewState = 'grades';
    this.loadGrades();
  }

  loadGrades() {
    this.isLoading = true;

    // THE FIX: Strictly use username.
    const targetUsername = this.selectedChild.username || '';

    // If it's a ghost account, stop here and show empty!
    if (!targetUsername) {
      this.grades = [];
      this.isLoading = false;
      return;
    }

    this.authService.getMyGrades(targetUsername).subscribe({
      next: (res: any[]) => {
        this.grades = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load grades', err);
        this.isLoading = false;
      }
    });
  }

  getGradeClass(grade: string): string {
    if (!grade) return 'text-slate-400 bg-slate-50 border border-slate-100';
    if (grade.startsWith('A')) return 'text-emerald-600 bg-emerald-50 border border-emerald-100';
    if (grade === 'F') return 'text-rose-600 bg-rose-50 border border-rose-100';
    if (grade === '-') return 'text-slate-400 bg-slate-50 border border-slate-100';
    return 'text-blue-600 bg-blue-50 border border-blue-100';
  }

  goBack(): void {
    if (this.viewState === 'grades') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.grades = [];
    } else {
      this.location.back();
    }
  }
}
