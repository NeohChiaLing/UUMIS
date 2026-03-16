import { Component, OnInit } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-refund',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './refund.html',
  styleUrls: ['./refund.css']
})
export class RefundComponent implements OnInit {

  childId: number | null = null;

  refundReq = {
    invoiceNo: '',
    date: '',
    reason: '',
    amount: null as number | null,
    bankDetails: ''
  };

  refundHistory: any[] = [];

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.childUserId) {
      this.childId = currentUser.childUserId;
      this.loadRefundHistory();
    }
  }

  loadRefundHistory() {
    if (!this.childId) return;
    this.authService.getStudentRefunds(this.childId).subscribe({
      next: (data) => this.refundHistory = data,
      error: (err) => console.error(err)
    });
  }

  goBack(): void {
    this.location.back();
  }

  submitRefundRequest(): void {
    if (!this.childId) { alert('No child linked.'); return; }
    if (!this.refundReq.invoiceNo || !this.refundReq.amount) { alert('Please fill in all details.'); return; }

    this.authService.requestRefund(this.childId, this.refundReq).subscribe({
      next: () => {
        alert('Refund requested successfully! Awaiting finance review.');
        this.refundReq = { invoiceNo: '', date: '', reason: '', amount: null, bankDetails: '' };
        this.loadRefundHistory(); // Instantly update the right-side history panel
      },
      error: () => alert('Failed to submit request.')
    });
  }
}
