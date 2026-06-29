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

  currentUser: any = null;
  viewState: string = 'children';
  myChildren: any[] = [];
  selectedChild: any = null;

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
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser && this.currentUser.role.toLowerCase() === 'parent') {
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {

          // THE FIX: Deployed the Dual-Parent Smart Filter here
          this.myChildren = students
            .filter(child => {
              let pJson: any = {};
              const rawJson = child.profile_json || child.profileJson;
              if (rawJson) {
                try { pJson = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson; } catch(e){}
              }
              const isLegacyParent = String(child.parentId) === String(this.currentUser.id) || String(child.parent_id) === String(this.currentUser.id);
              const isFather = String(pJson.fatherAccountId) === String(this.currentUser.id);
              const isMother = String(pJson.motherAccountId) === String(this.currentUser.id);
              return isLegacyParent || isFather || isMother;
            })
            .map(child => {
              let profileData: any = {};
              const rawProfileJson = child.profile_json || child.profileJson;

              if (rawProfileJson) {
                try { profileData = JSON.parse(rawProfileJson); } catch (e) {}
              }

              let displayName = child.fullName || child.username || 'No Name';
              if (profileData.firstName || profileData.lastName || profileData.familyName) {
                const lName = profileData.lastName || profileData.familyName || '';
                displayName = [profileData.firstName, profileData.middleName, lName].filter(Boolean).join(' ');
              }

              return {
                ...child,
                displayName: displayName,
                fullName: displayName, // Overrides core field so HTML instantly uses the proper name
                name: displayName
              };
            });

        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  selectChild(child: any) {
    this.selectedChild = child;
    this.childId = child.id;
    this.viewState = 'details';
    this.loadData();
  }

  loadData() {
    if (!this.childId) return;

    this.authService.getStudentDashboardData(this.childId).subscribe({
      next: (data: any) => this.totalOutstanding = data.outstandingDue || 0,
      error: (err) => console.error(err)
    });

    this.authService.getStudentPayments(this.childId).subscribe({
      next: (txns: any[]) => {
        this.transactions = txns.map(t => ({
          id: t.id,
          date: t.date,
          desc: t.description || t.invoiceNumber,
          amount: t.amount,
          status: t.status,
          receiptUrl: t.fileUrl || t.receiptUrl || t.receipt_file_url || t.receiptFileUrl,
          receiptFile: t.receiptFile || t.receipt_file || t.receiptFileName || t.receipt_file_name
        }));
      },
      error: (err) => console.error(err)
    });
  }

  goBack(): void {
    if (this.viewState === 'details') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.childId = null;
    } else {
      this.location.back();
    }
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
      status: 'Pending',
      receiptFileName: this.uploadData.fileName,
      receiptFileUrl: this.uploadData.fileUrl
    };

    this.authService.addPayment(this.childId, payload).subscribe({
      next: () => {
        alert('Payment proof submitted successfully! Awaiting Admin approval.');
        this.uploadData = { date: new Date().toISOString().split('T')[0], amount: null, fileName: '', fileUrl: null };
        this.loadData();
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
