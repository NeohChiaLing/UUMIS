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
  activeTab: 'menu' | 'history' = 'menu';

  myChildren: any[] = [];
  selectedChild: any = null;

  breakfastMenu: any[] = [];
  lunchMenu: any[] = [];
  myOrderHistory: any[] = [];

  walletBalance: number = 0.00;

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
                fullName: displayName,
                name: displayName
              };
            });
        }
      });
    }

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

  selectChild(child: any) {
    this.selectedChild = child;
    this.viewState = 'menu';
    this.activeTab = 'menu';

    this.authService.getWalletData(child.id).subscribe({
      next: (res: any) => this.walletBalance = res.balance || 0.00,
      error: (err: any) => console.error("Failed to load wallet", err)
    });
  }

  switchViewMode(tab: 'menu' | 'history') {
    this.activeTab = tab;
    if (tab === 'history') {
      this.loadOrderHistory();
    }
  }

  loadOrderHistory() {
    this.authService.getFoodOrders().subscribe({
      next: (orders: any[]) => {
        this.myOrderHistory = orders.filter((o: any) =>
          o.student_name === this.selectedChild.fullName ||
          o.student_name === this.selectedChild.username ||
          o.studentName === this.selectedChild.fullName ||
          o.studentName === this.selectedChild.username
        ).map(o => ({
          ...o,
          totalAmount: o.total_amount || o.totalAmount,
          orderDate: o.order_date || o.orderDate,
        })).reverse();
      }
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
          type: 'Food Order',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amount: this.totalAmount,
          note: `Canteen: ${selectedItems}`
        };

        this.authService.addWalletTransaction(this.selectedChild.id, walletPayload).subscribe({
          next: (walletRes: any) => {
            this.walletBalance = walletRes.balance;
            alert(`Order placed successfully! RM ${this.totalAmount.toFixed(2)} has been deducted from ${this.selectedChild.fullName || 'your child'}'s wallet.`);

            this.breakfastMenu.forEach(i => i.selected = false);
            this.lunchMenu.forEach(i => i.selected = false);

            this.switchViewMode('history');
          },
          error: () => alert('Order placed, but wallet deduction failed. Please contact Admin.')
        });
      },
      error: () => alert('Failed to place order. Ensure backend is running.')
    });
  }

  cancelOrder(order: any) {
    if(confirm(`Cancel this order and instantly refund RM ${order.totalAmount.toFixed(2)} to the E-Wallet?`)) {
      this.authService.deleteFoodOrder(order.id).subscribe({
        next: () => {
          const refundPayload = {
            type: 'Top Up',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amount: order.totalAmount,
            note: `Refund: Cancelled Order #${order.id}`
          };

          this.authService.addWalletTransaction(this.selectedChild.id, refundPayload).subscribe({
            next: (walletRes: any) => {
              this.walletBalance = walletRes.balance;
              this.loadOrderHistory();
              alert(`Order cancelled! RM ${order.totalAmount.toFixed(2)} has been securely refunded.`);
            }
          });
        },
        error: () => alert('Failed to cancel order.')
      });
    }
  }

  goBack(): void {
    if (this.viewState === 'menu') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.walletBalance = 0;
      this.breakfastMenu.forEach(i => i.selected = false);
      this.lunchMenu.forEach(i => i.selected = false);
    } else {
      this.location.back();
    }
  }
}
