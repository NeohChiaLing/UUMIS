import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-grades.html',
  styles: []
})
export class StudentGradesComponent implements OnInit {

  allGrades: any[] = [];
  mainGrades: any[] = [];
  taskGrades: any[] = [];

  enrolledYears: string[] = [];
  selectedYear: string = '';

  studentName: string = 'Student';
  studentFullYear: string = 'Unknown Grade';
  studentShortYear: string = '';
  studentIdentifier: any = '';

  isGeneratingPDF: boolean = false;
  todayDate: string = new Date().toLocaleDateString();

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.studentName = user.fullName || user.username || 'Student';
          this.studentIdentifier = user.id ? user.id : (user.username || user.student_id || user.email || '');

          // Grab the full "Primary - Year 1"
          this.studentFullYear = user.bio && user.bio !== 'Unassigned' ? user.bio : 'Unknown Grade';

          // Break it down to just "Year 1" for smart matching
          const parts = this.studentFullYear.includes(' - ') ? this.studentFullYear.split(' - ') : this.studentFullYear.split('-');
          this.studentShortYear = parts.length > 1 ? parts[1].trim() : parts[0].trim();

        } catch (e) {}
      }
    }
    this.loadMyGrades();
  }

  loadMyGrades() {
    if (!this.studentIdentifier) return;

    this.authService.getStudentGrades(this.studentIdentifier as any).subscribe({
      next: (grades: any[]) => {
        this.allGrades = grades;

        const yearsSet = new Set<string>();

        if (this.studentFullYear && this.studentFullYear !== 'Unknown Grade') {
          yearsSet.add(this.studentFullYear);
        }

        // THE FIX: Smart Deduplicator to merge "Year 1" with "Primary - Year 1"
        this.allGrades.forEach(g => {
          if (g.yearGroup && g.yearGroup.trim() !== '') {
            let y = g.yearGroup.trim();

            const yParts = y.includes(' - ') ? y.split(' - ') : y.split('-');
            const yShort = yParts.length > 1 ? yParts[1].trim() : yParts[0].trim();

            if (yShort.toLowerCase() === this.studentShortYear.toLowerCase()) {
              y = this.studentFullYear;
            }

            yearsSet.add(y);
            g.normalizedYear = y; // Tag the grade with the merged name
          } else {
            g.normalizedYear = this.studentFullYear;
          }
        });

        this.enrolledYears = Array.from(yearsSet).sort();

        // Auto-select the student's current year
        if (!this.selectedYear && this.enrolledYears.length > 0) {
          this.selectedYear = this.enrolledYears.includes(this.studentFullYear) ? this.studentFullYear : this.enrolledYears[this.enrolledYears.length - 1];
        }

        this.filterGrades();
      },
      error: (err) => {
        console.error(err);
        alert('Could not connect to the grading database!');
      }
    });
  }

  // THE FIX: Strict filtering prevents Kindergarten grades from leaking into Year 1
  filterGrades() {
    if (!this.selectedYear) return;

    const yearGrades = this.allGrades.filter(g =>
      (g.normalizedYear || '').toLowerCase() === this.selectedYear.toLowerCase()
    );

    this.mainGrades = yearGrades.filter(g =>
      !g.subject.startsWith('TASK_') &&
      !g.subject.startsWith('Assignment:') &&
      !g.subject.startsWith('Quiz:')
    );

    this.taskGrades = yearGrades.filter(g =>
      g.subject.startsWith('TASK_') ||
      g.subject.startsWith('Assignment:') ||
      g.subject.startsWith('Quiz:')
    );
  }

  goBack() { this.location.back(); }

  getGradeLetter(mark: any, dbGrade: string): string {
    if (dbGrade && String(dbGrade).trim() !== '') return dbGrade;
    if (mark === null || mark === undefined || String(mark).trim() === '') return '-';

    const num = Number(mark);
    if (isNaN(num)) return '-';
    if (num >= 90) return 'A+';
    if (num >= 80) return 'A';
    if (num >= 70) return 'B';
    if (num >= 60) return 'C';
    if (num >= 50) return 'D';
    return 'F';
  }

  getGradeClass(grade: string): string {
    if (!grade || grade === '-') return 'bg-slate-100 text-slate-500';
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700';
    if (grade === 'F') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  }

  getGradeClassText(grade: string): string {
    if (!grade || grade === '-') return 'text-slate-500';
    if (grade.startsWith('A')) return 'text-emerald-600';
    if (grade === 'F') return 'text-rose-600';
    return 'text-blue-600';
  }

  downloadReportCard() {
    this.isGeneratingPDF = true;
    setTimeout(() => {
      const element = document.getElementById('formal-report-pdf');
      if (element) {
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${this.studentName.replace(/\s+/g, '_')}_Report_Card.pdf`);
          this.isGeneratingPDF = false;
        }).catch(err => {
          console.error(err);
          alert('Failed to generate PDF.');
          this.isGeneratingPDF = false;
        });
      }
    }, 200);
  }
}
