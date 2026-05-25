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

  isFatherDropdownOpen: boolean = false;
  fatherSearchQuery: string = '';
  isMotherDropdownOpen: boolean = false;
  motherSearchQuery: string = '';

  getYearsForLevel(level: string): string[] {
    if (level === 'Kindergarten') return ['Pre-Kindergarten', 'Kindergarten'];
    if (level === 'Primary') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    if (level === 'Lower Secondary') return ['Year 7', 'Year 8', 'Year 9'];
    if (level === 'Upper Secondary') return ['Year 10', 'Year 11'];
    return [];
  }

  emptyStudent = {
    name: '', id: '', grade: '', level: '', year: '', email: '', status: 'Pending',
    profileStatus: 'PENDING', admissionDate: new Date().toISOString().split('T')[0],
    teacher: '', completion: 0, avatarColor: 'bg-gray-100 text-gray-600',
    dob: '', gender: 'Male', address: '', passport: '', phone: '',
    bloodGroup: 'O+', allergies: '', medicalConditions: '',
    fatherAccountId: null, motherAccountId: null,
    father: { name: '', ic: '', phone: '', email: '', job: '' },
    mother: { name: '', ic: '', phone: '', email: '', job: '' },
    siblingName: '', siblingGrade: '', siblingPhone: '', siblingEmail: '',
    firstName: '', middleName: '', lastName: '', age: '', pob: '', nationality: '', religion: '', doi: '', doe: '', lang1: '', lang2: '', studentMobile: '', primaryEmail: '', altEmail: '', homePhone: ''
  };


  fullProfileTemplate = { ...this.emptyStudent };

  constructor(private authService: AuthService, private router: Router, private location: Location) {}

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

  toggleFatherDropdown() {
    this.isFatherDropdownOpen = !this.isFatherDropdownOpen;
    if (this.isFatherDropdownOpen) this.fatherSearchQuery = '';
  }

  get filteredFathers() {
    if (!this.fatherSearchQuery) return this.parents;
    const q = this.fatherSearchQuery.toLowerCase();
    return this.parents.filter(p => (p.fullName || p.username || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q));
  }

  get selectedFatherName() {
    if (!this.selectedStudent?.fatherAccountId) return '-- Select Father Account --';
    const p = this.parents.find(x => x.id === this.selectedStudent.fatherAccountId);
    return p ? `${p.fullName || p.username} (${p.email})` : '-- Select Father Account --';
  }

  selectFather(id: any) {
    this.selectedStudent.fatherAccountId = id;
    this.isFatherDropdownOpen = false;
  }

  toggleMotherDropdown() {
    this.isMotherDropdownOpen = !this.isMotherDropdownOpen;
    if (this.isMotherDropdownOpen) this.motherSearchQuery = '';
  }

  get filteredMothers() {
    if (!this.motherSearchQuery) return this.parents;
    const q = this.motherSearchQuery.toLowerCase();
    return this.parents.filter(p => (p.fullName || p.username || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q));
  }

  get selectedMotherName() {
    if (!this.selectedStudent?.motherAccountId) return '-- Select Mother Account --';
    const p = this.parents.find(x => x.id === this.selectedStudent.motherAccountId);
    return p ? `${p.fullName || p.username} (${p.email})` : '-- Select Mother Account --';
  }

  selectMother(id: any) {
    this.selectedStudent.motherAccountId = id;
    this.isMotherDropdownOpen = false;
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

    if (totalFields === 0) return 0;
    return Math.round((filledFields / totalFields) * 100);
  }

  loadParents() {
    this.authService.getParents().subscribe({
      next: (data: any[]) => {
        this.parents = data.map(parent => {
          let profileData: any = {};
          const rawProfileJson = parent.profile_json || parent.profileJson;
          if (rawProfileJson) {
            try {
              profileData = typeof rawProfileJson === 'string' ? JSON.parse(rawProfileJson) : rawProfileJson;
            } catch(e){}
          }

          let displayName = parent.fullName || parent.full_name || parent.username || 'No Name';
          if (profileData.firstName || profileData.lastName || profileData.familyName) {
            const fName = profileData.firstName || '';
            const mName = profileData.middleName || '';
            const lName = profileData.lastName || profileData.familyName || '';
            displayName = [fName, mName, lName].filter(Boolean).join(' ');
          }

          return {
            ...parent,
            fullName: displayName
          };
        });
      },
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
          let profileData: any = {};
          const rawProfileJson = user.profile_json || user.profileJson;

          if (rawProfileJson) {
            try { profileData = JSON.parse(rawProfileJson); } catch (e) {}
          }

          let displayName = user.fullName || user.username || 'No Name';
          if (profileData.firstName || profileData.lastName || profileData.familyName) {
            const lName = profileData.lastName || profileData.familyName || '';
            profileData.lastName = lName;
            displayName = [profileData.firstName, profileData.middleName, lName].filter(Boolean).join(' ');
          }

          return {
            ...this.fullProfileTemplate,
            ...profileData,
            dbId: user.id,
            id: user.student_id || user.studentId || user.verificationCode || user.username || '---',
            name: displayName,
            grade: user.bio || 'Unassigned',
            fatherAccountId: profileData.fatherAccountId || '',
            motherAccountId: profileData.motherAccountId || '',
            profileStatus: user.profileStatus || user.profile_status || 'PENDING',
            email: user.email || '',
            status: (user.enabled === true || user.isEnabled === true || user.is_enabled === true || user.is_enabled === 1) ? 'Active' : 'Pending',
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
    this.selectedStudent = {
      ...JSON.parse(JSON.stringify(this.fullProfileTemplate)),
      ...JSON.parse(JSON.stringify(student))
    };

    const parts = (student.grade || '').split(' - ');
    this.selectedStudent.level = this.academicLevels.includes(parts[0]) ? parts[0] : '';
    this.selectedStudent.year = parts[1] || '';
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
      ? `Approve ${student.name}'s admission? Parent accounts will remain unlinked until manually selected.`
      : `Approve ${student.name}'s profile updates?`;

    if (confirm(confirmMsg)) {
      student.profileStatus = 'APPROVED';
      student.status = 'Active';

      const approvalPayload = {
        profileStatus: 'APPROVED',
        enabled: true,
        fatherAccountId: student.fatherAccountId,
        motherAccountId: student.motherAccountId
      };

      const emailPayload = {
        studentId: student.dbId,
        studentName: student.name,
        studentEmail: student.email,
        fatherName: student.father?.name || '',
        fatherEmail: student.father?.email || '',
        motherName: student.mother?.name || '',
        motherEmail: student.mother?.email || ''
      };

      const sendApprovalEmail = () => {
        this.authService.sendApprovalEmail(emailPayload).subscribe({
          next: () => {
            alert(isFirstTimeApproval ? `Student ${student.name} enrolled successfully. Parent accounts remain unlinked until manually selected.` : `Student ${student.name}'s profile updates approved!`);
            this.loadStudents();
          }
        });
      };

      if (isFirstTimeApproval) {
        // Force unlinked status initially
        const unlinkedApprovalPayload = {
          ...approvalPayload,
          fatherAccountId: null,
          motherAccountId: null
        };

        this.authService.approveStudent(student.dbId).subscribe({
          next: () => {
            student.fatherAccountId = null;
            student.motherAccountId = null;

            this.authService.adminUpdateStudent(student.dbId, unlinkedApprovalPayload).subscribe({
              next: () => sendApprovalEmail(),
              error: () => alert('Student was approved, but parent links could not be cleared.')
            });
          },
          error: () => alert('Failed to approve student admission.')
        });

      } else {
        this.authService.adminUpdateStudent(student.dbId, approvalPayload).subscribe({
          next: () => alert(`Student ${student.name}'s profile updates approved!`),
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
        next: () => { alert(`Student ${student.name} rejected.`); },
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

  triggerFileInput() { document.getElementById('adminStudentAvatarInput')?.click(); }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.selectedStudent.avatarUrl = e.target.result; };
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

    const updatedName = [this.selectedStudent.firstName, this.selectedStudent.middleName, this.selectedStudent.lastName].filter(Boolean).join(' ');
    if (updatedName) {
      this.selectedStudent.name = updatedName;
    }

    const cleanProfile = {
      firstName: this.selectedStudent.firstName,
      middleName: this.selectedStudent.middleName,
      lastName: this.selectedStudent.lastName || '',
      dob: this.selectedStudent.dob || '',
      age: this.selectedStudent.age || '',
      gender: this.selectedStudent.gender || 'Male',
      pob: this.selectedStudent.pob || '',
      nationality: this.selectedStudent.nationality || '',
      religion: this.selectedStudent.religion || '',
      passport: this.selectedStudent.passport || '',
      doi: this.selectedStudent.doi || '',
      doe: this.selectedStudent.doe || '',
      lang1: this.selectedStudent.lang1 || '',
      lang2: this.selectedStudent.lang2 || '',
      studentMobile: this.selectedStudent.studentMobile || '',
      primaryEmail: this.selectedStudent.primaryEmail || '',
      altEmail: this.selectedStudent.altEmail || '',
      homePhone: this.selectedStudent.homePhone || '',
      address: this.selectedStudent.address || '',
      bloodGroup: this.selectedStudent.bloodGroup || 'O+',
      allergies: this.selectedStudent.allergies || 'None',
      medicalConditions: this.selectedStudent.medicalConditions || 'None',
      fatherAccountId: this.selectedStudent.fatherAccountId || null,
      motherAccountId: this.selectedStudent.motherAccountId || null,
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
      phone: this.selectedStudent.studentMobile || this.selectedStudent.homePhone || this.selectedStudent.phone,
      enabled: this.selectedStudent.status === 'Active',
      fatherAccountId: this.selectedStudent.fatherAccountId || null,
      motherAccountId: this.selectedStudent.motherAccountId || null,
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
        const errorMsg = err.error?.message || err.message || 'Failed to update student profile.';
        alert('Database Update Error:\n\n' + errorMsg);
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
