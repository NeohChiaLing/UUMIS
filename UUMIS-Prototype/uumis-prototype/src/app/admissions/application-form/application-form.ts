import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [Navbar, Footer, CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './application-form.html',
  styleUrl: './application-form.css'
})
export class ApplicationFormComponent implements OnInit {
  isAdmin: boolean = false;
  showLangModal: boolean = false;

  malaysianDocs: string[] = [];
  foreignDocs: string[] = [];
  educationalHistory = [{ school: '', country: '', language: '', dates: '', grade: '' }];
  siblings = [{ name: '', age: '', gender: 'Male', currentSchool: '' }];
  customSections: any[] = [];

  // FIXED: Expanded pageData to hold the titles and descriptions for the modal
  pageData: any = {
    badge: 'Online Application',
    titleStart: 'Student',
    titleHighlight: 'Registration Form',
    description: 'All details provided will be kept confidential.',
    bgImage: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1920&q=80'
  };
  editMode: string | null = null;
  editData: any = {};

  formData: any = {
    admType: 'New Admission',
    gender: 'Male',
    intakeYear: '',
    firstName: '',
    middleName: '',
    familyName: '',
    dob: '',
    ic: '',
    primaryEmail: '',
    studentMobile: ''
  };

  constructor(private route: ActivatedRoute, private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    localStorage.removeItem('websiteEditMode');
    this.isAdmin = false;
    this.route.queryParams.subscribe(params => {
      if (params['adminMode'] === 'true') { sessionStorage.setItem('websiteEditMode', 'true'); }
      const isEditMode = sessionStorage.getItem('websiteEditMode') === 'true';
      const userStr = String(localStorage.getItem('user') || '').toLowerCase();
      const roleStr = String(localStorage.getItem('role') || '').toLowerCase();
      let fromService = false;
      try {
        const currentUser = this.authService.getCurrentUser ? this.authService.getCurrentUser() : null;
        if (currentUser && String(currentUser.role).toLowerCase().includes('admin')) { fromService = true; }
      } catch (e) {}
      const isActuallyAdmin = userStr.includes('admin') || roleStr.includes('admin') || fromService;
      this.isAdmin = isEditMode && isActuallyAdmin;
    });

    const defaultData = {
      malaysianDocs: ["One copy of student IC / Birth Certificate", "Latest passport size picture", "One copy of both parents/guardians IC", "Result transcript from previous school"],
      foreignDocs: ["Current Passport (Student & Parents)", "Latest passport size picture", "Result transcript from previous school"],
      customSections: [],
      pageData: {
        badge: 'Online Application',
        titleStart: 'Student',
        titleHighlight: 'Registration Form',
        description: 'All details provided will be kept confidential.',
        bgImage: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1920&q=80'
      }
    };

    this.http.get('/api/content/application_form', { responseType: 'text' }).subscribe({
      next: (data) => {
        const parsed = (data && data.length > 5) ? JSON.parse(data) : defaultData;
        this.malaysianDocs = parsed.malaysianDocs || defaultData.malaysianDocs;
        this.foreignDocs = parsed.foreignDocs || defaultData.foreignDocs;
        this.customSections = parsed.customSections || [];

        // Load full pageData or migrate old bgImage to the new object
        if (parsed.pageData) {
          this.pageData = parsed.pageData;
        } else if (parsed.bgImage) {
          this.pageData.bgImage = parsed.bgImage;
        }
      },
      error: () => {
        this.malaysianDocs = defaultData.malaysianDocs;
        this.foreignDocs = defaultData.foreignDocs;
      }
    });
  }

