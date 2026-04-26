import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './teacher-attendance.html',
  styleUrl: './teacher-attendance.css'
})
export class TeacherAttendanceComponent implements OnInit {

  years: string[] = [];

  selectedYear: string = '';
  selectedPeriod: string = 'Day';
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: string = new Date().toISOString().split('T')[0].slice(0,7);
  selectedYearVal: string = new Date().getFullYear().toString();
  searchQuery: string = '';

  timePeriods: string[] = ['Day', 'Month', 'Year'];
  allStudents: any[] = [];
  students: any[] = [];
  filteredStudents: any[] = [];

  totalPresent: number = 0; totalAbsent: number = 0; totalLate: number = 0;

  isAddingStudent: boolean = false; newStudent = { name: '', id: '' };
  showMCConfirm: boolean = false; isViewingMC: boolean = false; currentMCUrl: string | SafeResourceUrl = ''; clickedStudent: any = null;

  isGeneratingPDF: boolean = false;
  todayDate: string = new Date().toLocaleDateString();

  constructor(private location: Location, private authService: AuthService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    const localUser = this.authService.getCurrentUser();
    if (!localUser) return;

    this.authService.getUsers().subscribe({
      next: (users: any[]) => {

        // THE FIX: Correctly search the 'users' array instead of the undefined 'teachers' variable!
        const myFreshProfile = users.find(u =>
          u.id === localUser.id ||
          (u.email && u.email === localUser.email) ||
          (u.username && u.username === localUser.username)
        );

        if (myFreshProfile) {
          const bio = myFreshProfile.bio || '';
          const classList = bio ? bio.split(',').map((s: string) => s.trim()) : [];

          this.years = classList.map((c: string) => {
            const parts = c.includes(' - ') ? c.split(' - ') : c.split('-');
            return parts.length > 1 ? parts[1].trim() : parts[0].trim();
          }).filter((y: string) => y !== 'Unassigned' && y !== '');

          // Fallback just in case
          if (this.years.length === 0) this.years = ['Year 1', 'Year 2', 'Year 3'];

          if (this.years.length > 0) {
            this.selectedYear = this.years[0];
            this.loadData();
          }
        }
      }
    });
  }

  goBack() { this.location.back(); }

  get totalPresentCalc() { return this.filteredStudents.filter(s => s.status.toUpperCase() === 'PRESENT').length; }
  get totalAbsentCalc() { return this.filteredStudents.filter(s => s.status.toUpperCase() === 'ABSENT').length; }
  get totalLateCalc() { return this.filteredStudents.filter(s => s.status.toUpperCase() === 'LATE').length; }

  loadData() {
    if (!this.selectedYear) return;

    let targetDate = this.selectedDate;
    if (this.selectedPeriod === 'Month') targetDate = this.selectedMonth;
    if (this.selectedPeriod === 'Year') targetDate = this.selectedYearVal;

    this.authService.getUsers().subscribe({
      next: (users) => {
        const classStudents = users.filter((u: any) => {
          if ((u.role || '').toLowerCase() !== 'student' || !u.bio || u.bio === 'Unassigned') return false;

          const bioSafe = u.bio.toLowerCase();
          const targetSafe = this.selectedYear.toLowerCase();

          return bioSafe.includes(targetSafe);
        });

        this.authService.getAttendance(this.selectedYear, targetDate).subscribe({
          next: (attendanceRecords) => {
            this.students = classStudents.map((stu: any) => {
              const uniqueId = stu.student_id || stu.studentId || stu.username || stu.email || stu.id.toString();
              const record = attendanceRecords.find(r => r.student_id === uniqueId || r.studentId === uniqueId);

              return {
                dbId: record ? record.id : null,
                id: uniqueId,
                name: stu.fullName || stu.username || 'Unknown Student',
                class: this.selectedYear,
                timeIn: record ? (record.time_in || record.timeIn || '--:--') : '--:--',
                status: record ? String(record.status).toUpperCase() : 'ABSENT',
                mcFile: record ? (record.mc_file || record.mcFile) : null,
                mcUrl: record ? (record.mc_url || record.mcUrl) : null
              };
            });

            this.allStudents = this.students;
            this.filterStudents();
            this.calculateStats();
          }
        });
      }
    });
  }

