import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-teacher-grading',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './teacher-grading.html',
  styleUrl: './teacher-grading.css'
})
export class TeacherGradingComponent implements OnInit {

  teacherAllowedSubjects: string[] = [];
  years: string[] = [];

  allSubjects: any[] = [];
  filteredSubjects: string[] = [];

  selectedYear: string = '';
  selectedSubject: string = '';
  students: any[] = [];

  showReportModal: boolean = false;
  selectedStudentForReport: any = null;
  studentFullGrades: any[] = [];
  isFetchingReport: boolean = false;

  constructor(private router: Router, private location: Location, private authService: AuthService) {}

  ngOnInit() {
    const localUser = this.authService.getCurrentUser();
    if (!localUser) return;

    this.authService.getUsers().subscribe({
      next: (users: any[]) => {
        const myFreshProfile = users.find(u => u.id === localUser.id || (u.email && u.email === localUser.email));

        if (myFreshProfile) {
          const bio = myFreshProfile.bio || '';
          const classList = bio ? bio.split(',').map((s: string) => s.trim()) : [];

          this.years = classList.map((c: string) => {
            const parts = c.includes(' - ') ? c.split(' - ') : c.split('-');
            return parts.length > 1 ? parts[1].trim() : parts[0].trim();
          }).filter((y: string) => y !== 'Unassigned' && y !== '');

          this.teacherAllowedSubjects = myFreshProfile.assignedSubjects
            ? myFreshProfile.assignedSubjects.split(',').map((s: string) => s.trim())
            : [];

          this.authService.getSubjects().subscribe({
            next: (res) => {
              this.allSubjects = res;

              if (this.years.length === 1) {
                this.selectedYear = this.years[0];
                this.onYearChange();
              }
            }
          });
        }
      }
    });
  }

  goBack() { this.location.back(); }

  onYearChange() {
    this.filteredSubjects = this.allSubjects
      .filter(s => {
        const matchesYear = (s.yearGroup || '').trim().toLowerCase() === this.selectedYear.toLowerCase();
        const isAssignedToTeacher = this.teacherAllowedSubjects.includes(s.name);
        return matchesYear && isAssignedToTeacher;
      })
      .map(s => s.name);

    this.selectedSubject = '';
    this.students = [];
  }

  // ========================================================================
  // THE FIX: Smart Multi-Fetch for "All Subjects"
  // ========================================================================
  loadStudentList() {
    if (!this.selectedYear || !this.selectedSubject) return;

    this.authService.getUsers().subscribe({
      next: (users) => {
        // 1. Get the students for this year
        const yearStudents = users.filter((u: any) => {
          if ((u.role || '').toLowerCase() !== 'student' || !u.bio || u.bio === 'Unassigned') return false;

          const parts = u.bio.includes(' - ') ? u.bio.split(' - ') : u.bio.split('-');
          const stuLevel = parts[0].trim().toLowerCase();
          const stuYear = parts.length > 1 ? parts[1].trim().toLowerCase() : stuLevel;
          const targetYear = this.selectedYear.toLowerCase();

          return stuYear === targetYear || stuLevel === targetYear;
        });

        // 2. Determine which subjects to fetch
        const subjectsToFetch = this.selectedSubject === 'All Subjects'
          ? this.filteredSubjects
          : [this.selectedSubject];

        if (subjectsToFetch.length === 0) {
          this.students = [];
          return;
        }

        // 3. Create parallel API requests for EVERY subject
        const gradeRequests = subjectsToFetch.map(sub =>
          this.authService.getGrades(this.selectedYear, sub).pipe(
            catchError(err => of([])) // Safely return empty array if a subject has no grades yet
          )
        );

        // 4. Wait for ALL requests to finish, then map them into the table!
        forkJoin(gradeRequests).subscribe({
          next: (results: any[][]) => {
            this.students = [];

            // Loop through students
            yearStudents.forEach((stu: any) => {
              const uniqueId = stu.username || stu.email || stu.id.toString();
              const name = stu.fullName || stu.username || 'Unknown Student';

              // Loop through subjects and create a unique row for each Student + Subject combo
              subjectsToFetch.forEach((sub, index) => {
                const gradesForThisSubject = results[index];
                const existingGrade = gradesForThisSubject.find(g => g.studentUsername === uniqueId);

                this.students.push({
                  studentUsername: uniqueId,
                  name: name,
                  subject: sub, // Attach the exact subject to the row
                  mark: existingGrade ? existingGrade.mark : 0,
                  grade: existingGrade ? existingGrade.gradeLetter : '-',
                  status: existingGrade ? existingGrade.status : 'Pending',
                  isEditing: false
                });
              });
            });

            // Optional: Sort alphabetically by student name, then by subject
            this.students.sort((a, b) => a.name.localeCompare(b.name) || a.subject.localeCompare(b.subject));
          }
        });
      }
    });
  }

