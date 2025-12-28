import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // 1. Import Location
import { FormsModule } from '@angular/forms';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  active: boolean;
}

@Component({
  selector: 'app-food-ordering',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-ordering.html',
  styles: [`
    input:checked ~ .dot { transform: translateX(100%); background-color: #30e87a; }
    input:checked ~ .bg-rail { background-color: #dcfce7; }
  `]
})
export class FoodOrderingComponent implements OnInit {

  originalBreakfast: string = '';
  originalLunch: string = '';

  breakfastMenu: MenuItem[] = [
    { id: 1, name: 'Pancakes', description: 'Fluffy stack with maple syrup', price: 3.50, active: true },
    { id: 2, name: 'Fruit Cup', description: 'Seasonal mixed fruits', price: 2.00, active: true },
    { id: 3, name: 'Oatmeal', description: 'Warm oats with brown sugar', price: 2.50, active: false }
  ];

  lunchMenu: MenuItem[] = [
    { id: 101, name: 'Pepperoni Pizza', description: 'Classic slice with cheese', price: 4.00, active: true },
    { id: 102, name: 'Chicken Caesar Salad', description: 'Fresh romaine with grilled chicken', price: 5.50, active: true },
    { id: 103, name: 'Veggie Wrap', description: 'Hummus and veggies in tortilla', price: 4.75, active: true }
  ];

  // 2. Inject Location
  constructor(private location: Location) {}

  ngOnInit() {
    this.saveOriginalState();
  }

  // 3. Add Back Function
  goBack() {
    this.location.back();
  }

  saveOriginalState() {
    this.originalBreakfast = JSON.stringify(this.breakfastMenu);
    this.originalLunch = JSON.stringify(this.lunchMenu);
  }

  addBreakfastItem() {
    this.breakfastMenu.push({ id: Date.now(), name: '', description: '', price: 0.00, active: true });
  }

  addLunchItem() {
    this.lunchMenu.push({ id: Date.now(), name: '', description: '', price: 0.00, active: true });
  }

  deleteItem(list: MenuItem[], index: number) {
    if(confirm('Are you sure you want to delete this item?')) {
      list.splice(index, 1);
    }
  }

  saveUpdates() {
    console.log('Saving Breakfast:', this.breakfastMenu);
    console.log('Saving Lunch:', this.lunchMenu);
    this.saveOriginalState();
    alert('Menu updates saved successfully!');
  }

  discardChanges() {
    if(confirm('Discard all unsaved changes?')) {
      this.breakfastMenu = JSON.parse(this.originalBreakfast);
      this.lunchMenu = JSON.parse(this.originalLunch);
    }
  }
}
