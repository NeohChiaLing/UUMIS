import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-food',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-food.html',
  styles: []
})
export class StudentFoodComponent implements OnInit {

  breakfastMenu: any[] = [];
  lunchMenu: any[] = [];

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.authService.getFoodItems().subscribe({
      next: (items) => {
        const activeItems = items.filter(i => i.active === true);
        this.breakfastMenu = activeItems.filter(i => i.category === 'BREAKFAST');
        this.lunchMenu = activeItems.filter(i => i.category === 'LUNCH');
      },
      error: (err) => console.error("Failed to load menu", err)
    });
  }

  goBack() {
    this.location.back();
  }
}
