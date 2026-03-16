import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  showExportConfirm: boolean = false;

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
          const parts = grade.split('-');
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
    this.showExportConfirm = true;
  }

  confirmDownload() {
    this.showExportConfirm = false;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Refund History Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Student: ${this.selectedStudent.name} (${this.selectedStudent.id})`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);

    const tableBody = this.historyRefunds.map(item => [
      item.date,
      item.invoiceNo, // Swapped category for invoice number since parent submits invoiceNo
      item.reason,
      `RM ${item.amount.toFixed(2)}`,
      item.status
    ]);

    autoTable(doc, {
      head: [['Date', 'Invoice No', 'Reason', 'Amount', 'Status']],
      body: tableBody,
      startY: 44,
      theme: 'grid',
      headStyles: { fillColor: [48, 232, 122], textColor: [14, 27, 19] },
    });

    doc.save(`${this.selectedStudent.name}_Refund_History.pdf`);
  }
}
