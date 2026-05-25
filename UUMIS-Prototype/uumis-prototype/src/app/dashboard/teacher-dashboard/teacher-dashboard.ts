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
  isMobileMenuOpen = false;
  showDashboardContent = true;

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

          const schedRaw = myProfile.scheduleJson || myProfile.schedule_json;
          let parsedSchedule: any[] = [];
          if (schedRaw) {
            try {
              parsedSchedule = JSON.parse(schedRaw);
            } catch (e) {}
          }

          const daysUpper = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
          let todayUpper = todayName.toUpperCase();

          // Fallback to Sunday if they login on a weekend
          if (!['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'].includes(todayUpper)) {
            todayUpper = 'SUNDAY';
            this.currentDateStr += ' (Showing Sunday)';
          }

          // THE FIX: Correctly filters customized slots based on day and valid subject entry
          const todaySlots = parsedSchedule.filter((s: any) => (s.day || '').toUpperCase() === todayUpper && s.subject && s.subject.trim() !== '');

          const now = new Date();
          const currentMins = now.getHours() * 60 + now.getMinutes();

          const parseTimeStr = (hourStr: string, ampm: string) => {
            if (!hourStr) return 0;
            const parts = hourStr.split(':');
            let h = parseInt(parts[0] || '0', 10);
            let m = parseInt(parts[1] || '0', 10);
            const isPM = (ampm || '').toUpperCase() === 'PM';
            if (isPM && h < 12) h += 12;
            if (!isPM && h === 12) h = 0;
            return h * 60 + m;
          };

          const mappedSlots = todaySlots.map((slot: any) => {
            const startMins = parseTimeStr(slot.startHour, slot.startAmPm);
            const endMins = parseTimeStr(slot.endHour, slot.endAmPm);

            // Format for UI Display e.g. "08:00 AM - 12:00 PM"
            const timeString = `${slot.startHour} ${slot.startAmPm} - ${slot.endHour} ${slot.endAmPm}`;

            return {
              time: timeString,
              subject: slot.subject,
              class: slot.class || 'TBA',
              room: 'Room TBA',
              teacher: myProfile.full_name || myProfile.fullName || myProfile.username,
              startMins,
              endMins,
              isCurrent: false,
              isPast: false
            };
          });

          mappedSlots.sort((a: any, b: any) => a.startMins - b.startMins);

          // THE FIX: Assigning the verified schedule to todaySchedule so HTML table maps correctly!
          this.todaySchedule = mappedSlots;

          mappedSlots.forEach((slot: any) => {
            slot.isCurrent = currentMins >= slot.startMins && currentMins < slot.endMins;
            slot.isPast = currentMins >= slot.endMins;
          });
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
