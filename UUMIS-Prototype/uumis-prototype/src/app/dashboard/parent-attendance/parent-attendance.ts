import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-attendance.html',
  styles: []
})
export class ParentAttendanceComponent implements OnInit {

  currentUser: any = null;
  viewState: string = 'children';

  myChildren: any[] = [];
  selectedChild: any = null;

  attendanceRecords: any[] = [];
  isLoading: boolean = false;

  // Dynamic calculations
  presentPercentage: number = 100;
  absentDays: number = 0;

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
    this.viewState = 'attendance';
    this.loadAttendance();
  }

  loadAttendance() {
    this.isLoading = true;

    // Use the bulletproof identifier fallback!
    const targetUsername = this.selectedChild.username || this.selectedChild.email || this.selectedChild.id.toString();

    if (!targetUsername) {
      this.attendanceRecords = [];
      this.calculateStats();
      this.isLoading = false;
      return;
    }

    // Assuming your authService has a method to get attendance by username (similar to grades)
    // If your method is named differently (e.g., getStudentAttendance), update it here.
    this.authService.getMyAttendance(targetUsername).subscribe({
      next: (res: any[]) => {
        this.attendanceRecords = res || [];
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load attendance', err);
        this.attendanceRecords = [];
        this.calculateStats();
        this.isLoading = false;
      }
    });
  }

  calculateStats() {
    if (this.attendanceRecords.length === 0) {
      this.presentPercentage = 0; // Or 100, depending on how you want to show a blank slate
      this.absentDays = 0;
      return;
    }

    const totalDays = this.attendanceRecords.length;

    // Count exactly how many days the status was "Absent"
    this.absentDays = this.attendanceRecords.filter(r =>
      r.status && r.status.toLowerCase() === 'absent'
    ).length;

    const presentDays = totalDays - this.absentDays;

    // Calculate percentage and round to nearest whole number
    this.presentPercentage = Math.round((presentDays / totalDays) * 100);
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'present') return 'bg-emerald-100 text-emerald-700';
    if (s === 'absent') return 'bg-rose-100 text-rose-700';
    if (s === 'late') return 'bg-orange-100 text-orange-700';
    if (s === 'excused') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-500';
  }

  goBack(): void {
    if (this.viewState === 'attendance') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.attendanceRecords = [];
      this.presentPercentage = 100;
      this.absentDays = 0;
    } else {
      this.location.back();
    }
  }
}
