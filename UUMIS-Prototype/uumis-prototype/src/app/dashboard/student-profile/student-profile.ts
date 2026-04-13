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

  studentProfile: any = {
    name: '', id: '', grade: '', admissionDate: '2023-01-01', level: '', year: '',
    dob: '', gender: 'Male', address: '', passport: '', phone: '',
    bloodGroup: 'O+', allergies: 'None', medicalConditions: 'None',
    father: { name: '', ic: '', phone: '', email: '', job: '' },
    mother: { name: '', ic: '', phone: '', email: '', job: '' },
    avatarUrl: null
  };

  currentUser: any = null;
  canEditPicture: boolean = false;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    // Rule: Admins, Staff, Register Managers, and Parents can edit. Students CANNOT.
    const role = this.currentUser?.role ? this.currentUser.role.toLowerCase().trim() : '';
    this.canEditPicture = role !== 'student';

    if (this.currentUser && role === 'student') {
      this.studentProfile.avatarUrl = this.currentUser.avatar || null;

      if (this.currentUser.profileJson) {
        try {
          const savedData = JSON.parse(this.currentUser.profileJson);
          this.studentProfile = { ...this.studentProfile, ...savedData };
        } catch(e) {}
      }

      this.studentProfile.name = this.currentUser.fullName || this.currentUser.username || this.studentProfile.name || 'Student Name';
      this.studentProfile.id = this.currentUser.studentId || '';
      this.studentProfile.grade = this.currentUser.bio || this.studentProfile.grade || 'Unassigned';

      if (this.studentProfile.grade !== 'Unassigned') {
        const parts = this.studentProfile.grade.split(' - ');
        this.studentProfile.level = this.studentProfile.level || parts[0] || 'Unassigned';
        this.studentProfile.year = this.studentProfile.year || parts[1] || 'Unassigned';
      }

      this.studentProfile.phone = this.studentProfile.phone || this.currentUser.phone || '';
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
    checkValue(this.studentProfile.level);
    checkValue(this.studentProfile.year);
    checkValue(this.studentProfile.dob);
    checkValue(this.studentProfile.gender);
    checkValue(this.studentProfile.address);
    checkValue(this.studentProfile.passport);
    checkValue(this.studentProfile.phone);
    checkValue(this.studentProfile.bloodGroup);
    checkValue(this.studentProfile.allergies);
    checkValue(this.studentProfile.medicalConditions);

    checkValue(this.studentProfile.father.name);
    checkValue(this.studentProfile.father.ic);
    checkValue(this.studentProfile.father.phone);
    checkValue(this.studentProfile.father.email);
    checkValue(this.studentProfile.father.job);

    checkValue(this.studentProfile.mother.name);
    checkValue(this.studentProfile.mother.ic);
    checkValue(this.studentProfile.mother.phone);
    checkValue(this.studentProfile.mother.email);
    checkValue(this.studentProfile.mother.job);

    if (totalFields === 0) return 0;
    return Math.round((filledFields / totalFields) * 100);
  }

  getInitials(name: string): string {
    if (!name) return 'ST';
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
    if (this.canEditPicture) {
      document.getElementById('studentAvatarInput')?.click();
    }
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
    // --- THE FIX: Clean up the JSON ---
    const cleanProfile = {
      dob: this.studentProfile.dob || '',
      gender: this.studentProfile.gender || 'Male',
      address: this.studentProfile.address || '',
      passport: this.studentProfile.passport || '',
      bloodGroup: this.studentProfile.bloodGroup || 'O+',
      allergies: this.studentProfile.allergies || 'None',
      medicalConditions: this.studentProfile.medicalConditions || 'None',
      father: this.studentProfile.father || { name: '', ic: '', phone: '', email: '', job: '' },
      mother: this.studentProfile.mother || { name: '', ic: '', phone: '', email: '', job: '' }
    };

    const payload = {
      profileStatus: 'PENDING',
      profileJson: JSON.stringify(cleanProfile),
      avatar: this.studentProfile.avatarUrl
    };

    this.authService.adminUpdateStudent(this.currentUser.id, payload).subscribe({
      next: () => {
        alert('Profile updates submitted to school admin for approval. Please login again later to see official changes from the Admin.');
        this.goBack();
      },
      error: () => alert('Failed to submit updates.')
    });
  }
}
