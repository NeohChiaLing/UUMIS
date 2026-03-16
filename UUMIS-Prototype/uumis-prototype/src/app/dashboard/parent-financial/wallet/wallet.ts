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

  walletBalance: number = 0.00;
  transactions: any[] = [];
  childId: number | null = null;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.childUserId) {
      this.childId = currentUser.childUserId;
      this.loadWalletData();
    }
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
    this.location.back();
  }
}
