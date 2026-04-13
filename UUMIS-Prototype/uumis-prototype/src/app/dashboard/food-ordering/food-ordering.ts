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
    // Load Menu
    this.authService.getFoodItems().subscribe({
      next: (items) => {
        this.breakfastMenu = items.filter(i => i.category === 'BREAKFAST');
        this.lunchMenu = items.filter(i => i.category === 'LUNCH');
      },
      error: (err: any) => console.error(err) // Fix: added : any
    });

    // Load Orders
    this.authService.getFoodOrders().subscribe({
      next: (orders) => this.studentOrders = orders,
      error: (err: any) => console.error(err) // Fix: added : any
    });
  }

  goBack() { this.location.back(); }

  // --- MENU MANAGEMENT ---
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
      error: (err: any) => alert('Failed to save menu. Check console.') // Fix: added : any
    });
  }

  discardChanges() {
    if(confirm('Discard all unsaved changes?')) {
      this.loadData();
    }
  }

  // --- ORDER MANAGEMENT ---
  markAsCompleted(order: any) {
    this.authService.completeFoodOrder(order.id).subscribe({
      next: () => {
        order.status = 'COMPLETED';
      },
      error: (err: any) => alert('Failed to complete order.') // Fix: added : any
    });
  }

  // --- NEW: DELETE ORDER FUNCTION ---
  deleteOrder(order: any, index: number) {
    if (confirm(`Are you sure you want to permanently delete order #${order.id} for ${order.studentName}?`)) {
      this.authService.deleteFoodOrder(order.id).subscribe({
        next: () => {
          this.studentOrders.splice(index, 1);
          alert('Order deleted successfully.');
        },
        // THE FIX: Added `: any` to the err parameter to fix TS7006
        error: (err: any) => alert('Failed to delete order. Please check backend connection.')
      });
    }
  }
}
