import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // 引入 Location
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent implements OnInit {
  academicYears: string[] = ['Pre-Kindergarten', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];

  selectedYear: string = 'Year 5';
  selectedStudent: any = null;

  // 弹窗状态
  showDownloadConfirm: boolean = false;
  showEditModal: boolean = false;
  showAddPaymentModal: boolean = false;

  // 编辑模式状态
  editMode: 'PAID' | 'DUE' = 'PAID';

  // 交易编辑状态
  isEditingTxn: boolean = false;
  editingTxnId: number | null = null;

  selectedTransaction: any = null;

  inputVal1: number = 0;
  inputVal2: number = 0;

  newTxn: any = { date: new Date().toISOString().split('T')[0], desc: '', method: 'Cash', amount: null, receiptFile: null };

  // Mock Data
  students: any[] = [
    { id: '20230501', name: 'Alice Brown', class: '5-B', scholarship: true, totalPaid: 0.00, due: 0.00 },
    { id: '20230502', name: 'Liam Smith', class: '5-A', scholarship: false, totalPaid: 0.00, due: 0.00 },
    { id: '20230503', name: 'Noah Johnson', class: '5-C', scholarship: false, totalPaid: 0.00, due: 0.00 },
    { id: '20230505', name: 'Oliver Jones', class: '5-B', scholarship: false, totalPaid: 0.00, due: 0.00 }
  ];

  transactions: any[] = [];

  // 注入 Location 服务
  constructor(private location: Location) {}

  ngOnInit() { this.selectedStudent = this.students[0]; }
  selectYear(year: string) { this.selectedYear = year; }
  selectStudent(student: any) { this.selectedStudent = student; }

  // --- 新增：返回按钮逻辑 ---
  goBack() {
    this.location.back();
  }

  // --- 余额手动调整逻辑 (保持不变) ---
  openEditTotalPaid() {
    this.editMode = 'PAID';
    this.inputVal1 = this.selectedStudent.totalPaid;
    this.inputVal2 = 0;
    this.showEditModal = true;
  }

  openEditOutstanding() {
    this.editMode = 'DUE';
    this.inputVal1 = 0;
    this.inputVal2 = 0;
    this.showEditModal = true;
  }

  saveUpdate() {
    if (this.editMode === 'PAID') {
      this.selectedStudent.totalPaid = this.inputVal1;
      alert('Total Paid updated.');
    } else {
      const newOutstanding = this.inputVal1 - this.inputVal2;
      this.selectedStudent.due = newOutstanding < 0 ? 0 : newOutstanding;
      alert('Outstanding amount recalculated and updated.');
    }
    this.showEditModal = false;
  }

  changeStatus(txn: any, status: string) {
    txn.status = status;
  }

  // --- 交易增删改查逻辑 ---
  openAddPayment() {
    this.isEditingTxn = false;
    this.editingTxnId = null;
    this.newTxn = { date: new Date().toISOString().split('T')[0], desc: '', method: 'Cash', amount: null, receiptFile: null };
    this.showAddPaymentModal = true;
  }

  openEditTransaction(txn: any) {
    this.isEditingTxn = true;
    this.editingTxnId = txn.id;
    this.newTxn = { ...txn };
    this.showAddPaymentModal = true;
  }

  submitNewPayment() {
    if (!this.newTxn.amount) return;
    this.transactions.unshift({
      id: Date.now(),
      date: this.newTxn.date,
      desc: this.newTxn.desc,
      inv: 'Inv #' + Math.floor(Math.random() * 100000),
      method: this.newTxn.method,
      amount: this.newTxn.amount,
      status: 'Pending',
      receiptFile: this.newTxn.receiptFile
    });
    this.selectedStudent.totalPaid += this.newTxn.amount;
    this.showAddPaymentModal = false;
  }

  updateTransaction() {
    if (!this.newTxn.amount) return;
    const index = this.transactions.findIndex(t => t.id === this.editingTxnId);
    if (index !== -1) {
      this.transactions[index] = { ...this.newTxn, id: this.editingTxnId, status: this.transactions[index].status };
      alert('Transaction details updated successfully.');
    }
    this.showAddPaymentModal = false;
  }

  deleteTransaction(txnId: number) {
    if (confirm('Are you sure you want to delete this transaction record?')) {
      this.transactions = this.transactions.filter(t => t.id !== txnId);
    }
  }

  onReceiptSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.newTxn.receiptFile = file.name;
  }

  uploadReceipt(txn: any) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf,.jpg,.png';
    input.onchange = (e: any) => { if (e.target.files[0]) txn.receiptFile = e.target.files[0].name; };
    input.click();
  }

  askDownload(txn: any) {
    if (!txn.receiptFile) { alert('No file.'); return; }
    this.selectedTransaction = txn;
    this.showDownloadConfirm = true;
  }

  confirmDownload() {
    alert(`Downloading ${this.selectedTransaction.receiptFile}...`);
    this.showDownloadConfirm = false;
  }

  submitChanges() { alert('All data saved.'); }
}
