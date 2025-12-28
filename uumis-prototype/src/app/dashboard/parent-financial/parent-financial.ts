import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-parent-financial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-financial.html',
  styles: []
})
export class ParentFinancialComponent implements OnInit {

  // Requirement IS_06_03: Display paid/unpaid bills
  bills = [
    { title: 'Term 2 Tuition Fee', amount: 3500, dueDate: '2025-11-30', status: 'Unpaid' },
    { title: 'Library Fee', amount: 100, dueDate: '2025-10-15', status: 'Paid' },
    { title: 'Sports Equipment', amount: 250, dueDate: '2025-09-01', status: 'Paid' }
  ];

  // Requirement IS_06_03: Refund History
  refunds = [
    { item: 'Field Trip Deposit', amount: 50, date: '2025-08-10', status: 'Approved' },
    { item: 'Extra Uniform', amount: 120, date: '2025-07-20', status: 'Pending' }
  ];

  walletBalance = 450.00;

  constructor(private location: Location) {}

  ngOnInit() {}

  goBack() {
    this.location.back();
  }

  payBill(bill: any) {
    alert(`Proceeding to payment for ${bill.title} (RM ${bill.amount})`);
  }
}
