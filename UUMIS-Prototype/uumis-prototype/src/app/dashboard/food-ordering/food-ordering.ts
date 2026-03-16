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
  // Custom styles removed: Using pure Tailwind for brighter green toggle
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
      error: (err) => console.error(err)
    });

    // Load Orders
    this.authService.getFoodOrders().subscribe({
      next: (orders) => this.studentOrders = orders,
      error: (err) => console.error(err)
    });
  }

  goBack() { this.location.back(); }

  // --- MENU MANAGEMENT ---

  // FIX 2: Default active is now FALSE (Grey)
  addBreakfastItem() {
    this.breakfastMenu.push({ name: '', description: '', price: 0.00, active: false, category: 'BREAKFAST' });
  }

  // FIX 2: Default active is now FALSE (Grey)
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

    // FIX 1: Strip 'id' so backend treats them as new entries and doesn't crash
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
        this.loadData(); // Reload to get fresh IDs
      },
      error: (err) => alert('Failed to save menu. Check console.')
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
      error: (err) => alert('Failed to complete order.')
    });
  }
}
