import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  id?: number;
  name: string;
  description: string;
  price: number;
  active: boolean;
  category?: string;
}

@Component({
  selector: 'app-food-ordering',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-ordering.html'
})
export class FoodOrderingComponent implements OnInit {

  viewMode: 'menu' | 'orders' = 'menu';

  breakfastMenu: MenuItem[] = [];
  lunchMenu: MenuItem[] = [];
  studentOrders: any[] = [];

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.authService.getFoodItems().subscribe({
      next: (items) => {
        this.breakfastMenu = items.filter((i: any) => i.category === 'BREAKFAST');
        this.lunchMenu = items.filter((i: any) => i.category === 'LUNCH');
      },
      error: (err: any) => console.error(err)
    });

    this.authService.getFoodOrders().subscribe({
      next: (orders: any[]) => {

        // Fetch users to cross-reference fresh names for past orders
        this.authService.getUsers().subscribe(users => {

          const unpackedUsers = users.map((u: any) => {
            let profileData: any = {};
            try { profileData = JSON.parse(u.profile_json || u.profileJson || '{}'); } catch(e){}

            let displayName = u.fullName || u.username;
            if (profileData.firstName || profileData.lastName || profileData.familyName) {
              const lName = profileData.lastName || profileData.familyName || '';
              displayName = [profileData.firstName, profileData.middleName, lName].filter(Boolean).join(' ');
            }
            return { ...u, freshName: displayName };
          });

          this.studentOrders = orders.map((o: any) => {
            // Find a match based on the old static name to replace it with the fresh name
            const match = unpackedUsers.find(u =>
              u.username === o.student_name ||
              u.fullName === o.student_name ||
              u.freshName === o.student_name
            );

            return {
              ...o,
              studentName: match ? match.freshName : o.student_name,
              orderDate: o.order_date,
              totalAmount: o.total_amount
            };
          }).reverse(); // Show newest orders at the top
        });
      },
      error: (err: any) => console.error(err)
    });
  }

  goBack() { this.location.back(); }

  addBreakfastItem() {
    this.breakfastMenu.push({ name: '', description: '', price: 0.00, active: false, category: 'BREAKFAST' });
  }

  addLunchItem() {
    this.lunchMenu.push({ name: '', description: '', price: 0.00, active: false, category: 'LUNCH' });
  }

  deleteItem(list: MenuItem[], index: number) {
    if(confirm('Are you sure you want to delete this item?')) {
      list.splice(index, 1);
    }
  }

  saveUpdates() {
    this.breakfastMenu.forEach(i => i.category = 'BREAKFAST');
    this.lunchMenu.forEach(i => i.category = 'LUNCH');
    const allItems = [...this.breakfastMenu, ...this.lunchMenu];

    const payload = allItems.map(item => ({
      name: item.name,
      description: item.description,
      price: item.price,
      active: item.active,
      category: item.category
    }));

    this.authService.saveFoodItems(payload).subscribe({
      next: (res) => {
        alert('Menu updates saved to Database!');
        this.loadData();
      },
      error: (err: any) => alert('Failed to save menu. Check console.')
    });
  }

  discardChanges() {
    if(confirm('Discard all unsaved changes?')) {
      this.loadData();
    }
  }

  markAsCompleted(order: any) {
    this.authService.completeFoodOrder(order.id).subscribe({
      next: () => {
        order.status = 'COMPLETED';
      },
      error: (err: any) => alert('Failed to complete order.')
    });
  }

  deleteOrder(order: any, index: number) {
    if (confirm(`Are you sure you want to permanently delete order #${order.id} for ${order.studentName}?`)) {
      this.authService.deleteFoodOrder(order.id).subscribe({
        next: () => {
          this.studentOrders.splice(index, 1);
          alert('Order deleted successfully.');
        },
        error: (err: any) => alert('Failed to delete order. Please check backend connection.')
      });
    }
  }
}
