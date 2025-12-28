import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf'; // 引入 jsPDF
import autoTable from 'jspdf-autotable'; // 引入表格插件

@Component({
  selector: 'app-refund',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './refund.html',
  styleUrl: './refund.css'
})
export class RefundComponent implements OnInit {
  years = ['Pre-Kindergarten', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];

  selectedYear: string = 'Year 5';
  selectedStudent: any = null;
  showExportConfirm: boolean = false;

  // Mock Students
  students: any[] = [
    { id: '20230501', name: 'Alice Brown', class: '5-B' },
    { id: '20230502', name: 'Liam Smith', class: '5-A' },
    { id: '20230503', name: 'Noah Johnson', class: '5-C' },
  ];

  // Mock Refunds Data
  allRefunds: any[] = [
    { id: 'REF-001', date: '2025-12-18', category: 'Book Fee', amount: 150.00, reason: 'Duplicate payment for Science book', status: 'Pending' },
    { id: 'REF-002', date: '2025-12-19', category: 'Sports', amount: 50.00, reason: 'Event cancelled due to rain', status: 'Pending' },
    { id: 'REF-003', date: '2025-10-10', category: 'Tuition', amount: 1200.00, reason: 'Overpayment Term 3', status: 'Approved' },
    { id: 'REF-004', date: '2025-09-01', category: 'Library', amount: 20.00, reason: 'Book found', status: 'Rejected' }
  ];

  constructor(private location: Location) {}

  ngOnInit() {
    this.selectedStudent = this.students[0];
  }

  goBack() {
    this.location.back();
  }

  selectYear(y: string) { this.selectedYear = y; }
  selectStudent(s: any) { this.selectedStudent = s; }

  get pendingRefunds() {
    return this.allRefunds.filter(r => r.status === 'Pending');
  }

  get historyRefunds() {
    return this.allRefunds.filter(r => r.status !== 'Pending');
  }

  processRefund(refund: any, action: 'Approved' | 'Rejected') {
    if (confirm(`Are you sure you want to ${action} this request?`)) {
      refund.status = action;
      alert(`Refund ${action} successfully.`);
    }
  }

  initiateExport() {
    // 只有当有历史记录时才允许导出
    if (this.historyRefunds.length === 0) {
      alert('No history records to export.');
      return;
    }
    this.showExportConfirm = true;
  }

  // --- 核心修复：真实的下载逻辑 ---
  confirmDownload() {
    this.showExportConfirm = false;

    // 1. 创建 PDF 对象
    const doc = new jsPDF();

    // 2. 添加标题
    doc.setFontSize(18);
    doc.text('Refund History Report', 14, 22);

    // 3. 添加学生信息
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Student: ${this.selectedStudent.name} (${this.selectedStudent.id})`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);

    // 4. 准备表格数据
    const tableBody = this.historyRefunds.map(item => [
      item.date,
      item.category,
      item.reason,
      `RM ${item.amount.toFixed(2)}`,
      item.status
    ]);

    // 5. 生成表格
    autoTable(doc, {
      head: [['Date', 'Category', 'Reason', 'Amount', 'Status']],
      body: tableBody,
      startY: 44,
      theme: 'grid',
      headStyles: { fillColor: [48, 232, 122], textColor: [14, 27, 19] }, // 使用您的绿色主题
    });

    // 6. 触发浏览器下载
    doc.save(`${this.selectedStudent.name}_Refund_History.pdf`);
  }
}
