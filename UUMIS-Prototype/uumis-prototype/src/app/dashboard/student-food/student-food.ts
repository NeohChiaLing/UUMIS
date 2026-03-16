import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-food',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-food.html',
  styles: []
})
export class StudentFoodComponent implements OnInit {

  breakfastMenu: any[] = [];
  lunchMenu: any[] = [];
  studentName: string = 'Guest Student';

  // --- ADDED: Wallet Variables ---
  walletBalance: number = 0.00;
  childId: number | null = null;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    // Get student name securely from storage AND set childId for Wallet
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.studentName = user.fullName || user.username || 'Student';

          // Determine the correct ID to fetch wallet data (handles both Parent and Student login)
          this.childId = user.role === 'parent' ? user.childUserId : user.id;

          // --- FETCH WALLET BALANCE ---
          if (this.childId) {
            this.authService.getWalletData(this.childId).subscribe({
              next: (res: any) => this.walletBalance = res.balance || 0.00,
              error: (err: any) => console.error("Failed to load wallet", err)
            });
          }
        } catch (e) {}
      }
    }

    // Load active items from Database
    this.authService.getFoodItems().subscribe({
      next: (items) => {
        // Only get items where active === true
        const activeItems = items.filter(i => i.active === true).map(i => ({ ...i, selected: false }));

        this.breakfastMenu = activeItems.filter(i => i.category === 'BREAKFAST');
        this.lunchMenu = activeItems.filter(i => i.category === 'LUNCH');
      },
      error: (err) => console.error("Failed to load menu", err)
    });
  }

  goBack() {
    this.location.back();
  }

  get totalAmount() {
    const breakfastTotal = this.breakfastMenu.filter(i => i.selected).reduce((acc, cur) => acc + cur.price, 0);
    const lunchTotal = this.lunchMenu.filter(i => i.selected).reduce((acc, cur) => acc + cur.price, 0);
    return breakfastTotal + lunchTotal;
  }

  // Submit directly to DB so Admin sees it in orders tab AND deduct Wallet
  submitOrder() {
    if (this.totalAmount === 0) return;
    if (!this.childId) { alert("Error: User account not properly linked."); return; }

    // --- NEW: WALLET CHECK ---
    if (this.walletBalance < this.totalAmount) {
      alert(`Insufficient funds! Your balance is RM ${this.walletBalance.toFixed(2)}. Please top up your E-Wallet first.`);
      return;
    }

    const selectedItems = [
      ...this.breakfastMenu.filter(i => i.selected).map(i => i.name),
      ...this.lunchMenu.filter(i => i.selected).map(i => i.name)
    ].join(', ');

    const orderPayload = {
      studentName: this.studentName,
      items: selectedItems,
      totalAmount: this.totalAmount
    };

    // 1. Submit the Food Order
    this.authService.submitFoodOrder(orderPayload).subscribe({
      next: (res) => {

        // 2. If Food Order succeeds, DEDUCT from Wallet
        const walletPayload = {
          type: 'Purchase',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amount: this.totalAmount,
          note: `Canteen: ${selectedItems}`
        };

        this.authService.addWalletTransaction(this.childId!, walletPayload).subscribe({
          next: (walletRes: any) => {
            // Update UI with new lower balance
            this.walletBalance = walletRes.balance;
            alert(`Order placed successfully! RM ${this.totalAmount.toFixed(2)} has been deducted from your wallet.`);

            // Reset selections
            this.breakfastMenu.forEach(i => i.selected = false);
            this.lunchMenu.forEach(i => i.selected = false);
          },
          error: (err: any) => alert('Order placed, but wallet deduction failed. Please contact Admin.')
        });
      },
      error: (err) => alert('Failed to place order. Ensure backend is running.')
    });
  }
}
