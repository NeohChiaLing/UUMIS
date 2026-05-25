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
    name: 'Loading...', id: '', grade: '', level: '', year: '', email: '', status: 'Pending',
    profileStatus: 'PENDING', admissionDate: '2023-01-01', teacher: 'Unassigned', completion: 0,
    dob: '', gender: 'Male', address: '', passport: '', phone: '',
    bloodGroup: 'O+', allergies: 'None', medicalConditions: 'None',
    father: { name: '', ic: '', phone: '', email: '', job: '' },
    mother: { name: '', ic: '', phone: '', email: '', job: '' },
    siblingName: '', siblingGrade: '', siblingPhone: '', siblingEmail: '',
    firstName: '', middleName: '', lastName: '', age: '', pob: '', nationality: '', religion: '', doi: '', doe: '', lang1: '', lang2: '', studentMobile: '', primaryEmail: '', altEmail: '', homePhone: '',
    avatarUrl: null
  };

  currentUser: any = null;
  canEditPicture: boolean = false;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.canEditPicture = false;

    if (this.currentUser && this.currentUser.role.toLowerCase() === 'student') {
      this.studentProfile.avatarUrl = this.currentUser.avatar || null;

      const rawProfileJson = this.currentUser.profileJson || this.currentUser.profile_json;

      let parsedData: any = {};
      if (rawProfileJson) {
        try {
          parsedData = JSON.parse(rawProfileJson);
          this.studentProfile = { ...this.studentProfile, ...parsedData };
        } catch(e) {}
      }

      let displayName = this.currentUser.fullName || this.currentUser.username || 'Student Name';
      if (parsedData.firstName || parsedData.lastName || parsedData.familyName) {
        const lName = parsedData.lastName || parsedData.familyName || '';
        displayName = [parsedData.firstName, parsedData.middleName, lName].filter(Boolean).join(' ');
      }

      this.studentProfile.name = displayName;
      this.studentProfile.id = this.currentUser.studentId || this.currentUser.student_id || '123456';
      this.studentProfile.grade = this.currentUser.bio || 'Unassigned';

      if (this.studentProfile.grade !== 'Unassigned') {
        const parts = this.studentProfile.grade.split(' - ');
        this.studentProfile.level = parts[0] || 'Unassigned';
        this.studentProfile.year = parts[1] || 'Unassigned';
      }

      this.studentProfile.phone = this.studentProfile.phone || this.currentUser.phone || '';
      this.studentProfile.status = (this.currentUser.enabled || this.currentUser.is_enabled) ? 'Active' : 'Pending';
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

  triggerFileInput() { }
  onFileSelected(event: any) {}
}
