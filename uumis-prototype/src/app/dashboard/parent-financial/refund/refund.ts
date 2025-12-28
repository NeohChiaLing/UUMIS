import { Component } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-refund',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './refund.html',
  styleUrls: ['./refund.css']
})
export class RefundComponent {

  // FIX: Added invoiceNo and date to match HTML inputs
  refundReq = {
    invoiceNo: '', // <--- Matches refundReq.invoiceNo
    date: '',      // <--- Matches refundReq.date
    reason: '',
    amount: 0,
    bankDetails: ''
  };

  // FIX: Added invoiceNo and reason to history items
  refundHistory = [
    {
      id: 1,
      invoiceNo: 'INV-001',
      date: '2023-11-20',
      amount: 200,
      reason: 'Overpayment of fees', // <--- Matches item.reason
      status: 'Approved'
    },
    {
      id: 2,
      invoiceNo: 'INV-005',
      date: '2023-10-10',
      amount: 50,
      reason: 'Book returned',
      status: 'Rejected'
    }
  ];

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }

  submitRefundRequest(): void {
    console.log('Refund requested:', this.refundReq);
  }
}