  toggleEdit(student: any) {
    if (student.isEditing) {
      this.calculateGrade(student);
      student.status = 'Graded';
    }
    student.isEditing = !student.isEditing;
  }

  calculateGrade(student: any) {
    const m = student.mark;
    if (m >= 90) student.grade = 'A+';
    else if (m >= 80) student.grade = 'A';
    else if (m >= 70) student.grade = 'B';
    else if (m >= 60) student.grade = 'C';
    else if (m >= 50) student.grade = 'D';
    else student.grade = 'F';
  }

  getGradeClass(grade: string): string {
    if (!grade) return 'text-gray-400 bg-gray-50';
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50';
    if (grade === 'F') return 'text-red-600 bg-red-50';
    if (grade === '-') return 'text-gray-400 bg-gray-50';
    return 'text-blue-600 bg-blue-50';
  }

  viewStudentFullReport(student: any) {
    this.selectedStudentForReport = student;
    this.showReportModal = true;
    this.isFetchingReport = true;
    this.studentFullGrades = [];

    this.authService.getMyGrades(student.studentUsername).subscribe({
      next: (grades: any[]) => {
        this.studentFullGrades = grades;
        this.isFetchingReport = false;
      },
      error: () => {
        alert("Failed to load student's full report card.");
        this.isFetchingReport = false;
      }
    });
  }

  closeReportModal() {
    this.showReportModal = false;
    this.selectedStudentForReport = null;
    this.studentFullGrades = [];
  }

  exportToPDF() {
    if (!this.selectedYear || !this.selectedSubject || this.students.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(`Grading Report: ${this.selectedSubject} (${this.selectedYear})`, 14, 20);
    doc.setFontSize(12); doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    autoTable(doc, {
      startY: 40, head: [['Student Username', 'Name', 'Subject', 'Mark', 'Grade', 'Status']],
      body: this.students.map(s => [s.studentUsername, s.name, s.subject, s.mark, s.grade, s.status]),
    });
    doc.save(`${this.selectedSubject}_${this.selectedYear}_Report.pdf`);
  }

  submitAllGrades() {
    this.students.forEach(s => {
      if (s.isEditing) { this.calculateGrade(s); s.status = 'Graded'; s.isEditing = false; }
      else if (s.grade && s.grade !== '-') { s.status = 'Graded'; }
    });

    const validStudents = this.students.filter(s => s.studentUsername && s.studentUsername.trim() !== '');
    if (validStudents.length === 0) return;

    // THE FIX: Use s.subject dynamically instead of this.selectedSubject!
    const payload = validStudents.map(s => ({
      studentUsername: s.studentUsername,
      studentName: s.name,
      yearGroup: this.selectedYear,
      subject: s.subject,
      mark: s.mark,
      gradeLetter: s.grade,
      status: s.status
    }));

    this.authService.saveGrades(payload).subscribe({
      next: () => alert('All grades have been permanently saved!'),
      error: () => alert('Failed to save grades. Please check connection.')
    });
  }
}
