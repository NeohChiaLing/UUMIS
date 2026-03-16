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

  // About Us Dropdown State
  isAboutDropdownOpen = false;

  // --- NEW: Admissions Dropdown State ---
  isAdmissionsDropdownOpen = false;

  toggleAboutDropdown() {
    this.isAboutDropdownOpen = !this.isAboutDropdownOpen;
    // Close others if open
    this.isAdmissionsDropdownOpen = false;
  }

  // --- NEW: Toggle Function for Admissions ---
  toggleAdmissionsDropdown() {
    this.isAdmissionsDropdownOpen = !this.isAdmissionsDropdownOpen;
    // Close others if open
    this.isAboutDropdownOpen = false;
  }

  // --- UPDATE: General Close Function ---
  closeDropdown() {
    // Close all dropdowns
    this.isAboutDropdownOpen = false;
    this.isAdmissionsDropdownOpen = false;
  }

  logout() {
    console.log("Logging out...");
    this.router.navigate(['/login']);
  }
}
