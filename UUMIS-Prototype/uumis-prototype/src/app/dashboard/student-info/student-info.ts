import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-info',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-info.html',
  styleUrl: './student-info.css'
})

export class StudentInfoComponent implements OnInit {
  userRole: string | null = '';
  selectedStudent: any = null;
  isAddingMode: boolean = false;
  isLoading: boolean = false;

  students: any[] = [];
  parents: any[] = [];

  academicLevels = ['Kindergarten', 'Primary', 'Lower Secondary', 'Upper Secondary'];

  getYearsForLevel(level: string): string[] {
    if (level === 'Kindergarten') return ['Pre-Kindergarten', 'Kindergarten'];
    if (level === 'Primary') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    if (level === 'Lower Secondary') return ['Year 7', 'Year 8', 'Year 9'];
    if (level === 'Upper Secondary') return ['Year 10', 'Year 11'];
    return [];
  }

  // FIX: Wiped dummy data completely
  emptyStudent = {
    name: '', id: '', grade: '', level: '', year: '', email: '', status: 'Pending',
    parentId: '',
    profileStatus: 'PENDING',
    admissionDate: new Date().toISOString().split('T')[0],
    teacher: '', completion: 0, avatarColor: 'bg-gray-100 text-gray-600',
    dob: '', gender: 'Male', address: '', passport: '', phone: '',
    bloodGroup: 'O+', allergies: '', medicalConditions: '',
    father: { name: '', ic: '', phone: '', email: '', job: '' },
    mother: { name: '', ic: '', phone: '', email: '', job: '' }
  };

  // FIX: Wiped dummy data completely
  fullProfileTemplate = {
    level: '', year: '', parentId: '', dob: '', gender: 'Male', address: '',
    passport: '', phone: '', bloodGroup: 'O+', allergies: '', profileStatus: 'PENDING',
    medicalConditions: '',
    father: { name: '', ic: '', phone: '', email: '', job: '' },
    mother: { name: '', ic: '', phone: '', email: '', job: '' }
  };

  isParentDropdownOpen: boolean = false;
  parentSearchQuery: string = '';

  toggleParentDropdown() {
    this.isParentDropdownOpen = !this.isParentDropdownOpen;
    if (this.isParentDropdownOpen) this.parentSearchQuery = '';
  }

  get filteredParents() {
    if (!this.parentSearchQuery) return this.parents;
    const q = this.parentSearchQuery.toLowerCase();
    return this.parents.filter(p =>
      (p.fullName || p.username || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    );
  }

  get selectedParentName() {
    if (!this.selectedStudent?.parentId) return '-- Select a Parent Account to Link --';
    const p = this.parents.find(x => x.id === this.selectedStudent.parentId);
    return p ? `${p.fullName || p.username} (${p.email})` : '-- Select a Parent Account to Link --';
  }

  get completionPercentage(): number {
    if (!this.selectedStudent) return 0;

    let totalFields = 0;
    let filledFields = 0;

    const checkValue = (val: string) => {
      totalFields++;
      if (val && val.trim() !== '' && val.trim() !== '---' && val.trim() !== 'Unassigned') {
        filledFields++;
      }
    };

    checkValue(this.selectedStudent.name);
    checkValue(this.selectedStudent.id);
    checkValue(this.selectedStudent.level);
    checkValue(this.selectedStudent.year);
    checkValue(this.selectedStudent.dob);
    checkValue(this.selectedStudent.gender);
    checkValue(this.selectedStudent.address);
    checkValue(this.selectedStudent.passport);
    checkValue(this.selectedStudent.phone);
    checkValue(this.selectedStudent.bloodGroup);
    checkValue(this.selectedStudent.allergies);
    checkValue(this.selectedStudent.medicalConditions);

    if (this.selectedStudent.father) {
      checkValue(this.selectedStudent.father.name);
      checkValue(this.selectedStudent.father.ic);
      checkValue(this.selectedStudent.father.phone);
      checkValue(this.selectedStudent.father.email);
      checkValue(this.selectedStudent.father.job);
    }

    if (this.selectedStudent.mother) {
      checkValue(this.selectedStudent.mother.name);
      checkValue(this.selectedStudent.mother.ic);
      checkValue(this.selectedStudent.mother.phone);
      checkValue(this.selectedStudent.mother.email);
      checkValue(this.selectedStudent.mother.job);
    }

    if (totalFields === 0) return 0;
    return Math.round((filledFields / totalFields) * 100);
  }

  selectParent(parentId: any) {
    this.selectedStudent.parentId = parentId;
    this.isParentDropdownOpen = false;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const user = JSON.parse(userStr);
      const role = user.role ? user.role.toLowerCase().trim() : '';

      if (role === 'financial_manager') {
        alert('Access Denied: You are not authorized for Student Registration Management.');
        this.location.back();
        return;
      }
      this.userRole = role;
    }

    this.loadStudents();
    this.loadParents();
  }

