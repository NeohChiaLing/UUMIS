import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-grades.html',
  styles: []
})
export class StudentGradesComponent implements OnInit {

  studentGrades: any[] = [];

  // Dynamic user data
  studentName: string = 'Student';
  studentYear: string = 'Unknown Grade';
  studentUsername: string = '';

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    // 1. Get logged-in student info securely from Local Storage
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.studentName = user.fullName || user.username;
          this.studentUsername = user.username;
          this.studentYear = user.bio && user.bio !== 'Unassigned' ? user.bio : 'Unknown Grade';
        } catch (e) {}
      }
    }

    // 2. Fetch grades from database
    this.loadMyGrades();
  }

  loadMyGrades() {
    if (!this.studentUsername) return;

    this.authService.getMyGrades(this.studentUsername).subscribe({
      next: (grades: any[]) => {
        this.studentGrades = grades;
      },
      error: (err) => {
        console.error(err);
        // This popup will appear if the Java server rejects the request!
        alert('Could not connect to the grading database! Please ensure your Spring Boot server has the getStudentGrades endpoint and is currently running.');
      }
    });
  }

  goBack() {
    this.location.back();
  }

  getGradeClass(grade: string): string {
    if (!grade || grade === '-') return 'bg-slate-100 text-slate-500';
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700';
    if (grade === 'F') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  }

  downloadReportCard() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Student Report Card', 14, 20);
    doc.setFontSize(12);

    doc.text(`Student: ${this.studentName} (${this.studentYear})`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);

    autoTable(doc, {
      startY: 45,
      head: [['Subject', 'Mark', 'Grade', 'Status']],
      body: this.studentGrades.map(g => [g.subject, g.mark, g.gradeLetter || g.grade, g.status]),
      theme: 'grid',
      headStyles: { fillColor: [48, 232, 122], textColor: [20, 20, 20] }
    });

    doc.save(`${this.studentName}_Report_Card.pdf`);
  }
}
