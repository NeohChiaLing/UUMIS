import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  constructor(private router: Router) {}

  isAboutDropdownOpen = false;
  isAdmissionsDropdownOpen = false;

  toggleAboutDropdown() {
    this.isAboutDropdownOpen = !this.isAboutDropdownOpen;
    this.isAdmissionsDropdownOpen = false;
  }

  toggleAdmissionsDropdown() {
    this.isAdmissionsDropdownOpen = !this.isAdmissionsDropdownOpen;
    this.isAboutDropdownOpen = false;
  }

  closeDropdown() {
    this.isAboutDropdownOpen = false;
    this.isAdmissionsDropdownOpen = false;
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
