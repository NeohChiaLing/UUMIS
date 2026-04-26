import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-student-profile.html',
  styles: []
})
export class ParentStudentProfileComponent implements OnInit {

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
    mother: { name: '', ic: '', phone: '', email: '', job: '' },
    // ⭐ THE FIX: Added Sibling fields to data structure
    siblingName: '',
    siblingGrade: '',
    siblingPhone: '',
    siblingEmail: '',
    avatarUrl: null
  };

  currentUser: any = null;
  activeChildId: any = null;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.activeChildId = sessionStorage.getItem('parentActiveChildId');

    if (this.currentUser && this.activeChildId) {
      this.authService.getStudentDashboardData(this.activeChildId).subscribe({
        next: (childData: any) => {
          if (childData.profileJson) {
            try {
              const savedData = JSON.parse(childData.profileJson);
              this.studentProfile = { ...this.studentProfile, ...savedData };
            } catch(e) {}
          }

          // Override with guaranteed database values
          this.studentProfile.name = childData.fullName || childData.username || 'No Name';
          this.studentProfile.id = childData.studentId || childData.verificationCode || '---';
          this.studentProfile.grade = childData.bio || 'Unassigned';
          this.studentProfile.phone = childData.phone || this.studentProfile.phone || '';
          this.studentProfile.avatarUrl = childData.avatar || null;
        },
        error: (err: any) => console.error('Failed to load child profile', err)
      });
    } else {
      this.studentProfile.name = 'No Child Selected';
    }
  }

  get completionPercentage(): number {
    let totalFields = 0;
    let filledFields = 0;

    const checkValue = (val: string) => {
      totalFields++;
      if (val && val.trim() !== '' && val.trim() !== '---' && val.trim() !== 'Unassigned') {
        filledFields++;
      }
    };

    checkValue(this.studentProfile.name);
    checkValue(this.studentProfile.id);
    checkValue(this.studentProfile.grade);
    checkValue(this.studentProfile.admissionDate);
    checkValue(this.studentProfile.teacher);
    checkValue(this.studentProfile.dob);
    checkValue(this.studentProfile.gender);
    checkValue(this.studentProfile.address);
    checkValue(this.studentProfile.passport);
    checkValue(this.studentProfile.phone);
    checkValue(this.studentProfile.bloodGroup);
    checkValue(this.studentProfile.allergies);
    checkValue(this.studentProfile.medicalConditions);

    if (this.studentProfile.father) {
      checkValue(this.studentProfile.father.name);
      checkValue(this.studentProfile.father.ic);
      checkValue(this.studentProfile.father.phone);
      checkValue(this.studentProfile.father.email);
      checkValue(this.studentProfile.father.job);
    }

    if (this.studentProfile.mother) {
      checkValue(this.studentProfile.mother.name);
      checkValue(this.studentProfile.mother.ic);
      checkValue(this.studentProfile.mother.phone);
      checkValue(this.studentProfile.mother.email);
      checkValue(this.studentProfile.mother.job);
    }

    if (totalFields === 0) return 0;
    return Math.round((filledFields / totalFields) * 100);
  }

  getInitials(name: string): string {
    if (!name || name === 'Loading...' || name === 'No Child Linked') return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goBack() {
    this.location.back();
  }

  triggerFileInput() {
    document.getElementById('parentChildAvatarInput')?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.studentProfile.avatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveUpdates() {
    if (!this.currentUser || !this.activeChildId) {
      alert("No active child selected!");
      return;
    }

    const payload = {
      profileStatus: 'PENDING',
      profileJson: JSON.stringify(this.studentProfile),
      avatar: this.studentProfile.avatarUrl
    };

    this.authService.adminUpdateStudent(this.activeChildId, payload).subscribe({
      next: () => alert('Child profile details submitted to school admin for approval.'),
      error: () => alert('Failed to submit updates.')
    });
  }
}