  filterStudents() {
    if (!this.searchQuery) { this.filteredStudents = [...this.students]; }
    else {
      const q = this.searchQuery.toLowerCase();
      this.filteredStudents = this.students.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
  }

  calculateStats() {
    this.totalPresent = this.totalPresentCalc;
    this.totalAbsent = this.totalAbsentCalc;
    this.totalLate = this.totalLateCalc;
  }

  toggleStatus(student: any) {
    const statuses = ['PRESENT', 'ABSENT', 'LATE'];
    let idx = statuses.indexOf(student.status.toUpperCase());
    student.status = statuses[(idx + 1) % statuses.length];

    if (student.status === 'PRESENT' || student.status === 'LATE') {
      student.timeIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else { student.timeIn = '--:--'; }

    this.calculateStats();
  }

  toggleAddStudent() { this.isAddingStudent = !this.isAddingStudent; this.newStudent = { name: '', id: '' }; }

  saveNewStudent() {
    if (!this.newStudent.name || !this.newStudent.id) { alert("Please fill in both fields"); return; }
    this.students.push({
      dbId: null, name: this.newStudent.name, id: this.newStudent.id,
      timeIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: 'PRESENT', mcFile: null, mcUrl: null
    });
    this.allStudents = this.students;
    this.filterStudents(); this.calculateStats(); this.toggleAddStudent();
  }

  deleteStudent(student: any) {
    if (confirm(`Are you sure you want to remove ${student.name}?`)) {
      if (student.dbId) {
        this.authService.deleteAttendance(student.dbId).subscribe({
          next: () => {
            this.students = this.students.filter(s => s !== student);
            this.allStudents = this.students;
            this.filterStudents(); this.calculateStats();
            alert('Record deleted from Database.');
          }
        });
      } else {
        this.students = this.students.filter(s => s !== student);
        this.allStudents = this.students;
        this.filterStudents(); this.calculateStats();
      }
    }
  }

  submitChanges() {
    let targetDate = this.selectedDate;
    if (this.selectedPeriod === 'Month') targetDate = this.selectedMonth;
    if (this.selectedPeriod === 'Year') targetDate = this.selectedYearVal;

    const payload = this.students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      yearGroup: this.selectedYear,
      date: targetDate,
      status: s.status,
      timeIn: s.timeIn,
      mcFile: s.mcFile,
      mcUrl: s.mcUrl
    }));

    if (payload.length === 0) return;

    this.authService.saveAttendance(payload).subscribe({
      next: () => { alert('Attendance saved successfully!'); this.loadData(); },
      error: () => alert('Failed to save attendance.')
    });
  }

  exportToPDF() {
    if (this.filteredStudents.length === 0) {
      alert("Please load a class roster first.");
      return;
    }
    this.isGeneratingPDF = true;
    setTimeout(() => {
      const element = document.getElementById('formal-teacher-attendance-pdf');
      if (element) {
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Attendance_Report_${this.selectedYear.replace(/\s+/g, '_')}_${this.selectedDate}.pdf`);
          this.isGeneratingPDF = false;
        }).catch(err => {
          console.error(err);
          alert('Failed to generate PDF.');
          this.isGeneratingPDF = false;
        });
      }
    }, 200);
  }

  handleMC(student: any) {
    this.clickedStudent = student;
    if (student.mcUrl) { this.currentMCUrl = student.mcUrl; this.showMCConfirm = true; }
    else {
      const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/pdf, image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          student.mcFile = file.name;
          const reader = new FileReader();
          reader.onload = (event: any) => {
            student.mcUrl = event.target.result; student.status = 'ABSENT'; this.calculateStats();
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  }

  previewMC() { this.showMCConfirm = false; this.isViewingMC = true; }
  downloadMC() {
    if (this.currentMCUrl) {
      const a = document.createElement('a'); a.href = this.currentMCUrl as string; a.download = `MC_${this.clickedStudent.name}.pdf`; a.click();
    }
    this.showMCConfirm = false;
  }
}
