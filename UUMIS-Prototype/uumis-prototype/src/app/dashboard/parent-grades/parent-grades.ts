import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas'; // Added html2canvas
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-grades.html',
  styles: []
})
export class ParentGradesComponent implements OnInit {

  currentUser: any = null;
  viewState: string = 'children';

  myChildren: any[] = [];
  selectedChild: any = null;

  grades: any[] = [];
  isLoading: boolean = false;

  isGeneratingPDF: boolean = false;
  todayDate: string = new Date().toLocaleDateString();

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser && this.currentUser.role.toLowerCase() === 'parent') {
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {
          this.myChildren = students.filter(s => s.parentId === this.currentUser.id);
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  selectChild(child: any) {
    this.selectedChild = child;
    this.viewState = 'grades';
    this.loadGrades();
  }

  loadGrades() {
    this.isLoading = true;
    const targetIdentifier = this.selectedChild.username || this.selectedChild.id || this.selectedChild.email || '';

    if (!targetIdentifier) {
      this.grades = [];
      this.isLoading = false;
      return;
    }

    this.authService.getMyGrades(targetIdentifier).subscribe({
      next: (res: any[]) => {
        this.grades = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load grades', err);
        this.isLoading = false;
      }
    });
  }

  // Smart Calculator
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

  goBack(): void {
    if (this.viewState === 'grades') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.grades = [];
    } else {
      this.location.back();
    }
  }

  downloadReportCard() {
    this.isGeneratingPDF = true;
    setTimeout(() => {
      const element = document.getElementById('formal-report-pdf-parent');
      if (element) {
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          const childName = this.selectedChild?.fullName || this.selectedChild?.username || 'Student';
          pdf.save(`${childName.replace(/\s+/g, '_')}_Report_Card.pdf`);

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
