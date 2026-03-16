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

  // ==========================================
  // --- FIX: STORES LIST OF PARENTS FOR DROPDOWN ---
  // ==========================================
  parents: any[] = [];

  academicLevels = ['Kindergarten', 'Primary', 'Lower Secondary', 'Upper Secondary'];

  getYearsForLevel(level: string): string[] {
    if (level === 'Kindergarten') return ['Pre-Kindergarten', 'Kindergarten'];
    if (level === 'Primary') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    if (level === 'Lower Secondary') return ['Year 7', 'Year 8', 'Year 9'];
    if (level === 'Upper Secondary') return ['Year 10', 'Year 11'];
    return [];
  }

  emptyStudent = {
    name: '', id: '', grade: '', level: '', year: '', email: '', status: 'Pending',
    parentId: '', // Added parentId mapping
    admissionDate: new Date().toISOString().split('T')[0],
    teacher: '', completion: 0, avatarColor: 'bg-gray-100 text-gray-600',
    dob: '', gender: 'Male', address: '', passport: '', phone: '',
    bloodGroup: 'O+', allergies: 'None', medicalConditions: 'None',
    father: { name: '', ic: '', phone: '', job: '' },
    mother: { name: '', ic: '', phone: '', job: '' }
  };

  fullProfileTemplate = {
    level: '', year: '', parentId: '', dob: '2008-01-01', gender: 'Male', address: '123 School Road',
    passport: '', phone: '', bloodGroup: 'O+', allergies: 'None',
    medicalConditions: 'None',
    father: { name: 'Father Name', ic: '', phone: '', job: '' },
    mother: { name: 'Mother Name', ic: '', phone: '', job: '' }
  };
// ==========================================
  // --- CUSTOM SEARCHABLE DROPDOWN LOGIC ---
  // ==========================================
  isParentDropdownOpen: boolean = false;
  parentSearchQuery: string = '';

  toggleParentDropdown() {
    this.isParentDropdownOpen = !this.isParentDropdownOpen;
    if (this.isParentDropdownOpen) this.parentSearchQuery = ''; // Clear search when opening
  }

  // Auto-filters the list as you type!
  get filteredParents() {
    if (!this.parentSearchQuery) return this.parents;
    const q = this.parentSearchQuery.toLowerCase();
    return this.parents.filter(p =>
      (p.fullName || p.username || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    );
  }

  // Shows the name of the currently selected parent on the button
  get selectedParentName() {
    if (!this.selectedStudent?.parentId) return '-- Select a Parent Account to Link --';
    const p = this.parents.find(x => x.id === this.selectedStudent.parentId);
    return p ? `${p.fullName || p.username} (${p.email})` : '-- Select a Parent Account to Link --';
  }

  // Saves the selection and closes the menu
  selectParent(parentId: any) {
    this.selectedStudent.parentId = parentId;
    this.isParentDropdownOpen = false;
  }
  // ==========================================
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

    // --- FETCH PARENTS WHEN PAGE LOADS ---
    this.loadParents();
  }

// --- NEW FUNCTION TO FETCH PARENTS FROM DATABASE ---
  loadParents() {
    this.authService.getParents().subscribe({
      // FIX: Added ': any[]' so Strict Mode knows it's receiving an array of data
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

        this.students = data.map(user => ({
          dbId: user.id,
          id: user.studentId || user.verificationCode || user.username || '---',
          name: user.fullName || user.username || 'No Name',
          grade: user.bio || 'Unassigned',
          parentId: user.parentId, // Extract parent link from database
          email: user.email || 'No Email',
          status: (user.enabled === true || user.isEnabled === true) ? 'Active' : 'Pending',
          admissionDate: '2023-01-01',
          teacher: 'Unassigned',
          completion: user.avatar ? 100 : 50,
          avatarColor: 'bg-emerald-100 text-emerald-600',
          phone: user.phone || 'No Phone',
          avatarUrl: user.avatar || null
        }));
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

    // Ensure parent dropdown selects correctly if already linked
    this.selectedStudent.parentId = student.parentId || '';

    window.scrollTo(0,0);
  }

  addNewStudent() {
    this.isAddingMode = true;
    this.selectedStudent = JSON.parse(JSON.stringify(this.emptyStudent));
    window.scrollTo(0,0);
  }

  approveStudent(student: any, event: Event) {
    event.stopPropagation();
    if(confirm(`Approve ${student.name}?`)) {
      this.authService.approveStudent(student.dbId).subscribe({
        next: () => {
          alert(`Student ${student.name} has been approved.`);
          student.status = 'Active';
        },
        error: (err: any) => alert('Failed to approve student.')
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
      // --- THE FIX: Send the ID as BOTH variables so Spring Boot catches it perfectly ---
      studentId: this.selectedStudent.id,
      verificationCode: this.selectedStudent.id,

      fullName: this.selectedStudent.name,
      bio: combinedGrade,
      phone: this.selectedStudent.phone,
      enabled: false,
      parentId: this.selectedStudent.parentId
    };
    this.authService.adminUpdateStudent(this.selectedStudent.dbId, payload).subscribe({
      next: (res: any) => {
        alert('Student profile updated and Parent Linked successfully!');
        this.isLoading = false;
        this.loadStudents(); // Refresh to catch new links
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
