import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // Added to fetch real database data

@Component({
  selector: 'app-parent-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-student-profile.html',
  styles: []
})
export class ParentStudentProfileComponent implements OnInit {

  // Structure maintained, but dummy data emptied so it can be filled by the real database
  studentProfile: any = {
    name: 'Loading...',
    id: '',
    grade: '',
    admissionDate: '2023-01-01',
    teacher: 'Unassigned',
    dob: '',
    gender: 'Male',
    address: '',
    passport: '',
    phone: '',
    bloodGroup: 'O+',
    allergies: 'None',
    medicalConditions: 'None',
    father: { name: '', ic: '', phone: '', email: '', job: '' },
    mother: { name: '', ic: '', phone: '', email: '', job: '' }
  };

  currentUser: any = null;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    // Check if the logged-in parent has a child linked to their account
    if (this.currentUser && this.currentUser.childUserId) {

      // Fetch the REAL child's data from the database
      this.authService.getStudentDashboardData(this.currentUser.childUserId).subscribe({
        next: (childData: any) => {
          // Map the database info to your UI layout perfectly
          this.studentProfile.name = childData.fullName || childData.username || 'No Name';
          this.studentProfile.id = childData.studentId || childData.verificationCode || '---';
          this.studentProfile.grade = childData.bio || 'Unassigned';
          this.studentProfile.phone = childData.phone || '';
        },
        error: (err: any) => console.error('Failed to load child profile', err)
      });
    } else {
      this.studentProfile.name = 'No Child Linked';
    }
  }

  // Generates real initials for the Avatar image!
  getInitials(name: string): string {
    if (!name || name === 'Loading...' || name === 'No Child Linked') return 'NA';
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