  loadParents() {
    this.authService.getParents().subscribe({
      next: (data: any[]) => this.parents = data,
      error: () => console.log('Failed to load parents')
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadStudents() {
    this.authService.getStudents().subscribe({
      next: (data: any[]) => {
        if (!data || !Array.isArray(data)) return;

        this.students = data.map(user => {
          let profileData = {};
          if (user.profileJson) {
            try { profileData = JSON.parse(user.profileJson); } catch (e) {}
          }

          return {
            ...this.fullProfileTemplate,
            ...profileData,
            dbId: user.id,
            id: user.studentId || user.verificationCode || user.username || '---',
            name: user.fullName || user.username || 'No Name',
            grade: user.bio || 'Unassigned',
            parentId: user.parentId,
            profileStatus: user.profileStatus || 'PENDING',
            email: user.email || '',
            status: (user.enabled === true || user.isEnabled === true) ? 'Active' : 'Pending',
            admissionDate: '2023-01-01',
            teacher: 'Unassigned',
            avatarColor: 'bg-emerald-100 text-emerald-600',
            phone: user.phone || '',
            avatarUrl: user.avatar || null
          };
        });
      },
      error: (err: any) => console.error('Failed to load students', err)
    });
  }

  getInitials(name: any): string {
    if (!name) return 'NA';
    return String(name).trim().slice(0, 2).toUpperCase();
  }

  viewStudent(student: any) {
    this.isAddingMode = false;
    this.selectedStudent = { ...this.fullProfileTemplate, ...student };

    const parts = (student.grade || '').split(' - ');
    this.selectedStudent.level = this.academicLevels.includes(parts[0]) ? parts[0] : '';
    this.selectedStudent.year = parts[1] || '';

    this.selectedStudent.parentId = student.parentId || '';
    window.scrollTo(0,0);
  }

  addNewStudent() {
    this.isAddingMode = true;
    this.selectedStudent = JSON.parse(JSON.stringify(this.emptyStudent));
    window.scrollTo(0,0);
  }

  // FIX: Removed the early return so it asks for confirmation anyway
  approveProfile(student: any, event: Event) {
    event.stopPropagation();

    if(confirm(`Approve ${student.name}'s profile and activate their account?`)) {
      student.profileStatus = 'APPROVED';
      student.status = 'Active';

      this.authService.adminUpdateStudent(student.dbId, {
        profileStatus: 'APPROVED',
        enabled: true
      }).subscribe({
        next: () => alert(`Student ${student.name} has been approved.`),
        error: () => alert('Failed to approve student.')
      });
    }
  }

  rejectProfile(student: any, event: Event) {
    event.stopPropagation();
    if (student.profileStatus === 'REJECTED') return;

    if(confirm(`Reject ${student.name}'s profile? This will notify them via email.`)) {
      student.profileStatus = 'REJECTED';
      student.status = 'Pending';

      this.authService.adminUpdateStudent(student.dbId, {
        profileStatus: 'REJECTED',
        enabled: false
      }).subscribe({
        next: () => {
          alert(`Student ${student.name} rejected. An email notification has been sent to ${student.email}.`);

          fetch('http://localhost:8080/api/content/contact/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: student.name,
              email: student.email,
              message: 'Your student profile update has been reviewed and requires further changes. Please log in to your portal to review.'
            })
          }).catch(e => console.log('Email API not reachable, but status was updated.'));
        },
        error: () => alert('Failed to reject student.')
      });
    }
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goBack() {
    if (this.selectedStudent) {
      this.selectedStudent = null;
      this.isAddingMode = false;
    } else {
      this.location.back();
    }
  }

  saveUpdates() {
    if (this.isAddingMode) {
      alert("Please ask student to register via the Login page.");
      return;
    }
    this.isLoading = true;

    let combinedGrade = 'Unassigned';
    if (this.selectedStudent.level && this.selectedStudent.year) {
      combinedGrade = `${this.selectedStudent.level} - ${this.selectedStudent.year}`;
    }

    const payload = {
      studentId: this.selectedStudent.id,
      verificationCode: this.selectedStudent.id,
      fullName: this.selectedStudent.name,
      bio: combinedGrade,
      phone: this.selectedStudent.phone,
      enabled: this.selectedStudent.status === 'Active',
      parentId: this.selectedStudent.parentId,
      profileJson: JSON.stringify(this.selectedStudent)
    };

    this.authService.adminUpdateStudent(this.selectedStudent.dbId, payload).subscribe({
      next: (res: any) => {
        alert('Student profile updated successfully!');
        this.isLoading = false;
        this.loadStudents();
        this.goBack();
      },
      error: (err: any) => {
        console.error(err);
        alert('Failed to update student.');
        this.isLoading = false;
      }
    });
  }
}
