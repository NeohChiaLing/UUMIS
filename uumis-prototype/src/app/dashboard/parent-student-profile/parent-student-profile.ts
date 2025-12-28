import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-parent-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-student-profile.html',
  styles: []
})
export class ParentStudentProfileComponent implements OnInit {

  // Child Profile Data (Matches Student Portal Structure)
  studentProfile = {
    name: 'Leo Johnson',
    id: '2023-GR5-0012',
    grade: 'Grade 5 - Class B',
    admissionDate: '2021-09-01',
    teacher: 'Ms. Roberts',
    dob: '2013-08-20',
    gender: 'Male',
    address: '123 Maple Avenue, Springfield',
    passport: 'B98765432',
    phone: '+60 12-345 6789',
    bloodGroup: 'A+',
    allergies: 'None',
    medicalConditions: 'None',

    // Guardian Data
    father: {
      name: 'Michael Johnson',
      ic: '800101-01-5555',
      phone: '+60 12-555 1234',
      email: 'michael.j@example.com',
      job: 'Architect'
    },
    mother: {
      name: 'Sarah Johnson',
      ic: '820202-02-6666',
      phone: '+60 12-555 6789',
      email: 'sarah.j@example.com',
      job: 'Doctor'
    }
  };

  constructor(private location: Location) {}

  ngOnInit() {}

  // Smooth Scroll function
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goBack() {
    this.location.back();
  }

  saveUpdates() {
    alert('Profile updates submitted to school admin for approval.');
  }
}
