import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-grades.html',
  styles: []
})
export class StudentGradesComponent implements OnInit {

  allGrades: any[] = [];
  allSubjects: any[] = [];
  allAssignments: any[] = [];

  mainGrades: any[] = [];
  taskGrades: any[] = [];

  allYears = [
    'Pre-Kindergarten', 'Kindergarten',
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'
  ];
  selectedYear: string = 'Kindergarten';

  studentName: string = 'Student';
  studentShortYear: string = '';
  studentIdentifier: any = '';

  isGeneratingPDF: boolean = false;
  todayDate: string = new Date().toLocaleDateString();

  constructor(private location: Location, private http: HttpClient) {}

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.studentIdentifier = user.id ? user.id : (user.username || user.student_id || user.email || '');

          let parsedData: any = {};
          if (user.profileJson || user.profile_json) {
            try { parsedData = JSON.parse(user.profileJson || user.profile_json); } catch(e) {}
          }

          let displayName = user.fullName || user.username || 'Student';
          if (parsedData.firstName || parsedData.lastName || parsedData.familyName) {
            const lName = parsedData.lastName || parsedData.familyName || '';
            displayName = [parsedData.firstName, parsedData.middleName, lName].filter(Boolean).join(' ');
          }
          this.studentName = displayName;

          const studentFullYear = user.bio && user.bio !== 'Unassigned' ? user.bio : 'Kindergarten';
          this.studentShortYear = this.cleanYearString(studentFullYear);

        } catch (e) {}
      }
    }

    const exactMatch = this.allYears.find(y => y.toLowerCase() === this.studentShortYear.toLowerCase());
    this.selectedYear = exactMatch || 'Kindergarten';

    this.loadMyGrades();
  }

  private cleanYearString(y: string): string {
    if (!y) return '';
    const parts = y.split(' - ');
    return parts[parts.length - 1].trim().toLowerCase();
  }

  loadMyGrades() {
    if (!this.studentIdentifier) return;

    this.http.get<any[]>('/api/subjects').subscribe({
      next: (subs) => {
        this.allSubjects = subs || [];

        this.http.get<any[]>('/api/assignments').subscribe({
          next: (tasks) => {
            this.allAssignments = tasks || [];

            // THE FIX: Fetch grades from the standard endpoint so we get the 'studentName' data
            this.http.get<any[]>(`/api/grades/student/${this.studentIdentifier}`).subscribe({
              next: (grades: any[]) => {

                // THE FIX: Strict Collision Filter
                // Throw away grades that belong to other students sharing the same ID (e.g. 123457)
                const myName = this.studentName.toLowerCase().trim();

                const exactGrades = (grades || []).filter(g => {
                  const gradeName = (g.studentName || '').toLowerCase().trim();
                  // If the grade has a name attached, it MUST match this student's exact name
                  if (gradeName !== '' && gradeName !== myName) {
                    return false;
                  }
                  return true;
                });

                this.allGrades = exactGrades.map(g => {
                  let y = (g.yearGroup || g.year_group || '').trim();
                  const yParts = y.includes(' - ') ? y.split(' - ') : y.split('-');
                  g.normalizedYear = yParts.length > 1 ? yParts[1].trim() : yParts[0].trim();
                  return g;
                });

                this.filterGrades();
              },
              error: (err) => console.error('Grade fetch error:', err)
            });

          },
          error: () => this.filterGrades()
        });
      },
      error: () => this.filterGrades()
    });
  }

  filterGrades() {
    if (!this.selectedYear) return;

    const targetYearClean = this.cleanYearString(this.selectedYear);

    const yearGrades = this.allGrades.filter(g => {
      return this.cleanYearString(g.yearGroup || g.year_group || '') === targetYearClean;
    });

    const yearSubjects = this.allSubjects.filter(s => {
      return this.cleanYearString(s.yearGroup || s.year_group || '') === targetYearClean;
    });

    this.mainGrades = yearSubjects.map(sub => {
      const subName = (sub.name || '').toLowerCase();
      const subCode = (sub.code || '').toLowerCase();

      const existingGrade = yearGrades.find(g => {
        const gSub = (g.subject || '').toLowerCase();
        return gSub === subName || gSub === subCode;
      });

      if (existingGrade) {
        return { ...existingGrade, subject: sub.name || existingGrade.subject };
      } else {
        return {
          subject: sub.name || sub.code,
          mark: '-',
          gradeLetter: '-',
          status: 'Pending'
        };
      }
    });

    yearGrades.forEach(g => {
      const isTask = g.subject.startsWith('TASK_') || g.subject.startsWith('Assignment:') || g.subject.startsWith('Quiz:');
      if (!isTask) {
        const exists = this.mainGrades.find(mg => (mg.subject || '').toLowerCase() === (g.subject || '').toLowerCase());
        if (!exists) this.mainGrades.push(g);
      }
    });

    const yearTasks = this.allAssignments.filter(a => {
      return this.cleanYearString(a.yearGroup || a.year_group || '') === targetYearClean;
    });

    this.taskGrades = yearTasks.map(task => {
      const taskName = `${task.type}: ${task.topic}`;
      const oldTaskName = `TASK_${task.id}`;

      const existingGrade = yearGrades.find(g => g.subject === oldTaskName || g.subject === taskName);

      if (existingGrade) {
        return { ...existingGrade, subject: taskName };
      } else {
        return {
          subject: taskName,
          mark: '-',
          gradeLetter: '-',
          status: 'Pending'
        };
      }
    });

    yearGrades.forEach(g => {
      const isTask = g.subject.startsWith('TASK_') || g.subject.startsWith('Assignment:') || g.subject.startsWith('Quiz:');
      if (isTask) {
        const exists = this.taskGrades.find(tg => (tg.subject || '').toLowerCase() === (g.subject || '').toLowerCase());
        if (!exists) this.taskGrades.push(g);
      }
    });
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
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700';
    if (grade === 'F') return 'bg-rose-100 text-rose-700';
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
