import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-grades.html',
  styles: []
})
export class StudentGradesComponent implements OnInit {
  // 模拟数据：学生只能看到自己的成绩
  studentGrades = [
    { subject: 'Mathematics', mark: 85, grade: 'A', status: 'Finalized' },
    { subject: 'English', mark: 78, grade: 'B+', status: 'Finalized' },
    { subject: 'Science', mark: 92, grade: 'A+', status: 'Finalized' },
    { subject: 'History', mark: 65, grade: 'B', status: 'Pending Review' }
  ];

  constructor(private location: Location, private router: Router) {}

  ngOnInit() {}

  goBack() {
    this.location.back();
  }

  downloadReportCard() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Student Report Card', 14, 20);
    doc.setFontSize(12);
    doc.text(`Student: Alex Morgan (Grade 10)`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);

    autoTable(doc, {
      startY: 45,
      head: [['Subject', 'Mark', 'Grade', 'Status']],
      body: this.studentGrades.map(g => [g.subject, g.mark, g.grade, g.status]),
      theme: 'grid',
      headStyles: { fillColor: [48, 232, 122], textColor: [20, 20, 20] } // Mint Green header
    });

    doc.save('My_Report_Card.pdf');
  }
}
