import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-financial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-financial.html'
})
export class ParentFinancialComponent implements OnInit {

  currentUser: any = null;
  childData: any = null;
  transactions: any[] = [];

  // --- ADDED: New variables perfectly matching your new HTML layout ---
  walletBalance: number = 0.00;
  bills: any[] = [];
  refunds: any[] = [];

  // Form bindings for the Parent Upload (Kept completely intact)
  selectedTxnId: number | null = null;
  uploadFileUrl: string | null = null;
  uploadFileName: string = '';

  constructor(private authService: AuthService, private location: Location) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser && this.currentUser.childUserId) {
      this.loadFinancialData(this.currentUser.childUserId);
    }
  }

  loadFinancialData(childId: number) {
    // 1. Get Outstanding Balances & Wallet Balance
    this.authService.getStudentDashboardData(childId).subscribe({
      next: (data: any) => {
        this.childData = data;
        this.walletBalance = data.walletBalance || 0.00; // Maps wallet to the UI
      }
    });

    // 2. Get Transaction History and map to 'Bills'
    this.authService.getStudentPayments(childId).subscribe({
      next: (txns: any[]) => {
        this.transactions = txns;

        // Maps the backend payment data perfectly into the 'bills' format your HTML wants
        this.bills = txns.map(t => ({
          id: t.id,
          title: t.description || t.invoiceNumber || 'School Fee',
          dueDate: t.date,
          amount: t.amount,
          status: (t.status === 'Completed' || t.status === 'Paid') ? 'Paid' : 'Unpaid',
          originalData: t
        }));
      }
    });

    // 3. Get Refunds History for the UI
    if (this.authService.getStudentRefunds) {
      this.authService.getStudentRefunds(childId).subscribe({
        next: (data: any[]) => {
          this.refunds = data.map(r => ({
            item: r.reason || 'Refund Request',
            date: r.date,
            amount: r.amount,
            status: r.status
          }));
        }
      });
    }
  }

  goBack() {
    this.location.back();
  }

  // --- ADDED: Function to handle the "Pay Now" button click ---
  payBill(bill: any) {
    alert('Redirecting to payment for: ' + bill.title);
    // You can implement actual routing or modal logic here later
  }

  // --- EXISTING FUNCTIONS KEPT INTACT ---
  get pendingTransactions() {
    return this.transactions.filter(t => t.status === 'Pending' && !t.fileUrl);
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadFileName = file.name;
        this.uploadFileUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  submitReceipt() {
    if (!this.selectedTxnId) {
      alert('Please select an invoice to pay.');
      return;
    }
    if (!this.uploadFileUrl) {
      alert('Please select a receipt file to upload.');
      return;
    }

    const payload = {
      receiptFile: this.uploadFileName,
      fileUrl: this.uploadFileUrl
    };

    this.authService.updatePayment(this.selectedTxnId, payload).subscribe({
      next: () => {
        alert('Receipt securely uploaded! Awaiting verification from Admin.');
        this.loadFinancialData(this.currentUser.childUserId);
        this.selectedTxnId = null;
        this.uploadFileName = '';
        this.uploadFileUrl = null;
      },
      error: () => alert('Failed to upload receipt.')
    });
  }

  downloadReceipt(txn: any) {
    if (txn.fileUrl) {
      const a = document.createElement('a');
      a.href = txn.fileUrl;
      a.download = txn.receiptFile || 'receipt.jpg';
      a.click();
    }
  }
}
