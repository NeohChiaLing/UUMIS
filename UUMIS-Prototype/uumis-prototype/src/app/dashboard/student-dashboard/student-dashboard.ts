import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.css']
})
export class StudentDashboardComponent implements OnInit {

  currentUser: any = null;
  studentName: string = 'Student';
  todayDate: string = '';
  todayDayName: string = '';

  // Time-aware Arrays
  currentSubject: any = null;
  upcomingSubjects: any[] = [];
  completedSubjects: any[] = []; // NEW: Holds finished classes

  fullHeaders: string[] = [];
  fullRows: string[][] = [];
  days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

  private _showFullTimetable = false;
  get showFullTimetable() { return this._showFullTimetable; }
  set showFullTimetable(val: boolean) {
    this._showFullTimetable = val;
    sessionStorage.setItem('uumis_studentShowFullWeek', val ? 'true' : 'false');
  }

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const savedWeekView = sessionStorage.getItem('uumis_studentShowFullWeek');
    if (savedWeekView) this._showFullTimetable = (savedWeekView === 'true');

    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);

          const role = this.currentUser.role ? this.currentUser.role.toLowerCase().trim() : '';

          if (role !== 'student' && role !== 'parent') {
            alert('Access Denied: You are not authorized to view the Student Portal.');
            this.authService.logout();
            this.router.navigate(['/login']);
            return;
          }

          if (role === 'parent') {
            this.studentName = "My Child's Dashboard";
          } else {
            this.studentName = this.currentUser.fullName || this.currentUser.username;
          }

          let studentLevel = 'Kindergarten';
          if (this.currentUser.bio && this.currentUser.bio !== 'Unassigned' && role !== 'parent') {
            const parts = this.currentUser.bio.split('-');
            if (parts.length > 0) {
              studentLevel = parts[0].trim();
            }
          }

          const date = new Date();
          this.todayDate = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
          this.todayDayName = date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();

          this.loadTodayTimetable(studentLevel);

        } catch (e) {}
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  getInitials(name: string): string {
    if (!name) return 'ST';
    return name.trim().slice(0, 2).toUpperCase();
  }

  onLogout() {
    sessionStorage.clear();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleFullWeek() {
    this.showFullTimetable = !this.showFullTimetable;
  }

  loadTodayTimetable(level: string) {
    this.authService.getSchedule(level).subscribe({
      next: (res: any) => {
        if (res && res.headers && res.gridData) {
          const headers = JSON.parse(res.headers);
          const rows = JSON.parse(res.gridData);

          this.fullHeaders = headers;
          this.fullRows = rows;

          let dayIndex = this.days.indexOf(this.todayDayName);
          if (dayIndex === -1) {
            dayIndex = 0;
            this.todayDate += ' (Showing Sunday)';
          }

          if (dayIndex !== -1 && dayIndex < rows.length) {
            const todaySchedule = rows[dayIndex];
            const validSlots = [];

            // Get Current Live Time
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();

            // Logic to convert "8:00 AM" or "10.00" into raw minutes for math comparison
            const parseTime = (timeStr: string) => {
              const match = timeStr.match(/(\d+)[.:](\d+)\s*(AM|PM|am|pm)?/i);
              if (!match) return 0;
              let h = parseInt(match[1], 10);
              let m = parseInt(match[2], 10);
              const ampm = match[3]?.toUpperCase();
              if (ampm === 'PM' && h < 12) h += 12;
              if (ampm === 'AM' && h === 12) h = 0;
              if (!ampm && h < 7) h += 12; // Assume 1-6 without PM means afternoon
              return h * 60 + m;
            };

            for (let i = 0; i < todaySchedule.length; i++) {
              let subjectName = todaySchedule[i];
              if (subjectName && subjectName !== 'Rest / Recess' && subjectName !== '- Select Subject -' && subjectName.trim() !== '') {
                let headerText = headers[i] || '';
                let timeParts = headerText.split('-');
                let startTimeStr = timeParts[0] ? timeParts[0].trim() : '00:00 AM';
                let endTimeStr = timeParts[1] ? timeParts[1].trim() : '';

                validSlots.push({
                  time: startTimeStr,
                  endTimeStr: endTimeStr,
                  subject: subjectName,
                  room: 'Room TBA',
                  teacher: 'Subject Teacher',
                  startMins: parseTime(startTimeStr),
                  endMins: endTimeStr ? parseTime(endTimeStr) : parseTime(startTimeStr) + 60
                });
              }
            }

            // Sort chronologically
            validSlots.sort((a, b) => a.startMins - b.startMins);

            this.completedSubjects = [];
            this.currentSubject = null;
            this.upcomingSubjects = [];

            // Intelligently distribute classes based on REAL computer time
            for (let i = 0; i < validSlots.length; i++) {
              const slot = validSlots[i];
              // Close gaps between end time and next start time
              if (!slot.endTimeStr && i < validSlots.length - 1) {
                slot.endMins = validSlots[i+1].startMins;
              }

              if (currentMins >= slot.startMins && currentMins < slot.endMins) {
                this.currentSubject = slot;
              } else if (currentMins >= slot.endMins) {
                this.completedSubjects.push(slot);
              } else {
                this.upcomingSubjects.push(slot);
              }
            }
          }
        }
      },
      error: (err: any) => console.log('No schedule found for level: ' + level)
    });
  }
}
