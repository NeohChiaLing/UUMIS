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

  studentInitials: string = 'ST';
  studentGrade: string = 'Unassigned';
  showDashboardContent: boolean = true;

  todayDate: string = '';
  todayDayName: string = '';

  currentSubject: any = null;
  upcomingSubjects: any[] = [];
  completedSubjects: any[] = [];

  isMobileMenuOpen: boolean = false;

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

    // Use the reliable authService method
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      const role = this.currentUser.role ? this.currentUser.role.toLowerCase().trim() : '';

      if (role !== 'student' && role !== 'parent') {
        alert('Access Denied: You are not authorized to view the Student Portal.');
        this.authService.logout();
        this.router.navigate(['/login']);
        return;
      }

      if (role === 'parent') {
        this.studentName = "My Child's Dashboard";
        this.studentInitials = "PR";
        this.studentGrade = "N/A";
      } else {
        // THE FIX: Unpack JSON so Student sees their real name if populated
        let profileData: any = {};
        const rawJson = this.currentUser.profileJson || this.currentUser.profile_json;
        if (rawJson) {
          try {
            profileData = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
          } catch(e){}
        }

        let displayName = this.currentUser.fullName || this.currentUser.full_name || this.currentUser.username || 'Student User';
        if (profileData.firstName || profileData.lastName || profileData.familyName) {
          const fName = profileData.firstName || '';
          const mName = profileData.middleName || '';
          const lName = profileData.lastName || profileData.familyName || '';
          displayName = [fName, mName, lName].filter(Boolean).join(' ');
        }

        this.studentName = displayName;
        this.studentInitials = this.getInitials(this.studentName);
        this.studentGrade = this.currentUser.bio || 'Unassigned';
      }

      let exactScheduleKey = 'Kindergarten - Pre-Kindergarten';
      if (this.currentUser.bio && this.currentUser.bio !== 'Unassigned' && role !== 'parent') {
        exactScheduleKey = this.currentUser.bio.trim();
      }

      const date = new Date();
      this.todayDate = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      this.todayDayName = date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();

      this.loadTodayTimetable(exactScheduleKey);
    } else {
      this.router.navigate(['/login']);
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

  loadTodayTimetable(levelAndYearKey: string) {
    this.authService.getSchedule(levelAndYearKey).subscribe({
      next: (res: any) => {
        if (res && res.headers) {
          const headers = JSON.parse(res.headers);
          const rows = JSON.parse(res.gridData || res.grid_data);

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

            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();

            const parseTime = (timeStr: string) => {
              const match = timeStr.match(/(\d+)[.:](\d+)\s*(AM|PM|am|pm)?/i);
              if (!match) return 0;
              let h = parseInt(match[1], 10);
              let m = parseInt(match[2], 10);
              const ampm = match[3]?.toUpperCase();
              if (ampm === 'PM' && h < 12) h += 12;
              if (ampm === 'AM' && h === 12) h = 0;
              if (!ampm && h < 7) h += 12;
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

            validSlots.sort((a, b) => a.startMins - b.startMins);

            this.completedSubjects = [];
            this.currentSubject = null;
            this.upcomingSubjects = [];

            for (let i = 0; i < validSlots.length; i++) {
              const slot = validSlots[i];
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
      error: (err: any) => console.log('No schedule found for key: ' + levelAndYearKey)
    });
  }
}
