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
  todayDate: string = '';
  todayDayName: string = '';

  get parentName(): string {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          return u.fullName || u.full_name || u.username || 'Parent';
        } catch(e) {}
      }
    }
    return 'Parent';
  }

  myChildren: any[] = [];
  isChildDropdownOpen: boolean = false;
  isMobileMenuOpen: boolean = false;

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

      const date = new Date();
      this.todayDate = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      this.todayDayName = date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();

      this.authService.getStudents().subscribe({
        next: (students: any[]) => {

          // THE FIX: Smart filter to perfectly link BOTH Father and Mother simultaneously!
          this.myChildren = students
            .filter(child => {
              let pJson: any = {};
              const rawJson = child.profile_json || child.profileJson;
              if (rawJson) {
                try { pJson = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson; } catch(e){}
              }

              const isLegacyParent = String(child.parentId) === String(this.currentUser.id) || String(child.parent_id) === String(this.currentUser.id);
              const isFather = String(pJson.fatherAccountId) === String(this.currentUser.id);
              const isMother = String(pJson.motherAccountId) === String(this.currentUser.id);

              return isLegacyParent || isFather || isMother;
            })
            .map(child => {
              let profileData: any = {};
              const rawProfileJson = child.profile_json || child.profileJson;

              if (rawProfileJson) {
                try { profileData = JSON.parse(rawProfileJson); } catch (e) {}
              }

              let displayName = child.fullName || child.username || 'No Name';

              if (profileData.firstName || profileData.lastName || profileData.familyName) {
                const lName = profileData.lastName || profileData.familyName || '';
                displayName = [profileData.firstName, profileData.middleName, lName].filter(Boolean).join(' ');
              }

              return {
                ...child,
                displayName: displayName,
                fullName: displayName,
                name: displayName
              };
            });

          if (this.myChildren.length > 0) {
            const savedChildId = sessionStorage.getItem('parentActiveChildId');
            const activeChild = savedChildId ? this.myChildren.find(c => String(c.id) === String(savedChildId)) : this.myChildren[0];

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

  switchActiveChild(child: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.fullHeaders = [];
    this.fullRows = [];
    this.currentSubject = null;
    this.upcomingSubjects = [];
    this.completedSubjects = [];

    this.linkedChildData = { ...child };
    sessionStorage.setItem('parentActiveChildId', child.id);
    this.isChildDropdownOpen = false;

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
        if (res && String(res.id) === String(this.linkedChildData.id)) {
          this.linkedChildData = { ...this.linkedChildData, ...res };
        }

        if (this.linkedChildData && this.linkedChildData.bio && this.linkedChildData.bio !== 'Unassigned') {
          this.loadTodayTimetable(this.linkedChildData.bio.trim());
        }
      },
      error: (err) => {
        console.log('Failed to securely fetch child data.', err);
        if (this.linkedChildData && this.linkedChildData.bio && this.linkedChildData.bio !== 'Unassigned') {
          this.loadTodayTimetable(this.linkedChildData.bio.trim());
        }
      }
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
    this.fullHeaders = [];
    this.fullRows = [];
    this.currentSubject = null;
    this.upcomingSubjects = [];
    this.completedSubjects = [];

    this.authService.getSchedule(level).subscribe({
      next: (res: any) => {
        if (res && res.headers && (res.gridData || res.grid_data)) {
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
