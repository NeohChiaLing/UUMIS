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
  studentUsername: string = '';

  constructor(private location: Location, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // 1. Get Logged-in Username
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.studentUsername = user.username;
        } catch (e) {}
      }
    }

    // 2. Load Attendance from DB
    this.loadMyAttendance();
  }

  loadMyAttendance() {
    if (!this.studentUsername) return;

    this.authService.getMyAttendance(this.studentUsername).subscribe({
      next: (records: any[]) => {
        // Map database entity to HTML bindings
        this.attendanceRecords = records.map(r => ({
          date: r.date,
          subject: 'Daily Attendance', // Attendance is logged daily, not by subject
          status: r.status,
          time: r.timeIn
        }));

        // Calculate dynamic Statistics
        const total = this.attendanceRecords.length;
        const presentOrLate = this.attendanceRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
        this.absentCount = this.attendanceRecords.filter(r => r.status === 'Absent').length;

        if (total > 0) {
          this.presentPercentage = Math.round((presentOrLate / total) * 100);
        } else {
          this.presentPercentage = 100; // Default to 100% if no logs yet
        }
      },
      error: () => console.log('Failed to fetch attendance.')
    });
  }

  goBack() {
    this.location.back();
  }
}
