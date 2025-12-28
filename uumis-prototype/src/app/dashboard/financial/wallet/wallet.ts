import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Transaction {
  id: number;
  type: 'Top Up' | 'Deduct' | 'Canteen' | 'Bookstore';
  date: string;
  time: string;
  amount: number;
  note?: string;
}

interface Student {
  id: string;
  name: string;
  class: string;
  year: string; // 新增：用于区分年级
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
  selectedStudent: any = null;

  // 列表数据
  allStudents: Student[] = [
    // --- Year 5 Students ---
    { id: '20230501', name: 'Alice Brown', class: '5-B', year: 'Year 5', balance: 0.00, transactions: [] },
    { id: '20230502', name: 'Liam Smith', class: '5-A', year: 'Year 5', balance: 0.00, transactions: [] },
    { id: '20230503', name: 'Noah Johnson', class: '5-C', year: 'Year 5', balance: 0.00, transactions: [] },

    // --- Pre-Kindergarten Students (用于测试切换) ---
    { id: 'PK-001', name: 'Baby Shark', class: 'PK-1', year: 'Pre-Kindergarten', balance: 0.00, transactions: [] },
    { id: 'PK-002', name: 'Dora Explorer', class: 'PK-2', year: 'Pre-Kindergarten', balance: 0.00, transactions: [] },

    // --- Year 1 Students ---
    { id: 'Y1-001', name: 'Charlie Puth', class: '1-A', year: 'Year 1', balance: 0.00, transactions: [] },
  ];

  // 当前显示的列表
  filteredStudents: Student[] = [];

  // 弹窗控制
  showModal: boolean = false;
  modalType: 'Top Up' | 'Deduct' = 'Top Up';
  amountInput: number | null = null;
  noteInput: string = '';

  constructor(private location: Location) {}

  ngOnInit() {
    // 初始化：加载默认年份的数据
    this.filterStudentsByYear(this.selectedYear);
  }

  goBack() {
    this.location.back();
  }

  // --- 核心修复：切换年份逻辑 ---
  selectYear(y: string) {
    this.selectedYear = y;
    this.filterStudentsByYear(y);
  }

  filterStudentsByYear(year: string) {
    // 1. 筛选出属于该年份的学生
    this.filteredStudents = this.allStudents.filter(s => s.year === year);

    // 2. 自动选中第一个学生，如果没有学生则清空详情
    if (this.filteredStudents.length > 0) {
      this.selectedStudent = this.filteredStudents[0];
    } else {
      this.selectedStudent = null;
    }
  }

  selectStudent(s: any) { this.selectedStudent = s; }

  // --- Modal Logic ---
  openModal(type: 'Top Up' | 'Deduct') {
    this.modalType = type;
    this.amountInput = null;
    this.noteInput = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  addQuickAmount(val: number) {
    if (!this.amountInput) this.amountInput = 0;
    this.amountInput += val;
  }

  confirmTransaction() {
    if (!this.amountInput || this.amountInput <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (this.modalType === 'Top Up') {
      this.selectedStudent.balance += this.amountInput;
    } else {
      this.selectedStudent.balance -= this.amountInput;
    }

    const newTxn: Transaction = {
      id: Date.now(),
      type: this.modalType,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: this.amountInput,
      note: this.noteInput || (this.modalType === 'Top Up' ? 'Admin Top Up' : 'Admin Deduction')
    };

    this.selectedStudent.transactions.unshift(newTxn);
    this.closeModal();
    alert('Transaction Successful!');
  }
}
