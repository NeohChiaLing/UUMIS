import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../../services/auth.service'; // Verify path

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class AttendanceComponent implements OnInit {
  years = ['Pre-Kindergarten', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];
  timePeriods = ['Day', 'Month', 'Year'];

  selectedYear: string = 'Kindergarten';
  selectedPeriod: string = 'Day';
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: string = new Date().toISOString().slice(0, 7);
  selectedYearVal: string = new Date().getFullYear().toString();
  searchQuery: string = '';

  isAddingStudent: boolean = false;
  showMCConfirm: boolean = false;
  isViewingMC: boolean = false;
  currentMCUrl: SafeResourceUrl | null = null;
  clickedStudent: any = null;

  newStudent = { name: '', id: '' };

  allStudents: any[] = [];
  filteredStudents: any[] = [];

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  goBack() {
    this.location.back();
  }

  // --- DYNAMIC STATS ---
  get totalPresent() { return this.filteredStudents.filter(s => s.status === 'Present').length; }
  get totalAbsent() { return this.filteredStudents.filter(s => s.status === 'Absent').length; }
  get totalLate() { return this.filteredStudents.filter(s => s.status === 'Late').length; }

  // --- 1. Fetch Students & DB Attendance ---
  loadData() {
    // Get all users from Database
    this.authService.getUsers().subscribe({
      next: (users) => {
        // Filter students by selected Year Group
        const yearStudents = users.filter((u: any) => {
          if ((u.role || '').toLowerCase() !== 'student' || !u.bio || u.bio === 'Unassigned') return false;
          const parts = u.bio.split('-');
          const stuLevel = parts[0].trim().toLowerCase();
          const stuYear = parts.length > 1 ? parts[1].trim().toLowerCase() : stuLevel;
          const targetYear = this.selectedYear.toLowerCase();
          return stuYear === targetYear || stuLevel === targetYear;
        });

        // Get Attendance Records for the specific Date
        this.authService.getAttendance(this.selectedYear, this.selectedDate).subscribe({
          next: (attendanceRecords) => {

            // Merge the DB Students with their Attendance Status
            this.allStudents = yearStudents.map((stu: any) => {
              const record = attendanceRecords.find(r => r.studentId === stu.username);
              return {
                dbId: record ? record.id : null,
                id: stu.username,
                name: stu.fullName || stu.username,
                class: this.selectedYear,
                timeIn: record ? record.timeIn : '--:--',
                status: record ? record.status : 'Absent', // Default if no record
                mcFile: record ? record.mcFile : null,
                mcUrl: record ? record.mcUrl : null
              };
            });

            this.filterStudents();
          }
        });
      }
    });
  }

  // 2. Filter Search Box
  filterStudents() {
    this.filteredStudents = this.allStudents.filter(s => {
      const matchSearch = this.searchQuery ? (s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || s.id.toLowerCase().includes(this.searchQuery.toLowerCase())) : true;
      return matchSearch;
    });
  }

  toggleStatus(student: any) {
    if (student.status === 'Present') {
      student.status = 'Absent';
      student.timeIn = '--:--';
    } else if (student.status === 'Absent') {
      student.status = 'Late';
      // Auto set time to current time
      student.timeIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      student.status = 'Present';
      student.timeIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  handleMC(student: any) {
    if (student.mcFile) {
      this.clickedStudent = student;
      this.showMCConfirm = true;
    } else {
      this.uploadMC(student);
    }
  }

  // Uses FileReader to create a Base64 string for the DB
  uploadMC(student: any) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf, image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        student.mcFile = file.name;
        const reader = new FileReader();
        reader.onload = (event: any) => {
          student.mcUrl = event.target.result; // This is the Base64 String
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  previewMC() {
    if (this.clickedStudent?.mcUrl) {
      this.currentMCUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.clickedStudent.mcUrl);
      this.isViewingMC = true;
      this.showMCConfirm = false;
    }
  }

  downloadMC() {
    if (this.clickedStudent?.mcUrl) {
      const a = document.createElement('a');
      a.href = this.clickedStudent.mcUrl;
      a.download = this.clickedStudent.mcFile;
      a.click();
      this.showMCConfirm = false;
    }
  }

  toggleAddStudent() {
    this.isAddingStudent = !this.isAddingStudent;
    this.newStudent = { name: '', id: '' };
  }

  saveNewStudent() {
    if (!this.newStudent.name || !this.newStudent.id) return alert('Please fill all fields');
    this.allStudents.push({
      id: this.newStudent.id,
      name: this.newStudent.name,
      class: this.selectedYear,
      timeIn: '--:--',
      status: 'Absent',
      mcFile: null,
      mcUrl: null
    });
    this.filterStudents();
    this.toggleAddStudent();
  }

  deleteStudent(student: any) {
    if (confirm('Remove this student?')) {
      if (student.dbId) {
        this.authService.deleteAttendance(student.dbId).subscribe();
      }
      this.allStudents = this.allStudents.filter(s => s.id !== student.id);
      this.filterStudents();
    }
  }

  exportToPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Attendance Report: ${this.selectedYear}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${this.selectedDate}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [['No.', 'Student Name', 'ID', 'Time In', 'Status']],
      body: this.filteredStudents.map((s, i) => [i + 1, s.name, s.id, s.timeIn, s.status])
    });
    doc.save(`Attendance_${this.selectedYear}_${this.selectedDate}.pdf`);
  }

  // --- SUBMIT TO DATABASE ---
  submitChanges() {
    const payload = this.allStudents.map(s => ({
      studentId: s.id,
      studentName: s.name,
      yearGroup: this.selectedYear,
      date: this.selectedDate,
      timeIn: s.timeIn,
      status: s.status,
      mcFile: s.mcFile,
      mcUrl: s.mcUrl
    }));

    this.authService.saveAttendance(payload).subscribe({
      next: () => {
        alert('Attendance Records Saved to Database!');
        this.loadData(); // Refresh to map the database ID's
      },
      error: () => alert('Failed to save attendance.')
    });
  }
}
