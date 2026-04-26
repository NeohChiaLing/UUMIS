import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../../services/auth.service';

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

  selectedYear: string = 'Year 1'; // THE FIX: Changed default to Year 1 based on your screenshots
  selectedPeriod: string = 'Day';
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: string = new Date().toISOString().slice(0, 7);
  selectedYearVal: string = new Date().getFullYear().toString();
  searchQuery: string = '';

  isAddingStudent: boolean = false;
  showMCConfirm: boolean = false;
  isViewingMC: boolean = false;
  currentMCUrl: SafeResourceUrl | string = '';
  clickedStudent: any = null;

  newStudent = { name: '', id: '' };

  allStudents: any[] = [];
  filteredStudents: any[] = [];

  isGeneratingPDF: boolean = false;

  constructor(
    private router: Router,
    public sanitizer: DomSanitizer,
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  goBack() {
    this.location.back();
  }

  get totalPresent() { return this.filteredStudents.filter(s => s.status.toUpperCase() === 'PRESENT').length; }
  get totalAbsent() { return this.filteredStudents.filter(s => s.status.toUpperCase() === 'ABSENT').length; }
  get totalLate() { return this.filteredStudents.filter(s => s.status.toUpperCase() === 'LATE').length; }

  loadData() {
    let targetDate = this.selectedDate;
    if (this.selectedPeriod === 'Month') targetDate = this.selectedMonth;
    if (this.selectedPeriod === 'Year') targetDate = this.selectedYearVal;

    this.authService.getUsers().subscribe({
      next: (users) => {
        const yearStudents = users.filter((u: any) => {
          if ((u.role || '').toLowerCase() !== 'student' || !u.bio || u.bio === 'Unassigned') return false;

          // THE FIX: Bulletproof fuzzy logic for matching class years!
          const bioSafe = u.bio.toLowerCase();
          const targetSafe = this.selectedYear.toLowerCase();

          return bioSafe.includes(targetSafe);
        });

        this.authService.getAttendance(this.selectedYear, targetDate).subscribe({
          next: (attendanceRecords) => {

            this.allStudents = yearStudents.map((stu: any) => {
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

            this.filterStudents();
          }
        });
      }
    });
  }

  filterStudents() {
    this.filteredStudents = this.allStudents.filter(s => {
      const matchSearch = this.searchQuery ? (s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || s.id.toLowerCase().includes(this.searchQuery.toLowerCase())) : true;
      return matchSearch;
    });
  }

  toggleStatus(student: any) {
    const statuses = ['PRESENT', 'ABSENT', 'LATE'];
    let idx = statuses.indexOf(student.status.toUpperCase());
    student.status = statuses[(idx + 1) % statuses.length];

    if (student.status === 'PRESENT' || student.status === 'LATE') {
      student.timeIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      student.timeIn = '--:--';
    }
  }

  handleMC(student: any) {
    if (student.mcUrl) {
      this.clickedStudent = student;
      this.currentMCUrl = student.mcUrl;
      this.showMCConfirm = true;
    } else {
      this.uploadMC(student);
    }
  }

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
          student.mcUrl = event.target.result;
          student.status = 'ABSENT';
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  previewMC() {
    if (this.currentMCUrl) {
      this.isViewingMC = true;
      this.showMCConfirm = false;
    }
  }

  downloadMC() {
    if (this.currentMCUrl) {
      const a = document.createElement('a');
      a.href = this.currentMCUrl as string;
      a.download = `MC_${this.clickedStudent.name}.pdf`;
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
      timeIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: 'PRESENT',
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

  submitChanges() {
    let targetDate = this.selectedDate;
    if (this.selectedPeriod === 'Month') targetDate = this.selectedMonth;
    if (this.selectedPeriod === 'Year') targetDate = this.selectedYearVal;

    const payload = this.allStudents.map(s => ({
      studentId: s.id,
      studentName: s.name,
      yearGroup: this.selectedYear,
      date: targetDate,
      timeIn: s.timeIn,
      status: s.status,
      mcFile: s.mcFile,
      mcUrl: s.mcUrl
    }));

    this.authService.saveAttendance(payload).subscribe({
      next: () => {
        alert('Attendance Records Saved to Database!');
        this.loadData();
      },
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
      const element = document.getElementById('formal-attendance-pdf');
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
}
