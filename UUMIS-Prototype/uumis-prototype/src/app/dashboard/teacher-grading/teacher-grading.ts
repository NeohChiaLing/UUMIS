import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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

  // THE FIX: Split grades into main subjects and tasks
  modalMainGrades: any[] = [];
  modalTaskGrades: any[] = [];
  isFetchingReport: boolean = false;

  isGeneratingPDF: boolean = false;
  todayDate: string = new Date().toLocaleDateString();

  constructor(private router: Router, private location: Location, private authService: AuthService) {}

  ngOnInit() {
    const localUser = this.authService.getCurrentUser();
    if (!localUser) return;

    this.authService.getTeachers().subscribe({
      next: (teachers: any[]) => {
        const myFreshProfile = teachers.find(t => t.username === localUser.username || t.email === localUser.email);

        if (myFreshProfile) {
          const bio = myFreshProfile.bio || '';
          const classList = bio && bio !== 'Unassigned' ? bio.split(',').map((s: string) => s.trim()) : [];

          this.years = classList.map((c: string) => {
            const parts = c.includes(' - ') ? c.split(' - ') : c.split('-');
            return parts.length > 1 ? parts[1].trim() : parts[0].trim();
          }).filter((y: string) => y !== 'Unassigned' && y !== '');

          const assignedSubjRaw = myFreshProfile.assignedSubjects || myFreshProfile.assigned_subjects || '';
          this.teacherAllowedSubjects = assignedSubjRaw
            ? assignedSubjRaw.split(',').map((s: string) => s.trim().toLowerCase())
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
        const subYear = s.yearGroup || s.year_group || '';
        const matchesYear = subYear.trim().toLowerCase() === this.selectedYear.toLowerCase();
        const subNameSafe = (s.name || '').trim().toLowerCase();
        const isAssignedToTeacher = this.teacherAllowedSubjects.includes(subNameSafe);
        return matchesYear && isAssignedToTeacher;
      })
      .map(s => s.name);

    this.selectedSubject = '';
    this.students = [];
  }

  loadStudentList() {
    if (!this.selectedYear || !this.selectedSubject) return;

    this.authService.getUsers().subscribe({
      next: (users) => {
        const yearStudents = users.filter((u: any) => {
          if ((u.role || '').toLowerCase() !== 'student' || !u.bio || u.bio === 'Unassigned') return false;

          const parts = u.bio.includes(' - ') ? u.bio.split(' - ') : u.bio.split('-');
          const stuLevel = parts[0].trim().toLowerCase();
          const stuYear = parts.length > 1 ? parts[1].trim().toLowerCase() : stuLevel;
          const targetYear = this.selectedYear.toLowerCase();

          return stuYear === targetYear || stuLevel === targetYear;
        });

        const subjectsToFetch = this.selectedSubject === 'All Subjects'
          ? this.filteredSubjects
          : [this.selectedSubject];

        if (subjectsToFetch.length === 0) {
          this.students = [];
          return;
        }

        const gradeRequests = subjectsToFetch.map(sub =>
          this.authService.getGrades(this.selectedYear, sub).pipe(
            catchError(err => of([]))
          )
        );

        forkJoin(gradeRequests).subscribe({
          next: (results: any[][]) => {
            this.students = [];

            yearStudents.forEach((stu: any) => {
              const uniqueId = stu.username || stu.email || stu.id.toString();
              const name = stu.fullName || stu.username || 'Unknown Student';

              subjectsToFetch.forEach((sub, index) => {
                const gradesForThisSubject = results[index];
                const existingGrade = gradesForThisSubject.find(g => g.studentUsername === uniqueId);

                this.students.push({
                  studentUsername: uniqueId,
                  name: name,
                  subject: sub,
                  mark: existingGrade ? existingGrade.mark : 0,
                  grade: existingGrade ? existingGrade.gradeLetter || existingGrade.grade_letter : '-',
                  status: existingGrade ? existingGrade.status : 'Pending',
                  isEditing: false
                });
              });
            });

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
    this.modalMainGrades = [];
    this.modalTaskGrades = [];

    this.authService.getStudentGrades(student.studentUsername).subscribe({
      next: (grades: any[]) => {
        // THE FIX: Filter strictly to the selected Year so old kindergarten grades are hidden!
        const yearGrades = grades.filter(g =>
          (g.yearGroup || '').trim().toLowerCase() === this.selectedYear.trim().toLowerCase()
        );

        // THE FIX: Split Core Subjects from Assignments/Quizzes
        this.modalMainGrades = yearGrades.filter(g =>
          !g.subject.startsWith('TASK_') &&
          !g.subject.startsWith('Assignment:') &&
          !g.subject.startsWith('Quiz:')
        );

        this.modalTaskGrades = yearGrades.filter(g =>
          g.subject.startsWith('TASK_') ||
          g.subject.startsWith('Assignment:') ||
          g.subject.startsWith('Quiz:')
        );

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
    this.modalMainGrades = [];
    this.modalTaskGrades = [];
  }

  exportToPDF() {
    if (!this.selectedYear || !this.selectedSubject || this.students.length === 0) return;
    this.isGeneratingPDF = true;

    setTimeout(() => {
      const element = document.getElementById('formal-teacher-grading-pdf');
      if (element) {
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Class_Report_${this.selectedSubject.replace(/\s+/g, '_')}_${this.selectedYear}.pdf`);
          this.isGeneratingPDF = false;
        }).catch(err => {
          console.error(err);
          alert('Failed to generate PDF.');
          this.isGeneratingPDF = false;
        });
      }
    }, 200);
  }

  submitAllGrades() {
    this.students.forEach(s => {
      if (s.isEditing) { this.calculateGrade(s); s.status = 'Graded'; s.isEditing = false; }
      else if (s.grade && s.grade !== '-') { s.status = 'Graded'; }
    });

    const validStudents = this.students.filter(s => s.studentUsername && s.studentUsername.trim() !== '');
    if (validStudents.length === 0) return;

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
