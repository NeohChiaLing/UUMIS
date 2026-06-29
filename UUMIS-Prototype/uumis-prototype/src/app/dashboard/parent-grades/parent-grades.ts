import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-grades.html',
  styles: []
})
export class ParentGradesComponent implements OnInit {

  currentUser: any = null;
  viewState: string = 'children';

  myChildren: any[] = [];
  selectedChild: any = null;

  years = [
    'Pre-Kindergarten', 'Kindergarten',
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'
  ];
  selectedYear: string = 'Kindergarten';

  allGrades: any[] = [];
  allSubjects: any[] = [];
  allAssignments: any[] = [];

  mainGrades: any[] = [];
  taskGrades: any[] = [];
  isLoading: boolean = false;

  isGeneratingPDF: boolean = false;
  todayDate: string = new Date().toLocaleDateString();

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser && this.currentUser.role.toLowerCase() === 'parent') {
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {
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
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  private cleanYearString(y: string): string {
    if (!y) return '';
    const parts = y.split(' - ');
    return parts[parts.length - 1].trim().toLowerCase();
  }

  selectChild(child: any) {
    this.selectedChild = child;
    this.viewState = 'grades';

    const childBio = this.selectedChild.bio || this.selectedChild.grade || '';
    const studentShortYear = this.cleanYearString(childBio) || 'kindergarten';

    const exactMatch = this.years.find(y => y.toLowerCase() === studentShortYear);
    this.selectedYear = exactMatch || 'Kindergarten';

    this.loadGrades();
  }

  loadGrades() {
    this.isLoading = true;
    const targetIdentifier = this.selectedChild.username || this.selectedChild.id || this.selectedChild.email || '';

    if (!targetIdentifier) {
      this.allGrades = [];
      this.mainGrades = [];
      this.taskGrades = [];
      this.isLoading = false;
      return;
    }

    this.authService.getSubjects().subscribe({
      next: (subs) => {
        this.allSubjects = subs || [];

        this.authService.getAssignments().subscribe({
          next: (tasks) => {
            this.allAssignments = tasks || [];

            this.authService.getStudentGrades(targetIdentifier).subscribe({
              next: (res: any[]) => {
                const myName = (this.selectedChild.fullName || this.selectedChild.name || '').toLowerCase().trim();

                const exactGrades = (res || []).filter(g => {
                  const gradeName = (g.studentName || '').toLowerCase().trim();
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

                this.filterGradesByYear();
                this.isLoading = false;
              },
              error: (err) => {
                console.error('Failed to load grades', err);
                this.isLoading = false;
              }
            });
          },
          error: () => this.filterGradesByYear()
        });
      },
      error: () => this.filterGradesByYear()
    });
  }

  onYearChange() {
    this.filterGradesByYear();
  }

  filterGradesByYear() {
    if (!this.selectedYear) return;

    const targetYearClean = this.cleanYearString(this.selectedYear);

    // 1. Get all grades and subjects for this year
    const yearGrades = this.allGrades.filter(g => {
      return this.cleanYearString(g.yearGroup || g.year_group || '') === targetYearClean;
    });

    const yearSubjects = this.allSubjects.filter(s => {
      return this.cleanYearString(s.yearGroup || s.year_group || '') === targetYearClean;
    });

    // 2. Build Core Subjects List
    this.mainGrades = yearSubjects.map(sub => {
      const subName = (sub.name || '').toLowerCase();
      const subCode = (sub.code || '').toLowerCase();

      const existingGrade = yearGrades.find(g => {
        const gSub = (g.subject || '').toLowerCase();
        return gSub === subName || gSub === subCode;
      });

      if (existingGrade) {
        return {
          ...existingGrade,
          subject: sub.name || existingGrade.subject,
          status: existingGrade.status || (existingGrade.mark && existingGrade.mark !== '-' ? 'Graded' : 'Pending')
        };
      } else {
        return {
          subject: sub.name || sub.code,
          mark: '-',
          gradeLetter: '-',
          status: 'Pending'
        };
      }
    });

    // 3. Build Tasks/Assignments List STRICTLY from live assignments
    const yearTasks = this.allAssignments.filter(a => {
      return this.cleanYearString(a.yearGroup || a.year_group || '') === targetYearClean;
    });

    this.taskGrades = yearTasks.map(task => {
      const taskName = `${task.type}: ${task.topic}`;
      const oldTaskName = `TASK_${task.id}`;

      const existingGrade = yearGrades.find(g => {
        const gSub = (g.subject || '').toLowerCase();
        return gSub === taskName.toLowerCase() || gSub === oldTaskName.toLowerCase();
      });

      if (existingGrade) {
        return {
          ...existingGrade,
          subject: taskName,
          status: existingGrade.status || (existingGrade.mark && existingGrade.mark !== '-' ? 'Graded' : 'Pending')
        };
      } else {
        return {
          subject: taskName,
          mark: '-',
          gradeLetter: '-',
          status: 'Pending'
        };
      }
    });

    // THE FIX: The orphaned "zombie" grade resurrection loop has been completely removed from here as well.
  }

  getGradeLetter(mark: any, dbGrade: string): string {
    if (dbGrade && String(dbGrade).trim() !== '' && String(dbGrade).trim() !== '-') return dbGrade;
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

  goBack(): void {
    if (this.viewState === 'grades') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.allGrades = [];
      this.mainGrades = [];
      this.taskGrades = [];
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
          pdf.save(`${childName.replace(/\s+/g, '_')}_${this.selectedYear.replace(/\s+/g, '_')}_Report_Card.pdf`);

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
