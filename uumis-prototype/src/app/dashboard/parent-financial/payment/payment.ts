import { Component } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css']
})
export class PaymentComponent {

  totalOutstanding = 1250.00;

  uploadData = {
    date: '',          // <--- RENAMED from 'paymentDate' to 'date' (Fixes the error)
    amount: 0,
    fileName: '',
    file: null as File | null
  };

  transactions = [
    {
      date: '2023-12-01',
      desc: 'School Fees (Term 1)',
      amount: 1250,
      status: 'Pending',
      receiptUrl: ''
    },
    {
      date: '2023-11-01',
      desc: 'Uniform Purchase',
      amount: 150,
      status: 'Completed',
      receiptUrl: 'assets/receipt.pdf'
    }
  ];

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadData.file = file;
      this.uploadData.fileName = file.name;
    }
  }

  submitPaymentProof(): void {
    console.log('Submitting proof:', this.uploadData);
  }

  downloadReceipt(txn: any): void {
    console.log('Downloading receipt for:', txn.desc);
  }
}
