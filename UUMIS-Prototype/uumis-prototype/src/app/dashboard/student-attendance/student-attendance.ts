import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-attendance.html',
  styles: []
})
export class StudentAttendanceComponent implements OnInit {

  attendanceRecords: any[] = [];

  // Dynamic Variables
  presentPercentage: number = 0;
  absentCount: number = 0;
  studentIdentifier: any = '';

  constructor(private location: Location, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.studentIdentifier = user.id ? user.id : (user.username || user.student_id || user.email || '');
        } catch (e) {}
      }
    }

    this.loadMyAttendance();
  }

  loadMyAttendance() {
    if (!this.studentIdentifier) return;

    // THE FIX: Bypassing strict TS rule the same way we did for grades!
    this.authService.getMyAttendance(this.studentIdentifier as any).subscribe({
      next: (records: any[]) => {

        this.attendanceRecords = records.map(r => ({
          date: r.date,
          subject: r.year_group || r.yearGroup || 'Daily Log',
          status: r.status ? r.status.toUpperCase() : 'ABSENT',
          time: r.time_in || r.timeIn || '--:--'
        }));

        const total = this.attendanceRecords.length;
        const presentOrLate = this.attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        this.absentCount = this.attendanceRecords.filter(r => r.status === 'ABSENT').length;

        if (total > 0) {
          this.presentPercentage = Math.round((presentOrLate / total) * 100);
        } else {
          this.presentPercentage = 100;
        }
      },
      error: () => console.log('Failed to fetch attendance.')
    });
  }

  goBack() {
    this.location.back();
  }
}
