import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Import Location
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-grading',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './grading.html',
  styleUrl: './grading.css'
})
export class GradingComponent implements OnInit {
  years = ['Pre-Kindergarten', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];
  subjects = ['English', 'Mathematics', 'Malay', 'Science', 'History', 'Geography', 'Islamic Studies', 'Mandarin', 'Physical Education', 'Art', 'Computer Science'];

  selectedYear: string = '';
  selectedSubject: string = '';
  students: any[] = [];

  constructor(private router: Router, private location: Location) {} // Inject Location

  ngOnInit() {}

  // Fix Back
  goBack() {
    this.location.back();
  }

  loadStudentList() {
    if (this.selectedYear && this.selectedSubject) {
      this.students = [
        { id: 'S-1001', name: 'Alice Johnson', mark: 85, grade: 'A', status: 'Graded', isEditing: false },
        { id: 'S-1002', name: 'Bob Smith', mark: 72, grade: 'B', status: 'Graded', isEditing: false },
        { id: 'S-1003', name: 'Charlie Davis', mark: 0, grade: '-', status: 'Pending', isEditing: false },
        { id: 'S-1004', name: 'Diana Evans', mark: 91, grade: 'A+', status: 'Graded', isEditing: false },
        { id: 'S-1005', name: 'Ethan Hunt', mark: 0, grade: '-', status: 'Absent', isEditing: false }
      ];
    }
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

  exportToPDF() {
    if (!this.selectedYear || !this.selectedSubject) {
      alert('Please select Year and Subject first.');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Grading Report: ${this.selectedSubject} (${this.selectedYear})`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [['Student ID', 'Name', 'Mark', 'Grade', 'Status']],
      body: this.students.map(s => [s.id, s.name, s.mark, s.grade, s.status]),
    });
    doc.save(`${this.selectedSubject}_${this.selectedYear}_Report.pdf`);
  }

  submitAllGrades() {
    this.students.forEach(s => s.isEditing = false);
    alert('All grades have been submitted to the system.');
  }
}
