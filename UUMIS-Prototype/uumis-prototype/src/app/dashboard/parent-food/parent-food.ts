import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-food',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-food.html',
  styles: []
})
export class ParentFoodComponent implements OnInit {

  currentUser: any = null;
  viewState: string = 'children';

  myChildren: any[] = [];
  selectedChild: any = null;

  breakfastMenu: any[] = [];
  lunchMenu: any[] = [];

  walletBalance: number = 0.00;

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

    // Pre-load the menu items
    this.authService.getFoodItems().subscribe({
      next: (items) => {
        const activeItems = items.filter(i => i.active === true).map(i => ({ ...i, selected: false }));
        this.breakfastMenu = activeItems.filter(i => i.category === 'BREAKFAST');
        this.lunchMenu = activeItems.filter(i => i.category === 'LUNCH');
      },
      error: (err) => console.error("Failed to load menu", err)
    });
  }

  getInitials(name: string): string {
    if (!name) return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  // 1. Parent selects a child
  selectChild(child: any) {
    this.selectedChild = child;
    this.viewState = 'menu';

    // Fetch the specific child's wallet balance
    this.authService.getWalletData(child.id).subscribe({
      next: (res: any) => this.walletBalance = res.balance || 0.00,
      error: (err: any) => console.error("Failed to load wallet", err)
    });
  }

  get totalAmount() {
    const breakfastTotal = this.breakfastMenu.filter(i => i.selected).reduce((acc, cur) => acc + cur.price, 0);
    const lunchTotal = this.lunchMenu.filter(i => i.selected).reduce((acc, cur) => acc + cur.price, 0);
    return breakfastTotal + lunchTotal;
  }

  submitOrder() {
    if (this.totalAmount === 0 || !this.selectedChild) return;

    if (this.walletBalance < this.totalAmount) {
      alert(`Insufficient funds! Your balance is RM ${this.walletBalance.toFixed(2)}. Please top up your E-Wallet first.`);
      return;
    }

    const selectedItems = [
      ...this.breakfastMenu.filter(i => i.selected).map(i => i.name),
      ...this.lunchMenu.filter(i => i.selected).map(i => i.name)
    ].join(', ');

    const orderPayload = {
      studentName: this.selectedChild.fullName || this.selectedChild.username,
      items: selectedItems,
      totalAmount: this.totalAmount
    };

    this.authService.submitFoodOrder(orderPayload).subscribe({
      next: (res) => {
        const walletPayload = {
          type: 'Purchase',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amount: this.totalAmount,
          note: `Canteen: ${selectedItems}`
        };

        this.authService.addWalletTransaction(this.selectedChild.id, walletPayload).subscribe({
          next: (walletRes: any) => {
            this.walletBalance = walletRes.balance;
            alert(`Order placed successfully! RM ${this.totalAmount.toFixed(2)} has been deducted from ${this.selectedChild.fullName || 'your child'}'s wallet.`);

            // Reset selections
            this.breakfastMenu.forEach(i => i.selected = false);
            this.lunchMenu.forEach(i => i.selected = false);
          },
          error: () => alert('Order placed, but wallet deduction failed. Please contact Admin.')
        });
      },
      error: () => alert('Failed to place order. Ensure backend is running.')
    });
  }

  goBack(): void {
    if (this.viewState === 'menu') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.walletBalance = 0;
      // Clear selections when going back
      this.breakfastMenu.forEach(i => i.selected = false);
      this.lunchMenu.forEach(i => i.selected = false);
    } else {
      this.location.back();
    }
  }
}
