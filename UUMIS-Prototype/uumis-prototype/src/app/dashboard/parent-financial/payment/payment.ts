import { Component, OnInit } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css']
})
export class PaymentComponent implements OnInit {

  // --- REAL DATABASE VARIABLES ---
  totalOutstanding = 0.00;
  childId: number | null = null;

  uploadData = {
    date: new Date().toISOString().split('T')[0],
    amount: null as number | null,
    fileName: '',
    fileUrl: null as string | null
  };

  transactions: any[] = [];

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.childUserId) {
      this.childId = currentUser.childUserId;
      this.loadData();
    }
  }

  loadData() {
    if (!this.childId) return;

    // Fetch exact Outstanding Balance
    this.authService.getStudentDashboardData(this.childId).subscribe({
      next: (data: any) => this.totalOutstanding = data.outstandingDue || 0,
      error: (err) => console.error(err)
    });

    // Fetch exact Transaction History
    this.authService.getStudentPayments(this.childId).subscribe({
      next: (txns: any[]) => {
        this.transactions = txns.map(t => ({
          id: t.id,
          date: t.date,
          desc: t.description || t.invoiceNumber,
          amount: t.amount,
          status: t.status,
          receiptUrl: t.fileUrl,
          receiptFile: t.receiptFile
        }));
      },
      error: (err) => console.error(err)
    });
  }

  goBack(): void {
    this.location.back();
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadData.fileName = file.name;
        this.uploadData.fileUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  submitPaymentProof(): void {
    if (!this.childId) { alert('No child linked.'); return; }
    if (!this.uploadData.amount || this.uploadData.amount <= 0) { alert('Enter a valid amount.'); return; }
    if (!this.uploadData.fileUrl) { alert('Select a receipt file to upload.'); return; }

    const payload = {
      date: this.uploadData.date,
      description: 'Payment Proof Uploaded',
      invoiceNumber: 'REF-' + Math.floor(Math.random() * 100000),
      method: 'Bank Transfer',
      amount: this.uploadData.amount,
      status: 'Pending', // Puts it in 'Pending Verification'
      receiptFile: this.uploadData.fileName,
      fileUrl: this.uploadData.fileUrl
    };

    this.authService.addPayment(this.childId, payload).subscribe({
      next: () => {
        alert('Payment proof submitted successfully! Awaiting Admin approval.');
        this.uploadData = { date: new Date().toISOString().split('T')[0], amount: null, fileName: '', fileUrl: null };
        this.loadData(); // Refresh table instantly
      },
      error: () => alert('Failed to submit payment proof.')
    });
  }

  downloadReceipt(txn: any): void {
    if (txn.receiptUrl) {
      const a = document.createElement('a');
      a.href = txn.receiptUrl;
      a.download = txn.receiptFile || 'receipt.jpg';
      a.click();
    }
  }
}
