import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

interface Transaction {
  id: number;
  type: 'Top Up' | 'Deduct' | 'Canteen' | 'Bookstore';
  date: string;
  time: string;
  amount: number;
  note?: string;
}

interface Student {
  dbId: number;
  id: string;
  name: string;
  class: string;
  year: string;
  balance: number;
  transactions: Transaction[];
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.html',
  styleUrl: './wallet.css'
})
export class WalletComponent implements OnInit {

  years = ['Pre-Kindergarten', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];

  selectedYear: string = 'Year 5';
  selectedStudent: Student | null = null;

  allStudents: Student[] = [];
  filteredStudents: Student[] = [];

  showModal: boolean = false;
  modalType: 'Top Up' | 'Deduct' = 'Top Up';
  amountInput: number | null = null;
  noteInput: string = '';

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
            year: yearStr,
            balance: user.walletBalance || 0.00,
            transactions: []
          };
        });
        this.filterStudentsByYear(this.selectedYear);
      }
    });
  }

  goBack() { this.location.back(); }

  selectYear(y: string) {
    this.selectedYear = y;
    this.filterStudentsByYear(y);
  }

  filterStudentsByYear(year: string) {
    this.filteredStudents = this.allStudents.filter(s => s.year === year);
    if (this.filteredStudents.length > 0) {
      this.selectStudent(this.filteredStudents[0]);
    } else {
      this.selectedStudent = null;
    }
  }

  // --- FETCH REAL WALLET DATA ---
  selectStudent(s: Student) {
    this.selectedStudent = s;
    this.authService.getWalletData(s.dbId).subscribe({
      next: (res: any) => {
        if(this.selectedStudent) {
          this.selectedStudent.balance = res.balance;
          this.selectedStudent.transactions = res.transactions;
        }
      }
    });
  }

  openModal(type: 'Top Up' | 'Deduct') {
    this.modalType = type;
    this.amountInput = null;
    this.noteInput = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  addQuickAmount(val: number) {
    if (!this.amountInput) this.amountInput = 0;
    this.amountInput += val;
  }

  // --- SUBMIT REAL TRANSACTION TO DATABASE ---
  confirmTransaction() {
    if (!this.amountInput || this.amountInput <= 0) { alert('Please enter a valid amount.'); return; }
    if (!this.selectedStudent) return;

    const payload = {
      type: this.modalType,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: this.amountInput,
      note: this.noteInput || (this.modalType === 'Top Up' ? 'Admin Top Up' : 'Admin Deduction')
    };

    this.authService.addWalletTransaction(this.selectedStudent.dbId, payload).subscribe({
      next: (res: any) => {
        if(this.selectedStudent) {
          this.selectedStudent.balance = res.balance;
          this.selectedStudent.transactions.unshift(res.transaction);
        }
        this.closeModal();

        // --- ALERT FOR LOW BALANCE ---
        if (res.isLowBalance) {
          alert('Transaction Successful!\n\n⚠️ SYSTEM ALERT: This student\'s balance is below RM 20. An automated email has been sent to the parent requesting a Top Up.');
        } else {
          alert('Transaction Successful!');
        }
      },
      error: () => alert('Failed to process transaction.')
    });
  }
}
