import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-attendance.html',
  styles: []
})
export class TeacherAttendanceComponent implements OnInit {

  years: string[] = []; // MULTIPLE Years

  selectedYear: string = '';
  selectedPeriod: string = 'Day';
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: string = new Date().toISOString().split('T')[0].slice(0,7);
  selectedYearVal: string = '2026';
  searchQuery: string = '';

  timePeriods: string[] = ['Day', 'Month', 'Year'];
  students: any[] = [];
  filteredStudents: any[] = [];

  totalPresent: number = 0; totalAbsent: number = 0; totalLate: number = 0;

  isAddingStudent: boolean = false; newStudent = { name: '', id: '' };
  showMCConfirm: boolean = false; isViewingMC: boolean = false; currentMCUrl: string = ''; clickedStudent: any = null;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    const localUser = this.authService.getCurrentUser();
    if (!localUser) return;

    this.authService.getUsers().subscribe({
      next: (users: any[]) => {
        const myFreshProfile = users.find(u => u.id === localUser.id || (u.email && u.email === localUser.email));

        if (myFreshProfile) {
          // --- NEW: Parse Multiple Classes ---
          const bio = myFreshProfile.bio || '';
          const classList = bio ? bio.split(',').map((s: string) => s.trim()) : [];

          // THE FIX: Added (c: string) and (y: string) to satisfy the strict TS compiler
          this.years = classList.map((c: string) => {
            const parts = c.includes(' - ') ? c.split(' - ') : c.split('-');
            return parts.length > 1 ? parts[1].trim() : parts[0].trim();
          }).filter((y: string) => y !== 'Unassigned' && y !== '');

          if (this.years.length > 0) {
            this.selectedYear = this.years[0]; // Auto-select first class
            this.loadData();
          }
        }
      }
    });
  }

  goBack() { this.location.back(); }

  loadData() {
    if (!this.selectedYear) return;

    let targetDate = this.selectedDate;
    if (this.selectedPeriod === 'Month') targetDate = this.selectedMonth;
    if (this.selectedPeriod === 'Year') targetDate = this.selectedYearVal;

    this.authService.getAttendance(this.selectedYear, targetDate).subscribe({
      next: (records) => {
        if (records && records.length > 0) { this.mapExistingRecords(records); }
        else { this.loadClassRoster(); }
      },
      error: () => this.loadClassRoster()
    });
  }

  loadClassRoster() {
    this.authService.getUsers().subscribe({
      next: (users) => {
        const classStudents = users.filter((u: any) => {
          if ((u.role || '').toLowerCase() !== 'student' || !u.bio || u.bio === 'Unassigned') return false;
          const parts = u.bio.includes(' - ') ? u.bio.split(' - ') : u.bio.split('-');
          const stuLevel = parts[0].trim().toLowerCase();
          const stuYear = parts.length > 1 ? parts[1].trim().toLowerCase() : stuLevel;
          return stuYear === this.selectedYear.toLowerCase() || stuLevel === this.selectedYear.toLowerCase();
        });

        this.students = classStudents.map((stu: any) => ({
          dbId: null, name: stu.fullName || stu.username || 'Unknown Student',
          id: stu.username || stu.email || stu.id.toString(),
          timeIn: '--:--', status: 'Absent', mcFile: null
        }));

        this.filterStudents(); this.calculateStats();
      }
    });
  }

  mapExistingRecords(records: any[]) {
    this.students = records.map(r => ({
      dbId: r.id, name: r.studentName, id: r.studentUsername,
      timeIn: r.timeIn || '--:--', status: r.status,
      mcFile: r.remarks && r.remarks.includes('MC:') ? r.remarks.split('MC:')[1].trim() : null
    }));
    this.filterStudents(); this.calculateStats();
  }

  filterStudents() {
    if (!this.searchQuery) { this.filteredStudents = [...this.students]; }
    else {
      const q = this.searchQuery.toLowerCase();
      this.filteredStudents = this.students.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
  }

  calculateStats() {
    this.totalPresent = this.students.filter(s => s.status === 'Present').length;
    this.totalAbsent = this.students.filter(s => s.status === 'Absent').length;
    this.totalLate = this.students.filter(s => s.status === 'Late').length;
  }

  toggleStatus(student: any) {
    if (student.dbId) return;
    const statuses = ['Present', 'Absent', 'Late'];
    let idx = statuses.indexOf(student.status);
    student.status = statuses[(idx + 1) % statuses.length];

    if (student.status === 'Present' || student.status === 'Late') {
      student.timeIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else { student.timeIn = '--:--'; }

    this.calculateStats();
  }

  toggleAddStudent() { this.isAddingStudent = !this.isAddingStudent; this.newStudent = { name: '', id: '' }; }

  saveNewStudent() {
    if (!this.newStudent.name || !this.newStudent.id) { alert("Please fill in both fields"); return; }
    this.students.push({
      dbId: null, name: this.newStudent.name, id: this.newStudent.id,
      timeIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Present', mcFile: null
    });
    this.filterStudents(); this.calculateStats(); this.toggleAddStudent();
  }

  deleteStudent(student: any) {
    if (confirm(`Are you sure you want to remove ${student.name}?`)) {
      if (student.dbId) {
        this.authService.deleteAttendance(student.dbId).subscribe({
          next: () => {
            this.students = this.students.filter(s => s !== student);
            this.filterStudents(); this.calculateStats();
            alert('Record deleted from Database.');
          }
        });
      } else {
        this.students = this.students.filter(s => s !== student);
        this.filterStudents(); this.calculateStats();
      }
    }
  }

  submitChanges() {
    let targetDate = this.selectedDate;
    if (this.selectedPeriod === 'Month') targetDate = this.selectedMonth;
    if (this.selectedPeriod === 'Year') targetDate = this.selectedYearVal;

    const payload = this.students
      .filter(s => !s.dbId)
      .map(s => ({
        studentUsername: s.id, studentName: s.name, yearGroup: this.selectedYear,
        date: targetDate, status: s.status, timeIn: s.timeIn,
        remarks: s.mcFile ? 'MC: ' + s.mcFile : ''
      }));

    if (payload.length === 0) return;

    this.authService.saveAttendance(payload).subscribe({
      next: () => { alert('Attendance saved successfully!'); this.loadData(); },
      error: () => alert('Failed to save attendance.')
    });
  }

  exportToPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(`Daily Attendance Report: ${this.selectedYear}`, 14, 20);
    doc.setFontSize(12); doc.text(`Date: ${this.selectedDate}`, 14, 30);
    autoTable(doc, {
      startY: 45, head: [['Student Name', 'Username/ID', 'Status', 'Time In']],
      body: this.students.map(s => [s.name, s.id, s.status, s.timeIn]),
    });
    doc.save(`Attendance_${this.selectedYear}_${this.selectedDate}.pdf`);
  }

  handleMC(student: any) {
    this.clickedStudent = student;
    if (student.mcFile) { this.currentMCUrl = student.mcFile; this.showMCConfirm = true; }
    else {
      const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/pdf, image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event: any) => {
            student.mcFile = event.target.result; student.status = 'Absent'; this.calculateStats();
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
      const a = document.createElement('a'); a.href = this.currentMCUrl; a.download = `MC_${this.clickedStudent.name}.pdf`; a.click();
    }
    this.showMCConfirm = false;
  }
}
