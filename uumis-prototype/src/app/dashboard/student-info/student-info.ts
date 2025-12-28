import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-info.html',
  styleUrl: './student-info.css'
})
export class StudentInfoComponent implements OnInit {
  userRole: string | null = '';

  selectedStudent: any = null;
  isAddingMode: boolean = false;

  // Template for a blank student
  emptyStudent = {
    name: '',
    id: '',
    grade: '',
    email: '',
    status: 'Pending',
    admissionDate: new Date().toISOString().split('T')[0],
    teacher: '',
    completion: 0,
    avatarColor: 'bg-gray-100 text-gray-600', // Default color
    dob: '',
    gender: 'Male',
    address: '',
    passport: '',
    phone: '',
    bloodGroup: 'O+',
    allergies: 'None',
    medicalConditions: 'None',
    father: { name: '', ic: '', phone: '', job: '' },
    mother: { name: '', ic: '', phone: '', job: '' }
  };

  // Initial Data
  students = [
    {
      id: '2023-GR10-0042',
      name: 'Alex Morgan',
      grade: 'Grade 10 - Class A',
      email: 'alex.m@school.edu',
      status: 'Active',
      admissionDate: '2020-09-01',
      teacher: 'Mr. Johnson',
      completion: 85,
      avatarColor: 'bg-emerald-100 text-emerald-600'
    },
    {
      id: '2023-GR09-0115',
      name: 'Sarah Connor',
      grade: 'Grade 9 - Class B',
      email: 'sarah.c@school.edu',
      status: 'Pending',
      admissionDate: '2023-01-15',
      teacher: 'Mrs. Davis',
      completion: 40,
      avatarColor: 'bg-purple-100 text-purple-600'
    },
    {
      id: '2023-GR11-0022',
      name: 'Michael Chen',
      grade: 'Grade 11 - Class A',
      email: 'm.chen@school.edu',
      status: 'Active',
      admissionDate: '2019-08-20',
      teacher: 'Mr. Smith',
      completion: 92,
      avatarColor: 'bg-blue-100 text-blue-600'
    }
  ];

  // Template for full details (to merge with list data)
  fullProfileTemplate = {
    dob: '2008-01-01',
    gender: 'Male',
    address: '123 School Road',
    passport: '',
    phone: '',
    bloodGroup: 'O+',
    allergies: 'None',
    medicalConditions: 'None',
    father: { name: 'Father Name', ic: '', phone: '', job: '' },
    mother: { name: 'Mother Name', ic: '', phone: '', job: '' }
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getRole();
  }

  // --- ACTIONS ---

  viewStudent(student: any) {
    this.isAddingMode = false;
    // Merge existing data with full profile template to avoid missing fields
    this.selectedStudent = { ...this.fullProfileTemplate, ...student };
    window.scrollTo(0,0);
  }

  addNewStudent() {
    this.isAddingMode = true;
    // Copy the empty template so we don't modify the original
    this.selectedStudent = JSON.parse(JSON.stringify(this.emptyStudent));
    window.scrollTo(0,0);
  }

  approveStudent(student: any, event: Event) {
    event.stopPropagation();
    student.status = 'Active';
    alert(`Student ${student.name} has been approved successfully.`);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goBack() {
    if (this.selectedStudent) {
      // If we are in Profile/Add view, go back to List
      this.selectedStudent = null;
      this.isAddingMode = false;
    } else {
      // If we are in List view, go back to Dashboard
      this.location.back();
    }
  }

  saveUpdates() {
    if (this.isAddingMode) {
      // --- LOGIC TO ADD NEW STUDENT ---

      // 1. Assign a random avatar color
      const colors = ['bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600', 'bg-blue-100 text-blue-600', 'bg-orange-100 text-orange-600'];
      this.selectedStudent.avatarColor = colors[Math.floor(Math.random() * colors.length)];

      // 2. Add to the list
      this.students.push(this.selectedStudent);

      alert('New student created successfully!');

      // 3. Return to list view
      this.goBack();

    } else {
      alert('Profile updates submitted for approval!');
      this.goBack();
    }
  }
}
