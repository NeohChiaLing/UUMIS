import { Component } from '@angular/core';
import { Location, CommonModule } from '@angular/common';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.css']
})
export class WalletComponent {

  walletBalance: number = 2500.00;

  // FIX: Added time, type, and note to match HTML
  transactions = [
    {
      date: '2023-12-01',
      time: '10:30 AM',   // <--- Matches txn.time
      type: 'Top Up',     // <--- Matches txn.type === 'Top Up'
      note: 'FPX Transfer',
      amount: 500,
      status: 'Paid'
    },
    {
      date: '2023-12-05',
      time: '12:15 PM',
      type: 'Purchase',   // <--- Matches txn.type === 'Purchase'
      note: 'Canteen - Nasi Lemak',
      amount: 15,
      status: 'Completed'
    },
    {
      date: '2023-12-06',
      time: '02:00 PM',
      type: 'Deduct',     // <--- Matches txn.type === 'Deduct'
      note: 'Library Fine',
      amount: 5,
      status: 'Completed'
    }
  ];

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
