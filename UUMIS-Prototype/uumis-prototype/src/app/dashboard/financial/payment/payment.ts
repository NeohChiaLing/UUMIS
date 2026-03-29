import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

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

  showDownloadConfirm: boolean = false;
  showEditModal: boolean = false;
  showAddPaymentModal: boolean = false;
  editMode: 'PAID' | 'DUE' = 'PAID';

  isEditingTxn: boolean = false;
  editingTxnId: number | null = null;
  selectedTransaction: any = null;

  inputVal1: number = 0;
  inputVal2: number = 0;

  newTxn: any = { date: new Date().toISOString().split('T')[0], description: '', method: 'Cash', amount: null, receiptFile: null, fileUrl: null };

  allStudents: any[] = [];
  students: any[] = [];
  transactions: any[] = [];

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const user = JSON.parse(userStr);
      const role = user.role ? user.role.toLowerCase().trim() : '';

      if (role === 'register_manager') {
        alert('Access Denied: You are not authorized for Financial Management.');
        this.location.back();
        return;
      }
    }
    this.loadStudents();
  }

  loadStudents() {
    this.authService.getStudents().subscribe({
      next: (data: any[]) => {
        this.allStudents = data.map(user => {
          const grade = user.bio || 'Unassigned - Unassigned';
          // FIX: Split by space-dash-space so "Pre-Kindergarten" doesn't get broken in half!
          const parts = grade.split(' - ');
          const yearStr = parts.length > 1 ? parts[1].trim() : 'Unassigned';

          return {
            dbId: user.id,
            id: user.studentId || user.verificationCode || user.username || '---',
            name: user.fullName || user.username || 'No Name',
            class: yearStr,
            year: yearStr,
            totalPaid: user.totalPaid || 0.0,
            due: user.outstandingDue || 0.0
          };
        });

        this.selectYear(this.selectedYear);
      }
    });
  }

  selectYear(year: string) {
    this.selectedYear = year;
    this.students = this.allStudents.filter(s => s.year === year);

    if (this.students.length > 0) {
      this.selectStudent(this.students[0]);
    } else {
      this.selectedStudent = null;
      this.transactions = [];
    }
  }

  selectStudent(student: any) {
    this.selectedStudent = student;
    this.authService.getStudentPayments(student.dbId).subscribe({
      next: (data) => this.transactions = data,
      error: () => console.log('Failed to fetch transactions.')
    });
  }

  goBack() { this.location.back(); }

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
    } else {
      const newOutstanding = this.inputVal1 - this.inputVal2;
      this.selectedStudent.due = newOutstanding < 0 ? 0 : newOutstanding;
    }
    this.showEditModal = false;
  }

  openAddPayment() {
    this.isEditingTxn = false;
    this.editingTxnId = null;
    this.newTxn = { date: new Date().toISOString().split('T')[0], description: '', method: 'Cash', amount: null, receiptFile: null, fileUrl: null };
    this.showAddPaymentModal = true;
  }

  submitNewPayment() {
    if (!this.newTxn.amount) return;

    const payload = {
      ...this.newTxn,
      status: 'UNPAID',
      invoiceNumber: 'INV-' + Math.floor(Math.random() * 100000)
    };

    this.authService.addPayment(this.selectedStudent.dbId, payload).subscribe({
      next: (savedTxn) => {
        this.transactions.unshift(savedTxn);
        this.selectedStudent.due += savedTxn.amount;
        this.submitChanges();
        this.showAddPaymentModal = false;
      },
      error: () => alert('Failed to save payment.')
    });
  }

  changeStatus(txn: any, status: string) {
    if (txn.status === status) return;
    const oldStatus = txn.status;

    this.authService.updatePayment(txn.id, { status: status }).subscribe({
      next: () => {
        txn.status = status;

        if (txn.description === 'Payment Proof Uploaded' || txn.desc === 'Payment Proof Uploaded') {
          if (status === 'Completed' && oldStatus !== 'Completed') {
            this.selectedStudent.totalPaid += txn.amount;
            this.selectedStudent.due -= txn.amount;
          }
          else if (status === 'Rejected' && oldStatus === 'Completed') {
            this.selectedStudent.totalPaid -= txn.amount;
            this.selectedStudent.due += txn.amount;
          }
        }

        if (this.selectedStudent.due < 0) this.selectedStudent.due = 0;
        if (this.selectedStudent.totalPaid < 0) this.selectedStudent.totalPaid = 0;

        if (this.selectedStudent.due === 0) {
          this.transactions.forEach(t => {
            if (t.status === 'UNPAID') {
              t.status = 'Completed';
              this.authService.updatePayment(t.id, { status: 'Completed' }).subscribe();
            }
          });
        }

        this.submitChanges();
      },
      error: () => alert('Failed to update status.')
    });
  }

  deleteTransaction(txnId: number) {
    if (confirm('Are you sure you want to permanently delete this transaction?')) {
      const txnToDelete = this.transactions.find(t => t.id === txnId);

      this.authService.deletePayment(txnId).subscribe({
        next: () => {
          this.transactions = this.transactions.filter(t => t.id !== txnId);

          if (txnToDelete) {
            const isPaymentProof = (txnToDelete.desc === 'Payment Proof Uploaded' || txnToDelete.description === 'Payment Proof Uploaded');

            if (isPaymentProof) {
              if (txnToDelete.status === 'Completed') {
                this.selectedStudent.totalPaid -= txnToDelete.amount;
                this.selectedStudent.due += txnToDelete.amount;
              }
            } else {
              this.selectedStudent.due -= txnToDelete.amount;
            }

            if (this.selectedStudent.totalPaid < 0) this.selectedStudent.totalPaid = 0;
            if (this.selectedStudent.due < 0) this.selectedStudent.due = 0;
            this.submitChanges();
          }
        },
        error: () => alert('Failed to delete payment.')
      });
    }
  }

  onReceiptSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newTxn.receiptFile = file.name;
        this.newTxn.fileUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadReceipt(txn: any) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf,.jpg,.png';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev: any) => {
          const payload = { receiptFile: file.name, fileUrl: ev.target.result };
          this.authService.updatePayment(txn.id, payload).subscribe({
            next: () => {
              txn.receiptFile = file.name;
              txn.receiptUrl = ev.target.result;
              alert('Receipt securely uploaded!');
            }
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  askDownload(txn: any) {
    if (!txn.receiptUrl && !txn.fileUrl) { alert('No file uploaded for this transaction.'); return; }
    this.selectedTransaction = txn;
    this.showDownloadConfirm = true;
  }

  confirmDownload() {
    if (this.selectedTransaction) {
      const url = this.selectedTransaction.receiptUrl || this.selectedTransaction.fileUrl;
      if(url){
        const a = document.createElement('a');
        a.href = url;
        a.download = this.selectedTransaction.receiptFile || 'receipt.jpg';
        a.click();
      }
    }
    this.showDownloadConfirm = false;
  }

  submitChanges() {
    if (!this.selectedStudent) return;
    const payload = {
      totalPaid: this.selectedStudent.totalPaid,
      outstandingDue: this.selectedStudent.due
    };

    this.authService.adminUpdateStudent(this.selectedStudent.dbId, payload).subscribe({
      next: () => console.log('Balances synchronized.'),
      error: () => alert('Failed to update balances.')
    });
  }

  openEditTransaction(txn: any) {}
  updateTransaction() {}
}
