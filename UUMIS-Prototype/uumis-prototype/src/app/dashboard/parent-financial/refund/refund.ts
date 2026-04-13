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

  currentUser: any = null;
  viewState: string = 'children';
  myChildren: any[] = [];
  selectedChild: any = null;

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
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser && this.currentUser.role.toLowerCase() === 'parent') {
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {
          this.myChildren = students.filter(s => s.parentId === this.currentUser.id);
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
    this.loadRefundHistory();
  }

  loadRefundHistory() {
    if (!this.childId) return;
    this.authService.getStudentRefunds(this.childId).subscribe({
      next: (data) => this.refundHistory = data,
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

  submitRefundRequest(): void {
    if (!this.childId) { alert('No child linked.'); return; }
    if (!this.refundReq.invoiceNo || !this.refundReq.amount) { alert('Please fill in all details.'); return; }

    this.authService.requestRefund(this.childId, this.refundReq).subscribe({
      next: () => {
        alert('Refund requested successfully! Awaiting finance review.');
        this.refundReq = { invoiceNo: '', date: '', reason: '', amount: null, bankDetails: '' };
        this.loadRefundHistory();
      },
      error: () => alert('Failed to submit request.')
    });
  }
}
