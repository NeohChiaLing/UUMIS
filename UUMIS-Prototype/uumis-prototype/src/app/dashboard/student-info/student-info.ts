import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  searchQuery: string = '';
  selectedFilterYear: string = 'All';
  allYears = ['Pre-Kindergarten', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];

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
    parentId: '', profileStatus: 'PENDING', admissionDate: new Date().toISOString().split('T')[0],
    teacher: '', completion: 0, avatarColor: 'bg-gray-100 text-gray-600',
    dob: '', gender: 'Male', address: '', passport: '', phone: '',
    bloodGroup: 'O+', allergies: '', medicalConditions: '',
    father: { name: '', ic: '', phone: '', email: '', job: '' },
    mother: { name: '', ic: '', phone: '', email: '', job: '' },
    siblingName: '', siblingGrade: '', siblingPhone: '', siblingEmail: ''
  };

  fullProfileTemplate = {
    level: '', year: '', parentId: '', dob: '', gender: 'Male', address: '',
    passport: '', phone: '', bloodGroup: 'O+', allergies: '', profileStatus: 'PENDING',
    medicalConditions: '', father: { name: '', ic: '', phone: '', email: '', job: '' },
    mother: { name: '', ic: '', phone: '', email: '', job: '' },
    siblingName: '', siblingGrade: '', siblingPhone: '', siblingEmail: ''
  };

  isParentDropdownOpen: boolean = false;
  parentSearchQuery: string = '';

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

  get filteredStudents() {
    return this.students.filter(student => {
      const matchSearch = !this.searchQuery ||
        student.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(this.searchQuery.toLowerCase());

      let matchYear = true;
      if (this.selectedFilterYear !== 'All') {
        const studentYearPart = (student.grade || '').split(' - ')[1] || '';
        matchYear = studentYearPart.trim().toLowerCase() === this.selectedFilterYear.toLowerCase();
      }

      return matchSearch && matchYear;
    });
  }

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
    let totalFields = 0; let filledFields = 0;
    const checkValue = (val: string) => {
      totalFields++;
      if (val && val.trim() !== '' && val.trim() !== '---' && val.trim() !== 'Unassigned') filledFields++;
    };

    checkValue(this.selectedStudent.name); checkValue(this.selectedStudent.id);
    checkValue(this.selectedStudent.level); checkValue(this.selectedStudent.year);
    checkValue(this.selectedStudent.dob); checkValue(this.selectedStudent.gender);
    checkValue(this.selectedStudent.address); checkValue(this.selectedStudent.passport);
    checkValue(this.selectedStudent.phone); checkValue(this.selectedStudent.bloodGroup);
    checkValue(this.selectedStudent.allergies); checkValue(this.selectedStudent.medicalConditions);

    if (this.selectedStudent.father) {
      checkValue(this.selectedStudent.father.name); checkValue(this.selectedStudent.father.ic);
      checkValue(this.selectedStudent.father.phone); checkValue(this.selectedStudent.father.email);
      checkValue(this.selectedStudent.father.job);
    }
    if (this.selectedStudent.mother) {
      checkValue(this.selectedStudent.mother.name); checkValue(this.selectedStudent.mother.ic);
      checkValue(this.selectedStudent.mother.phone); checkValue(this.selectedStudent.mother.email);
      checkValue(this.selectedStudent.mother.job);
    }

    if (totalFields === 0) return 0;
    return Math.round((filledFields / totalFields) * 100);
  }

  selectParent(parentId: any) {
    this.selectedStudent.parentId = parentId;
    this.isParentDropdownOpen = false;
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
            // THE FIX: Safely check for student_id (snake_case from database) BEFORE falling back to username!
            id: user.student_id || user.studentId || user.verificationCode || user.username || '---',
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

  approveProfile(student: any, event: Event) {
    event.stopPropagation();

    const isFirstTimeApproval = student.status === 'Pending';
    const confirmMsg = isFirstTimeApproval
      ? `Approve ${student.name}'s new admission, generate their Student ID, and send welcome emails?`
      : `Approve ${student.name}'s recent profile updates? (No email will be sent)`;

    if(confirm(confirmMsg)) {
      student.profileStatus = 'APPROVED';
      student.status = 'Active';

      if (isFirstTimeApproval) {
        this.authService.approveStudent(student.dbId).subscribe({
          next: (approveRes: any) => {
            this.authService.adminUpdateStudent(student.dbId, { profileStatus: 'APPROVED', enabled: true }).subscribe();

            const emailPayload = {
              studentName: student.name,
              studentEmail: student.email,
              fatherEmail: student.father?.email || '',
              motherEmail: student.mother?.email || ''
            };
            this.authService.sendApprovalEmail(emailPayload).subscribe();

            alert(`Student ${student.name} has been officially enrolled, ID generated, and welcome emails dispatched!`);
            this.loadStudents();
          },
          error: () => alert('Failed to approve student admission.')
        });

      } else {
        this.authService.adminUpdateStudent(student.dbId, {
          profileStatus: 'APPROVED',
          enabled: true
        }).subscribe({
          next: () => alert(`Student ${student.name}'s profile updates have been approved successfully!`),
          error: () => alert('Failed to approve profile update.')
        });
      }
    }
  }

  rejectProfile(student: any, event: Event) {
    event.stopPropagation();
    if (student.profileStatus === 'REJECTED') return;

    if(confirm(`Reject ${student.name}'s profile?`)) {
      student.profileStatus = 'REJECTED';
      student.status = 'Pending';

      this.authService.adminUpdateStudent(student.dbId, {
        profileStatus: 'REJECTED',
        enabled: false
      }).subscribe({
        next: () => {
          alert(`Student ${student.name} rejected.`);
        },
        error: () => alert('Failed to reject student.')
      });
    }
  }

  deleteStudent(student: any, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to completely DELETE ${student.name} from the system? This action cannot be undone.`)) {
      this.authService.deleteUser(student.dbId).subscribe({
        next: () => {
          alert(`${student.name} has been deleted.`);
          this.loadStudents();
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete student. Check backend connection.');
        }
      });
    }
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  goBack() {
    if (this.selectedStudent) {
      this.selectedStudent = null;
      this.isAddingMode = false;
    } else {
      this.location.back();
    }
  }

  triggerFileInput() {
    document.getElementById('adminStudentAvatarInput')?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedStudent.avatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
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

    const cleanProfile = {
      dob: this.selectedStudent.dob || '',
      gender: this.selectedStudent.gender || 'Male',
      address: this.selectedStudent.address || '',
      passport: this.selectedStudent.passport || '',
      bloodGroup: this.selectedStudent.bloodGroup || 'O+',
      allergies: this.selectedStudent.allergies || 'None',
      medicalConditions: this.selectedStudent.medicalConditions || 'None',
      father: this.selectedStudent.father || { name: '', ic: '', phone: '', email: '', job: '' },
      mother: this.selectedStudent.mother || { name: '', ic: '', phone: '', email: '', job: '' },
      siblingName: this.selectedStudent.siblingName || '',
      siblingGrade: this.selectedStudent.siblingGrade || '',
      siblingPhone: this.selectedStudent.siblingPhone || '',
      siblingEmail: this.selectedStudent.siblingEmail || ''
    };

    const payload = {
      studentId: this.selectedStudent.id,
      verificationCode: this.selectedStudent.id,
      fullName: this.selectedStudent.name,
      bio: combinedGrade,
      phone: this.selectedStudent.phone,
      enabled: this.selectedStudent.status === 'Active',
      parentId: this.selectedStudent.parentId,
      profileJson: JSON.stringify(cleanProfile),
      avatar: this.selectedStudent.avatarUrl
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

  isGeneratingPDF: boolean = false;

  downloadProfilePDF() {
    this.isGeneratingPDF = true;
    const element = document.getElementById('formal-pdf-template');
    if (element) {
      html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        let imgWidth = pdfWidth;
        let imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (imgHeight > pdfHeight) {
          const scaleRatio = pdfHeight / imgHeight;
          imgWidth = imgWidth * scaleRatio;
          imgHeight = imgHeight * scaleRatio;
        }

        const xPosition = (pdfWidth - imgWidth) / 2;

        pdf.addImage(imgData, 'PNG', xPosition, 0, imgWidth, imgHeight);
        const fileName = (this.selectedStudent?.name || 'Student').replace(/\s+/g, '_') + '_Official_Record.pdf';
        pdf.save(fileName);
        this.isGeneratingPDF = false;
      }).catch(err => {
        console.error('PDF Generation Error:', err);
        alert('Failed to generate PDF. Please try again.');
        this.isGeneratingPDF = false;
      });
    } else {
      this.isGeneratingPDF = false;
    }
  }
}
