import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './parent-dashboard.html',
  styleUrls: ['./parent-dashboard.css']
})
export class ParentDashboardComponent implements OnInit {

  currentUser: any = null;
  parentName: string = 'Parent';
  todayDate: string = '';
  todayDayName: string = '';

  myChildren: any[] = []; // NEW: Holds all linked children
  isChildDropdownOpen: boolean = false; // NEW: Controls the top dropdown

  linkedChildData: any = null;
  recentGrades: any[] = [];

  currentSubject: any = null;
  upcomingSubjects: any[] = [];
  completedSubjects: any[] = [];

  fullHeaders: string[] = [];
  fullRows: string[][] = [];
  days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

  isFinancialMenuOpen = false;

  private _showFullTimetable = false;
  get showFullTimetable() { return this._showFullTimetable; }
  set showFullTimetable(val: boolean) {
    this._showFullTimetable = val;
    sessionStorage.setItem('uumis_parentShowFullWeek', val ? 'true' : 'false');
  }

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const savedWeekView = sessionStorage.getItem('uumis_parentShowFullWeek');
    if (savedWeekView) this._showFullTimetable = (savedWeekView === 'true');

    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      const role = this.currentUser.role ? this.currentUser.role.toLowerCase().trim() : '';
      if (role !== 'parent') {
        this.router.navigate(['/login']);
        return;
      }

      this.parentName = this.currentUser.fullName || this.currentUser.username;
      const date = new Date();
      this.todayDate = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      this.todayDayName = date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();

      // --- THE FIX: Fetch ALL children for this parent! ---
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {
          this.myChildren = students.filter(s => s.parentId === this.currentUser.id);

          if (this.myChildren.length > 0) {
            // Check if they previously selected a specific child, otherwise default to the first one
            const savedChildId = sessionStorage.getItem('parentActiveChildId');
            const activeChild = savedChildId ? this.myChildren.find(c => c.id === savedChildId) : this.myChildren[0];

            if (activeChild) {
              this.switchActiveChild(activeChild);
            } else {
              this.switchActiveChild(this.myChildren[0]);
            }
          }
        },
        error: () => console.error("Failed to load children list")
      });

    } else {
      this.router.navigate(['/login']);
    }
  }

  // --- NEW: Switch active child context for the dashboard ---
  switchActiveChild(child: any) {
    this.linkedChildData = child;
    sessionStorage.setItem('parentActiveChildId', child.id); // Save choice to memory!
    this.isChildDropdownOpen = false;

    // Reload widgets using this specific child's ID
    this.loadChildDashboardData(child.id);
    this.loadRecentGrades(child.id);
  }

  toggleFinancialMenu() {
    this.isFinancialMenuOpen = !this.isFinancialMenuOpen;
  }

  toggleFullWeek() {
    this.showFullTimetable = !this.showFullTimetable;
  }

  loadChildDashboardData(childId: number) {
    this.authService.getStudentDashboardData(childId).subscribe({
      next: (res) => {
        // Merge the dashboard specifics (like bio/grade) into the linkedChildData
        this.linkedChildData = { ...this.linkedChildData, ...res };
        let childLevel = 'Kindergarten';
        if (this.linkedChildData && this.linkedChildData.bio && this.linkedChildData.bio !== 'Unassigned') {
          const parts = this.linkedChildData.bio.split('-');
          if (parts.length > 0) {
            childLevel = parts[0].trim();
          }
        }
        this.loadTodayTimetable(childLevel);
      },
      error: (err) => console.log('Failed to securely fetch child data.', err)
    });
  }

  loadRecentGrades(childId: number) {
    this.authService.getStudentGrades(childId).subscribe({
      next: (res: any[]) => {
        this.recentGrades = res ? res.slice(0, 3) : [];
      },
      error: (err) => console.log('Failed to fetch recent grades for child.', err)
    });
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
      error: (err: any) => console.log('No schedule found for level: ' + level, err)
    });
  }

  getInitials(name: string): string {
    if (!name) return 'PA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  onLogout() {
    sessionStorage.clear();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
