import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-dashboard.html',
  styles: []
})
export class TeacherDashboardComponent implements OnInit {

  isAcademicOpen = false;

  currentUser: any = null;
  teacherName: string = 'Teacher User';
  teacherInitials: string = 'TC';

  currentDateStr: string = '';
  todaySchedule: any[] = [];
  upcomingTasks: any[] = [];
  mySubjects: string[] = [];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    const todayName = days[todayIndex];
    this.currentDateStr = `${todayName}, ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;

    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);

          const role = this.currentUser.role ? this.currentUser.role.toLowerCase().trim() : '';
          if (role !== 'teacher' && role !== 'admin') {
            alert('Access Denied');
            this.authService.logout();
            this.router.navigate(['/login']);
            return;
          }

          this.teacherName = this.currentUser.fullName || this.currentUser.username || 'Teacher User';
          if (this.teacherName) {
            this.teacherInitials = this.teacherName.trim().slice(0, 2).toUpperCase();
          }
        } catch (e) {}
      } else {
        this.router.navigate(['/login']);
        return;
      }
    }

    this.loadDashboardData(todayName);
  }

  loadDashboardData(todayName: string) {
    this.authService.getTeachers().subscribe({
      next: (teachers: any[]) => {
        const myProfile = teachers.find((t: any) => t.username === this.currentUser?.username || t.email === this.currentUser?.email);

        if (myProfile) {
          const assignedSubjRaw = myProfile.assignedSubjects || myProfile.assigned_subjects || '';
          this.mySubjects = assignedSubjRaw ? assignedSubjRaw.split(',').map((s:string) => s.trim().toLowerCase()) : [];

          const bio = myProfile.bio || '';
          const assignedClasses = bio && bio !== 'Unassigned' ? bio.split(',').map((c: string) => c.trim()) : [];

          if (assignedClasses.length > 0) {
            const scheduleRequests = assignedClasses.map((className: string) =>
              this.authService.getSchedule(className).pipe(catchError(err => of(null)))
            );

            forkJoin(scheduleRequests).subscribe({
              next: (results: any) => {
                this.todaySchedule = [];
                const daysUpper = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];
                let dayIndex = daysUpper.indexOf(todayName.toUpperCase());
                if(dayIndex === -1) dayIndex = 0;

                results.forEach((res: any, idx: number) => {
                  if (res && res.headers) {
                    const headers = JSON.parse(res.headers);
                    const rows = JSON.parse(res.gridData || res.grid_data);
                    const todayRow = rows[dayIndex];

                    if(todayRow) {
                      for(let i=0; i < todayRow.length; i++) {
                        const subj = todayRow[i];
                        if(subj && subj !== 'Rest / Recess' && subj !== '- Select Subject -' && subj.trim() !== '') {
                          if(this.mySubjects.includes(subj.toLowerCase())) {
                            this.todaySchedule.push({
                              time: headers[i], // Looks like "08:00 AM - 09:00 AM"
                              subject: subj,
                              class: assignedClasses[idx]
                            });
                          }
                        }
                      }
                    }
                  }
                });

                // --- THE FIX: Smart Real-Time Parsing & Sorting ---
                const now = new Date();
                const currentMins = now.getHours() * 60 + now.getMinutes();

                const parseTimeStr = (t: string) => {
                  const match = t.match(/(\d+)[.:](\d+)\s*(AM|PM|am|pm)?/i);
                  if (!match) return 0;
                  let h = parseInt(match[1], 10);
                  let m = parseInt(match[2], 10);
                  const ampm = match[3]?.toUpperCase();
                  if (ampm === 'PM' && h < 12) h += 12;
                  if (ampm === 'AM' && h === 12) h = 0;
                  return h * 60 + m;
                };

                this.todaySchedule = this.todaySchedule.map(slot => {
                  const timeParts = slot.time.split('-');
                  const startMins = parseTimeStr(timeParts[0]);
                  const endMins = parseTimeStr(timeParts[1] || timeParts[0]);

                  return {
                    ...slot,
                    isCurrent: currentMins >= startMins && currentMins < endMins,
                    isPast: currentMins >= endMins
                  };
                });

                this.todaySchedule.sort((a, b) => {
                  return parseTimeStr(a.time.split('-')[0]) - parseTimeStr(b.time.split('-')[0]);
                });
              }
            });
          }
        }
        this.loadAssignments();
      }
    });
  }

  loadAssignments() {
    this.authService.getAssignments().subscribe({
      next: (assigns: any[]) => {
        let myAssigns = assigns;
        if (this.mySubjects.length > 0) {
          myAssigns = assigns.filter((a: any) => this.mySubjects.includes((a.subject || '').toLowerCase()));
        }

        const mappedTasks = myAssigns.map((a: any) => {
          const isQuiz = a.type === 'Quiz';
          let validDate = new Date();

          if (isQuiz && a.quizDate && a.startTime) {
            const parsedDate = new Date(`${a.quizDate}T${a.startTime}`);
            if (!isNaN(parsedDate.getTime())) validDate = parsedDate;
          }
          else if (!isQuiz && a.dueDate) {
            const parsedDate = new Date(a.dueDate);
            if (!isNaN(parsedDate.getTime())) validDate = parsedDate;
          }

          return { title: a.topic, subject: a.subject, type: a.type, rawDate: validDate };
        });

        mappedTasks.sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());
        const now = new Date();
        this.upcomingTasks = mappedTasks.filter((t:any) => t.rawDate >= now).slice(0, 4);
      }
    });
  }

  toggleAcademic() { this.isAcademicOpen = !this.isAcademicOpen; }
  onLogout() { this.authService.logout(); this.router.navigate(['/login']); }
}
