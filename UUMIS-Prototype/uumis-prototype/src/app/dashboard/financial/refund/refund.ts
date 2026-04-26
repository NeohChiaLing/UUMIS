import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-refund',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './refund.html',
  styleUrl: './refund.css'
})
export class RefundComponent implements OnInit {
  years = ['Pre-Kindergarten', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];

  selectedYear: string = 'Kindergarten';
  selectedStudent: any = null;

  isGeneratingPDF: boolean = false;
  todayDate: string = new Date().toLocaleDateString();

  allStudents: any[] = [];
  students: any[] = [];
  allRefunds: any[] = [];

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.authService.getStudents().subscribe({
      next: (data: any[]) => {
        this.allStudents = data.map(user => {
          const grade = user.bio || 'Unassigned - Unassigned';
          const parts = grade.includes(' - ') ? grade.split(' - ') : grade.split('-');
          const yearStr = parts.length > 1 ? parts[1].trim() : 'Unassigned';

          return {
            dbId: user.id,
            id: user.studentId || user.verificationCode || user.username || '---',
            name: user.fullName || user.username || 'No Name',
            class: yearStr,
            year: yearStr
          };
        });
        this.selectYear(this.selectedYear);
      }
    });
  }

  selectYear(y: string) {
    this.selectedYear = y;
    this.students = this.allStudents.filter(s => s.year === y);
    if(this.students.length > 0) {
      this.selectStudent(this.students[0]);
    } else {
      this.selectedStudent = null;
      this.allRefunds = [];
    }
  }

  selectStudent(s: any) {
    this.selectedStudent = s;
    this.authService.getStudentRefunds(s.dbId).subscribe({
      next: (data) => this.allRefunds = data,
      error: () => console.log('Failed to fetch refunds')
    });
  }

  goBack() { this.location.back(); }

  get pendingRefunds() {
    return this.allRefunds.filter(r => r.status === 'Pending');
  }

  get historyRefunds() {
    return this.allRefunds.filter(r => r.status !== 'Pending');
  }

  processRefund(refund: any, action: 'Approved' | 'Rejected') {
    if (confirm(`Are you sure you want to ${action} this request?`)) {
      this.authService.updateRefundStatus(refund.id, action).subscribe({
        next: () => {
          refund.status = action;
          alert(`Refund ${action} successfully.`);
        },
        error: () => alert('Failed to update refund status.')
      });
    }
  }

  initiateExport() {
    if (this.historyRefunds.length === 0) {
      alert('No history records to export.');
      return;
    }

    this.isGeneratingPDF = true;
    setTimeout(() => {
      const element = document.getElementById('formal-refund-pdf');
      if (element) {
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${this.selectedStudent.name.replace(/\s+/g, '_')}_Refund_Report.pdf`);
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
