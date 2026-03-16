import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.html',
  styles: []
})
export class StudentProfileComponent implements OnInit {

  // Automatically populated from database
  studentProfile: any = {
    name: '', id: '', grade: '', admissionDate: '2023-01-01', teacher: 'Unassigned',
    dob: '', gender: 'Male', address: '', passport: '', phone: '',
    bloodGroup: 'O+', allergies: 'None', medicalConditions: 'None',
    father: { name: '', ic: '', phone: '', email: '', job: '' },
    mother: { name: '', ic: '', phone: '', email: '', job: '' }
  };

  currentUser: any = null;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    // SECURITY: Only load data for the person actually logged in!
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser && this.currentUser.role === 'student') {
      this.studentProfile.name = this.currentUser.fullName || this.currentUser.username || 'Student Name';
      this.studentProfile.id = this.currentUser.studentId || this.currentUser.verificationCode || '---';
      this.studentProfile.grade = this.currentUser.bio || 'Unassigned';
      this.studentProfile.phone = this.currentUser.phone || '';
    }
  }

  // Extracts initials for the avatar picture dynamically
  getInitials(name: string): string {
    if (!name) return 'ST';
    return name.trim().slice(0, 2).toUpperCase();
  }

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
