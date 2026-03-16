import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    // Generate Dates securely inside the function
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    const todayName = days[todayIndex];
    this.currentDateStr = `${todayName}, ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;

    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);

          // Security check
          const role = this.currentUser.role ? this.currentUser.role.toLowerCase().trim() : '';
          if (role !== 'teacher' && role !== 'admin') {
            alert('Access Denied: You are not authorized to view the Teacher Portal.');
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
        return; // Stop execution if no user
      }
    }

    // Now safely call the loader
    this.loadDashboardData(todayName);
  }

  loadDashboardData(todayName: string) {
    this.authService.getTeachers().subscribe({
      next: (teachers: any[]) => {
        const myProfile = teachers.find((t: any) => t.username === this.currentUser?.username);

        if (myProfile) {
          this.mySubjects = myProfile.assignedSubjects ? myProfile.assignedSubjects.split(',') : [];

          if (myProfile.scheduleJson) {
            const fullSchedule = JSON.parse(myProfile.scheduleJson);
            this.todaySchedule = fullSchedule.filter((s: any) =>
              s.day.toLowerCase() === todayName.toLowerCase() && s.subject && s.subject.trim() !== ''
            );
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
          myAssigns = assigns.filter((a: any) => this.mySubjects.includes(a.subject));
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

          return {
            title: a.topic,
            subject: a.subject,
            type: a.type,
            rawDate: validDate
          };
        });

        mappedTasks.sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());

        this.upcomingTasks = mappedTasks.slice(0, 4);
      }
    });
  }

  toggleAcademic() {
    this.isAcademicOpen = !this.isAcademicOpen;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
