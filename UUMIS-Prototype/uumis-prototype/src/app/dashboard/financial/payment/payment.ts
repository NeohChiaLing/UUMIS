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
          const parts = grade.split(' - ');
          const yearStr = parts.length > 1 ? parts[1].trim() : 'Unassigned';

          // THE FIX: Safely parse JSON to get correct First/Last name for display
          let profileData: any = {};
          const rawProfileJson = user.profile_json || user.profileJson;

          if (rawProfileJson) {
            try { profileData = JSON.parse(rawProfileJson); } catch (e) {}
          }

          let displayName = user.fullName || user.username || 'No Name';
          if (profileData.firstName || profileData.lastName || profileData.familyName) {
            const lName = profileData.lastName || profileData.familyName || '';
            displayName = [profileData.firstName, profileData.middleName, lName].filter(Boolean).join(' ');
          }

          return {
            dbId: user.id,
            id: user.student_id || user.studentId || user.verificationCode || user.username || '---',
            name: displayName,
            class: yearStr,
            year: yearStr,
            totalPaid: Number(user.totalPaid || user.total_paid) || 0.0,
            due: Number(user.outstandingDue || user.outstanding_due) || 0.0
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

  formatTxn(t: any) {
    return {
      id: t.id,
      date: t.date,
      description: t.description || t.desc || '',
      method: t.method,
      amount: Number(t.amount) || 0,
      status: t.status,
      receiptFile: t.receiptFileName || t.receipt_file_name || null,
      fileUrl: t.receiptFileUrl || t.receipt_file_url || null,
      invoiceNumber: 'INV-' + t.id
    };
  }

  isPaymentProof(txn: any): boolean {
    const desc = String(txn.description || txn.desc || '').toLowerCase();
    return desc.includes('payment proof') || desc.includes('paid');
  }

  recalculateBalances() {
    let totalCharges = 0;
    let totalPayments = 0;

    this.transactions.forEach(txn => {
      if (this.isPaymentProof(txn)) {
        if (txn.status === 'Completed' || txn.status === 'Approved') {
          totalPayments += Number(txn.amount);
        }
      } else {
        if (txn.status !== 'Rejected' && txn.status !== 'Pending') {
          totalCharges += Number(txn.amount);
        }
      }
    });

    this.selectedStudent.totalPaid = totalPayments;
    const calculatedDue = totalCharges - totalPayments;
    this.selectedStudent.due = calculatedDue < 0 ? 0 : calculatedDue;

    let pool = totalPayments;

    const charges = this.transactions
      .filter(t => !this.isPaymentProof(t) && t.status !== 'Rejected')
      .sort((a, b) => a.id - b.id);

    charges.forEach(charge => {
      const amt = Number(charge.amount);
      let newStatus = 'UNPAID';

      if (pool >= amt) {
        newStatus = 'Completed';
        pool -= amt;
      } else if (pool > 0) {
        newStatus = 'PARTIAL';
        pool = 0;
      }

      if (charge.status !== newStatus) {
        charge.status = newStatus;
        this.authService.updatePayment(charge.id, { status: newStatus }).subscribe();
      }
    });

    this.transactions.sort((a, b) => b.id - a.id);
    this.submitChanges();
  }

  selectStudent(student: any) {
    this.selectedStudent = student;
    this.authService.getStudentPayments(student.dbId).subscribe({
      next: (data: any[]) => {
        this.transactions = data.map(t => this.formatTxn(t));
        this.recalculateBalances();
      },
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
      this.selectedStudent.totalPaid = Number(this.inputVal1);
    } else {
      const newOutstanding = Number(this.inputVal1) - Number(this.inputVal2);
      this.selectedStudent.due = newOutstanding < 0 ? 0 : newOutstanding;
    }
    this.submitChanges();
    this.showEditModal = false;
    alert('Manual override applied. Note: Adding/approving future transactions will automatically recalculate and override this manual balance.');
  }

  openAddPayment() {
    this.isEditingTxn = false;
    this.editingTxnId = null;
    this.newTxn = { date: new Date().toISOString().split('T')[0], description: '', method: 'Cash', amount: null, receiptFile: null, fileUrl: null };
    this.showAddPaymentModal = true;
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

  submitNewPayment() {
    if (!this.newTxn.amount) return;

    const payload = {
      studentName: this.selectedStudent.name,
      date: this.newTxn.date,
      description: this.newTxn.description,
      method: this.newTxn.method,
      amount: Number(this.newTxn.amount),
      receiptFileName: this.newTxn.receiptFile,
      receiptFileUrl: this.newTxn.fileUrl,
      status: 'UNPAID'
    };

    this.authService.addPayment(this.selectedStudent.dbId, payload).subscribe({
      next: (res: any) => {
        const newLocalTxn = this.formatTxn({ ...payload, id: res.id });
        this.transactions.unshift(newLocalTxn);
        this.recalculateBalances();
        this.showAddPaymentModal = false;
      },
      error: () => alert('Failed to save payment.')
    });
  }

  changeStatus(txn: any, status: string) {
    if (txn.status === status) return;

    this.authService.updatePayment(txn.id, { status: status }).subscribe({
      next: () => {
        txn.status = status;
        this.recalculateBalances();
      },
      error: () => alert('Failed to update status.')
    });
  }

  deleteTransaction(txnId: number) {
    if (confirm('Are you sure you want to permanently delete this transaction?')) {
      this.authService.deletePayment(txnId).subscribe({
        next: () => {
          this.transactions = this.transactions.filter(t => t.id !== txnId);
          this.recalculateBalances();
        },
        error: () => alert('Failed to delete payment.')
      });
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
          const payload = { receiptFileName: file.name, receiptFileUrl: ev.target.result };
          this.authService.updatePayment(txn.id, payload).subscribe({
            next: () => {
              txn.receiptFile = file.name;
              txn.fileUrl = ev.target.result;
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
    if (!txn.fileUrl && !txn.receiptUrl && !txn.receiptFile) { alert('No file uploaded for this transaction.'); return; }
    this.selectedTransaction = txn;
    this.showDownloadConfirm = true;
  }

  confirmDownload() {
    if (this.selectedTransaction) {
      const url = this.selectedTransaction.fileUrl || this.selectedTransaction.receiptUrl;
      if(url){
        const a = document.createElement('a');
        a.href = url;
        a.download = this.selectedTransaction.receiptFile || 'receipt.pdf';
        a.click();
      }
    }
    this.showDownloadConfirm = false;
  }

  submitChanges() {
    if (!this.selectedStudent) return;
    const payload = {
      totalPaid: Number(this.selectedStudent.totalPaid),
      outstandingDue: Number(this.selectedStudent.due)
    };

    this.authService.adminUpdateStudent(this.selectedStudent.dbId, payload).subscribe({
      next: () => console.log('Balances synchronized with server.'),
      error: () => alert('Failed to synchronize balances.')
    });
  }
}