  publishChanges() {
    const payload = {
      malaysianDocs: this.malaysianDocs,
      foreignDocs: this.foreignDocs,
      customSections: this.customSections,
      pageData: this.pageData // Save all modal text changes
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('/api/content/application_form', JSON.stringify(payload), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Application Form Structure published successfully!'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

  submitForm(event: Event) {
    event.preventDefault();
    if (!this.formData.firstName || !this.formData.primaryEmail) {
      alert("Please provide at least a First Name and Primary Email to submit the application.");
      return;
    }

    const tempUsername = (this.formData.firstName.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 1000));
    const profileJsonBlob = JSON.stringify({
      dob: this.formData.dob || '',
      gender: this.formData.gender || 'Male',
      passport: this.formData.ic || '',
      address: this.formData.address || '',
      father: { name: this.formData.fatherName || '', phone: this.formData.fatherMobile || '', email: '', ic: '', job: this.formData.fatherOcc || '' },
      mother: { name: this.formData.motherName || '', phone: this.formData.motherMobile || '', email: '', ic: '', job: this.formData.motherOcc || '' },
      medicalConditions: this.formData.medical || 'None',
      allergies: 'None',
      bloodGroup: 'O+'
    });

    const builtFullName = [this.formData.firstName, this.formData.middleName, this.formData.familyName].filter(Boolean).join(' ');

    const newStudentPayload = {
      username: tempUsername,
      email: this.formData.primaryEmail,
      password: "PendingApproval123!",
      fullName: builtFullName,
      phone: this.formData.studentMobile || this.formData.homePhone || '',
      role: 'student',
      status: 'INACTIVE',
      bio: 'Unassigned',
      profileJson: profileJsonBlob
    };

    this.authService.submitApplication(newStudentPayload).subscribe({
      next: (res) => {
        alert('Application Submitted Successfully! Please check your email for the confirmation and login link.');
        window.location.reload();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to submit application. This email might already be registered.');
      }
    });
  }

  toggleLangModal() { this.showLangModal = !this.showLangModal; }
  switchLanguage(lang: string) { window.location.reload(); }
  addSchool() { this.educationalHistory.push({ school: '', country: '', language: '', dates: '', grade: '' }); }
  addSibling() { this.siblings.push({ name: '', age: '', gender: 'Male', currentSchool: '' }); }
  addSection() { this.customSections.push({ sectionTitle: 'New Section', rows: [{ columns: [{ label: 'New Question', type: 'text', options: '', value: '' }] }] }); }
  removeSection(sIndex: number) { this.customSections.splice(sIndex, 1); }
  addRow(sIndex: number) { this.customSections[sIndex].rows.push({ columns: [{ label: 'New Question', type: 'text', options: '', value: '' }] }); }
  removeRow(sIndex: number, rIndex: number) { this.customSections[sIndex].rows.splice(rIndex, 1); if (this.customSections[sIndex].rows.length === 0) { this.removeSection(sIndex); } }
  addColumn(sIndex: number, rIndex: number) { if (this.customSections[sIndex].rows[rIndex].columns.length < 3) { this.customSections[sIndex].rows[rIndex].columns.push({ label: 'New Question', type: 'text', options: '', value: '' }); } else { alert("Max 3 columns."); } }
  removeColumn(sIndex: number, rIndex: number, cIndex: number) { this.customSections[sIndex].rows[rIndex].columns.splice(cIndex, 1); if (this.customSections[sIndex].rows[rIndex].columns.length === 0) { this.removeRow(sIndex, rIndex); } }
  addDoc(type: 'my' | 'foreign') { type === 'my' ? this.malaysianDocs.push("New Requirement") : this.foreignDocs.push("New Requirement"); }
  removeDoc(type: 'my' | 'foreign', index: number) { type === 'my' ? this.malaysianDocs.splice(index, 1) : this.foreignDocs.splice(index, 1); }
  trackByIndex(index: number, obj: any): any { return index; }

  // FIX: Edit modal clones the whole pageData object so we can edit text
  openEditModal(mode: string) {
    this.editMode = mode;
    this.editData = { ...this.pageData };
  }

  closeEditModal() {
    this.editMode = null;
    this.editData = {};
  }

  saveEdits() {
    if (this.editMode === 'header') {
      this.pageData = { ...this.editData };
    }
    this.closeEditModal();
  }

  onFileSelected(event: any, fieldName: string) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.editData[fieldName] = e.target.result;
      reader.readAsDataURL(file);
    }
  }
}
