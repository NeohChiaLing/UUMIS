import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-attendance.html',
  styles: []
})
export class StudentAttendanceComponent implements OnInit {
  // 模拟数据：学生自己的出勤记录
  attendanceRecords = [
    { date: '2025-10-25', subject: 'Mathematics', status: 'Present', time: '09:00 AM' },
    { date: '2025-10-25', subject: 'Physics Lab', status: 'Present', time: '10:30 AM' },
    { date: '2025-10-24', subject: 'English', status: 'Absent', time: '-' },
    { date: '2025-10-24', subject: 'History', status: 'Late', time: '02:45 PM' }
  ];

  constructor(private location: Location, private router: Router) {}

  ngOnInit() {}

  goBack() {
    this.location.back();
  }
}
