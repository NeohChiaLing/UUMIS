import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [Navbar, Footer, CommonModule, FormsModule],
  templateUrl: './application-form.html',
  styleUrl: './application-form.css'
})
export class ApplicationFormComponent {
  // 1. Define the arrays to hold your data
  educationalHistory = [{ school: '', country: '', language: '', dates: '', grade: '' }];
  siblings = [{ name: '', age: '', gender: 'Male', currentSchool: '' }];

  // 2. Function for 'Add Another School' button
  addSchool() {
    this.educationalHistory.push({ school: '', country: '', language: '', dates: '', grade: '' });
  }

  // 3. Function for 'Add Sibling' button
  addSibling() {
    this.siblings.push({ name: '', age: '', gender: 'Male', currentSchool: '' });
  }

  submitForm(event: Event) {
    event.preventDefault();
    alert('Application Submitted!');
  }

}
