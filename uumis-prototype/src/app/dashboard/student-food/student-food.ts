import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-food',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-food.html',
  styles: []
})
export class StudentFoodComponent implements OnInit {

  breakfastMenu = [
    { id: 1, name: 'Pancakes', description: 'Fluffy stack with maple syrup', price: 3.50, selected: false },
    { id: 2, name: 'Fruit Cup', description: 'Seasonal mixed fruits', price: 2.00, selected: false },
    { id: 3, name: 'Oatmeal', description: 'Warm oats with brown sugar', price: 2.50, selected: false }
  ];

  lunchMenu = [
    { id: 4, name: 'Pepperoni Pizza', description: 'Classic slice with cheese', price: 4.00, selected: false },
    { id: 5, name: 'Chicken Caesar Salad', description: 'Fresh romaine with grilled chicken', price: 5.50, selected: false },
    { id: 6, name: 'Veggie Wrap', description: 'Hummus and veggies in tortilla', price: 4.75, selected: false }
  ];

  constructor(private location: Location) {}

  ngOnInit() {}

  goBack() {
    this.location.back();
  }

  get totalAmount() {
    const breakfastTotal = this.breakfastMenu.filter(i => i.selected).reduce((acc, cur) => acc + cur.price, 0);
    const lunchTotal = this.lunchMenu.filter(i => i.selected).reduce((acc, cur) => acc + cur.price, 0);
    return breakfastTotal + lunchTotal;
  }

  submitOrder() {
    if (this.totalAmount === 0) return;
    alert(`Order placed successfully! Total: RM ${this.totalAmount.toFixed(2)}`);
    this.breakfastMenu.forEach(i => i.selected = false);
    this.lunchMenu.forEach(i => i.selected = false);
  }
}
