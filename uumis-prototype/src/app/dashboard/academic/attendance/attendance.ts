import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  selectedYear: string = 'Year 10';
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

  students: any[] = [
    { id: 'STD-2023-001', name: 'Emma Richardson', class: 'Grade 10 - A', timeIn: '07:45 AM', status: 'Present', mcFile: null, mcUrl: null },
    { id: 'STD-2023-042', name: 'Liam Johnson', class: 'Grade 10 - A', timeIn: '--:--', status: 'Absent', mcFile: null, mcUrl: null },
    { id: 'STD-2023-089', name: 'Sophia Williams', class: 'Grade 10 - B', timeIn: '08:45 AM', status: 'Late', mcFile: null, mcUrl: null },
    { id: 'STD-2023-102', name: 'Olivia Brown', class: 'Grade 11 - A', timeIn: '07:50 AM', status: 'Present', mcFile: null, mcUrl: null },
    { id: 'STD-2023-115', name: 'Noah Davis', class: 'Grade 11 - A', timeIn: '08:00 AM', status: 'Present', mcFile: null, mcUrl: null }
  ];

  filteredStudents: any[] = [];

  constructor(private router: Router, private sanitizer: DomSanitizer, private location: Location) {}

  ngOnInit() { this.filterStudents(); }

  // Fix Back
  goBack() {
    this.location.back();
  }

  filterStudents() {
    this.filteredStudents = this.students.filter(s => {
      const matchYear = this.selectedYear ? s.class.includes(this.selectedYear.replace('Year', 'Grade')) : true;
      const matchSearch = this.searchQuery ? (s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || s.id.toLowerCase().includes(this.searchQuery.toLowerCase())) : true;
      return matchYear && matchSearch;
    });
  }

  toggleStatus(student: any) {
    if (student.status === 'Present') student.status = 'Absent';
    else if (student.status === 'Absent') student.status = 'Late';
    else student.status = 'Present';
  }

  handleMC(student: any) {
    if (student.mcFile) {
      this.clickedStudent = student;
      this.showMCConfirm = true;
    } else {
      this.uploadMC(student);
    }
  }

  uploadMC(student: any) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        student.mcFile = file.name;
        student.mcUrl = URL.createObjectURL(file);
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
    this.students.push({
      id: this.newStudent.id,
      name: this.newStudent.name,
      class: this.selectedYear.replace('Year', 'Grade') + ' - New',
      timeIn: '--:--',
      status: 'Absent',
      mcFile: null,
      mcUrl: null
    });
    this.filterStudents();
    this.toggleAddStudent();
  }

  deleteStudent(id: string) {
    if (confirm('Remove this student?')) {
      this.students = this.students.filter(s => s.id !== id);
      this.filterStudents();
    }
  }

  exportToPDF() {
    const doc = new jsPDF();
    doc.text('Attendance Report', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['No.', 'Student Name', 'ID', 'Time In', 'Status']],
      body: this.filteredStudents.map((s, i) => [i + 1, s.name, s.id, s.timeIn, s.status])
    });
    doc.save('attendance_report.pdf');
  }

  submitChanges() { alert('Changes saved!'); }
}
