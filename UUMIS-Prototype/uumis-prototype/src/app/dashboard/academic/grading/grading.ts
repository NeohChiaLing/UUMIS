import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AuthService } from '../../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-grading',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './grading.html',
  styleUrl: './grading.css'
})
export class GradingComponent implements OnInit {
  years = ['Pre-Kindergarten', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];

  allSubjects: any[] = [];
  filteredSubjects: string[] = [];

  selectedYear: string = '';
  selectedSubject: string = '';
  students: any[] = [];

  upcomingExamsCount: number = 0;
  pendingApprovalsCount: number = 0;
  activeScalesCount: number = 0;

  // THE FIX: Modal variables
  showReportModal: boolean = false;
  selectedStudentForReport: any = null;
  modalMainGrades: any[] = [];
  modalTaskGrades: any[] = [];
  isFetchingReport: boolean = false;

  isGeneratingPDF: boolean = false;
  todayDate: string = new Date().toLocaleDateString();

  constructor(private router: Router, private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.authService.getSubjects().subscribe({
      next: (res) => {
        this.allSubjects = res;
        this.activeScalesCount = res.filter((s:any) => s.active).length || res.length;
      }
    });

    this.authService.getAssignments().subscribe({
      next: (res) => this.upcomingExamsCount = res.filter((a:any) => a.type === 'Quiz').length
    });

    this.authService.getLessonPlans().subscribe({
      next: (res) => this.pendingApprovalsCount = res.filter((lp:any) => lp.status === 'Pending Review').length
    });
  }

  goBack() {
    this.location.back();
  }

  onYearChange() {
    this.filteredSubjects = this.allSubjects
      .filter(s => {
        const subYear = s.yearGroup || s.year_group || '';
        return subYear.trim().toLowerCase() === this.selectedYear.toLowerCase();
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

          const parts = u.bio.split(' - ');
          const stuLevel = parts[0].trim().toLowerCase();
          const stuYear = parts.length > 1 ? parts[1].trim().toLowerCase() : stuLevel;
          const targetYear = this.selectedYear.toLowerCase();

          return stuYear === targetYear || stuLevel === targetYear;
        });

        this.authService.getGrades(this.selectedYear, this.selectedSubject).subscribe({
          next: (grades) => this.mapStudentsToGrades(yearStudents, grades),
          error: () => this.mapStudentsToGrades(yearStudents, [])
        });
      },
      error: () => alert("Failed to fetch users.")
    });
  }

  mapStudentsToGrades(yearStudents: any[], grades: any[]) {
    this.students = yearStudents.map((stu: any) => {
      const uniqueId = stu.username || '';
      const existingGrade = grades.find(g => g.studentUsername === uniqueId && uniqueId !== '');

      return {
        studentUsername: uniqueId,
        name: stu.fullName || stu.username || 'Unknown Student',
        mark: existingGrade ? existingGrade.mark : 0,
        grade: existingGrade ? existingGrade.gradeLetter || existingGrade.grade_letter : '-',
        status: existingGrade ? existingGrade.status : 'Pending',
        isEditing: false
      };
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

  // THE FIX: Added View Full Report Logic
  viewStudentFullReport(student: any) {
    this.selectedStudentForReport = student;
    this.showReportModal = true;
    this.isFetchingReport = true;
    this.modalMainGrades = [];
    this.modalTaskGrades = [];

    this.authService.getStudentGrades(student.studentUsername).subscribe({
      next: (grades: any[]) => {
        const yearGrades = grades.filter(g =>
          (g.yearGroup || '').trim().toLowerCase() === this.selectedYear.trim().toLowerCase()
        );

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
    if (!this.selectedYear || !this.selectedSubject || this.students.length === 0) {
      alert('Please select Year and Subject with active students first.');
      return;
    }
    this.isGeneratingPDF = true;

    setTimeout(() => {
      const element = document.getElementById('formal-grading-pdf');
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
      if (s.isEditing) {
        this.calculateGrade(s);
        s.status = 'Graded';
        s.isEditing = false;
      } else if (s.grade && s.grade !== '-') {
        s.status = 'Graded';
      }
    });

    const validStudents = this.students.filter(s => s.studentUsername && s.studentUsername.trim() !== '');

    if (validStudents.length === 0) {
      alert("No valid students to save!");
      return;
    }

    const payload = validStudents.map(s => ({
      studentUsername: s.studentUsername,
      studentName: s.name,
      yearGroup: this.selectedYear,
      subject: this.selectedSubject,
      mark: s.mark,
      gradeLetter: s.grade,
      status: s.status
    }));

    this.authService.saveGrades(payload).subscribe({
      next: () => alert('All grades have been permanently saved to the database!'),
      error: () => alert('Failed to save grades. Please check database connection.')
    });
  }
}
