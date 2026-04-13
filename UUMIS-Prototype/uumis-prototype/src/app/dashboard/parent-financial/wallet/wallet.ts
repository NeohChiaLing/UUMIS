import { Component, OnInit } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.css']
})
export class WalletComponent implements OnInit {

  currentUser: any = null;
  viewState: string = 'children';
  myChildren: any[] = [];
  selectedChild: any = null;

  walletBalance: number = 0.00;
  transactions: any[] = [];
  childId: number | null = null;

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
    this.loadWalletData();
  }

  loadWalletData() {
    if (!this.childId) return;
    this.authService.getWalletData(this.childId).subscribe({
      next: (res: any) => {
        this.walletBalance = res.balance;
        this.transactions = res.transactions;
      },
      error: (err) => console.error('Failed to load wallet data', err)
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
}
