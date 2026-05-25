import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  isSubmitting: boolean = false;

  malaysianDocs: string[] = [];
  foreignDocs: string[] = [];
  educationalHistory = [{ school: '', country: '', language: '', dates: '', grade: '' }];
  siblings = [{ name: '', age: '', gender: 'Male', currentSchool: '' }];
  customSections: any[] = [];

  pageData: any = {
    badge: 'Online Application',
    titleStart: 'Student',
    titleHighlight: 'Registration Form',
    description: 'All details provided will be kept confidential.',
    bgImage: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1920&q=80',
    fields: {}
  };

  editMode: string | null = null;
  editData: any = {};
  editFieldKey: string = '';

  formData: any = {
    admType: 'New Admission',
    gender: 'Male',
    intakeYear: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    age: '',
    pob: '',
    nationality: '',
    religion: '',
    ic: '',
    doi: '',
    doe: '',
    lang1: '',
    lang2: '',
    primaryEmail: '',
    altEmail: '',
    address: '',
    homePhone: '',
    studentMobile: '',
    medical: ''
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
      customSections: []
    };

    const defaultFields: any = {
      admType: { label: 'Application Type', width: '33' },
      intakeMonth: { label: 'Intake Month', width: '33' },
      intakeYear: { label: 'Intake Year', width: '33' },
      firstName: { label: 'First Name *', width: '33' },
      middleName: { label: 'Middle Name', width: '33' },
      lastName: { label: 'Last Name', width: '33' },
      gender: { label: 'Gender', width: '33' },
      dob: { label: 'Date of Birth', width: '33' },
      age: { label: 'Age', width: '33' },
      pob: { label: 'Place of Birth', width: '33' },
      nationality: { label: 'Nationality', width: '33' },
      religion: { label: 'Religion', width: '33' },
      ic: { label: 'IC / Passport Number', width: '33' },
      doi: { label: 'Date of Issue', width: '33' },
      doe: { label: 'Date of Expiration', width: '33' },
      lang1: { label: 'First Language', width: '33' },
      lang2: { label: 'Second Language', width: '33' },
      studentMobile: { label: 'Student Mobile Number', width: '33' },
      medical: { label: 'Medical Information (If applicable)', width: '100' },
      fatherName: { label: 'Full Name', width: '33' },
      fatherMobile: { label: 'Mobile Number', width: '33' },
      fatherOcc: { label: 'Occupation', width: '33' },
      motherName: { label: 'Full Name', width: '33' },
      motherMobile: { label: 'Mobile Number', width: '33' },
      motherOcc: { label: 'Occupation', width: '33' },
      primaryEmail: { label: 'Primary Email *', width: '50' },
      altEmail: { label: 'Alternate Email', width: '50' },
      address: { label: 'Current Home Address', width: '100' },
      homePhone: { label: 'Home Phone', width: '33' }
    };

    this.http.get('/api/content/application_form', { responseType: 'text' }).subscribe({
      next: (data) => {
        const parsed = (data && data.length > 5) ? JSON.parse(data) : defaultData;
        this.malaysianDocs = parsed.malaysianDocs || defaultData.malaysianDocs;
        this.foreignDocs = parsed.foreignDocs || defaultData.foreignDocs;
        this.customSections = parsed.customSections || [];

        if (parsed.pageData) {
          this.pageData = parsed.pageData;
        } else if (parsed.bgImage) {
          this.pageData.bgImage = parsed.bgImage;
        }

        if (!this.pageData.fields) this.pageData.fields = {};
        for (const key in defaultFields) {
          if (!this.pageData.fields[key]) {
            this.pageData.fields[key] = { ...defaultFields[key] };
          }
        }
      },
      error: () => {
        this.malaysianDocs = defaultData.malaysianDocs;
        this.foreignDocs = defaultData.foreignDocs;
        this.pageData.fields = { ...defaultFields };
      }
    });
  }

  getColSpanClass(width: string) {
    switch(width) {
      case '25': return 'md:col-span-3';
      case '33': return 'md:col-span-4';
      case '50': return 'md:col-span-6';
      case '66': return 'md:col-span-8';
      case '75': return 'md:col-span-9';
      case '100': return 'md:col-span-12';
      default: return 'md:col-span-12';
    }
  }

  publishChanges() {
    const payload = {
      malaysianDocs: this.malaysianDocs,
      foreignDocs: this.foreignDocs,
      customSections: this.customSections,
      pageData: this.pageData
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

    this.isSubmitting = true;

    setTimeout(async () => {
      const sections = document.querySelectorAll('.pdf-section');
      if (sections.length > 0) {
        try {
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          let currentY = 0;

          for (let i = 0; i < sections.length; i++) {
            const el = sections[i] as HTMLElement;
            if (el.offsetHeight === 0) continue;

            const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            if (currentY + imgHeight > pageHeight - 15 && currentY > 15) {
              pdf.addPage();
              currentY = 0;
            }

            pdf.addImage(imgData, 'PNG', 0, currentY, pdfWidth, imgHeight);
            currentY += imgHeight;
          }

          const base64PdfStr = pdf.output('datauristring');
          this.processFinalSubmission(base64PdfStr);

        } catch (err) {
          console.error("PDF Generation Error:", err);
          this.processFinalSubmission(null);
        }
      } else {
        this.processFinalSubmission(null);
      }
    }, 200);
  }

  processFinalSubmission(base64PdfStr: string | null) {
    const tempUsername = (this.formData.firstName.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 1000));

    const profileJsonBlob = JSON.stringify({
      firstName: this.formData.firstName,
      middleName: this.formData.middleName,
      lastName: this.formData.lastName,
      dob: this.formData.dob || '',
      age: this.formData.age || '',
      gender: this.formData.gender || 'Male',
      pob: this.formData.pob || '',
      nationality: this.formData.nationality || '',
      religion: this.formData.religion || '',
      passport: this.formData.ic || '',
      doi: this.formData.doi || '',
      doe: this.formData.doe || '',
      lang1: this.formData.lang1 || '',
      lang2: this.formData.lang2 || '',
      studentMobile: this.formData.studentMobile || '',
      primaryEmail: this.formData.primaryEmail || '',
      altEmail: this.formData.altEmail || '',
      homePhone: this.formData.homePhone || '',
      address: this.formData.address || '',
      medicalConditions: this.formData.medical || 'None',
      allergies: 'None',
      bloodGroup: 'O+',
      father: { name: this.formData.fatherName || '', phone: this.formData.fatherMobile || '', email: '', ic: '', job: this.formData.fatherOcc || '' },
      mother: { name: this.formData.motherName || '', phone: this.formData.motherMobile || '', email: '', ic: '', job: this.formData.motherOcc || '' },
      siblingName: this.siblings[0]?.name || '',
      siblingGrade: this.siblings[0]?.currentSchool || '',
      siblingPhone: '',
      siblingEmail: ''
    });

    const builtFullName = [this.formData.firstName, this.formData.middleName, this.formData.lastName].filter(Boolean).join(' ');

    const newStudentPayload = {
      username: tempUsername,
      email: this.formData.primaryEmail,
      password: "PendingApproval123!",
      fullName: builtFullName,
      phone: this.formData.studentMobile || this.formData.homePhone || '',
      role: 'student',
      status: 'INACTIVE',
      bio: 'Unassigned',
      profileJson: profileJsonBlob,
      applicationPdfBase64: base64PdfStr
    };

    this.authService.submitApplication(newStudentPayload).subscribe({
      next: (res) => {
        alert('Application Submitted Successfully! Please check your email for the confirmation and login link.');
        window.location.reload();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to submit application. This email might already be registered.');
        this.isSubmitting = false;
      }
    });
  }

  toggleLangModal() { this.showLangModal = !this.showLangModal; }
  switchLanguage(lang: string) { window.location.reload(); }
  addSchool() { this.educationalHistory.push({ school: '', country: '', language: '', dates: '', grade: '' }); }
  addSibling() { this.siblings.push({ name: '', age: '', gender: 'Male', currentSchool: '' }); }
  addSection() { this.customSections.push({ sectionTitle: 'New Section', rows: [{ columns: [{ label: 'New Question', type: 'text', options: '', width: '100', value: '' }] }] }); }
  removeSection(sIndex: number) { this.customSections.splice(sIndex, 1); }
  addRow(sIndex: number) { this.customSections[sIndex].rows.push({ columns: [{ label: 'New Question', type: 'text', options: '', width: '100', value: '' }] }); }
  removeRow(sIndex: number, rIndex: number) { this.customSections[sIndex].rows.splice(rIndex, 1); if (this.customSections[sIndex].rows.length === 0) { this.removeSection(sIndex); } }
  addColumn(sIndex: number, rIndex: number) {
    this.customSections[sIndex].rows[rIndex].columns.push({ label: 'New Question', type: 'text', options: '', width: '100', value: '' });
  }
  removeColumn(sIndex: number, rIndex: number, cIndex: number) { this.customSections[sIndex].rows[rIndex].columns.splice(cIndex, 1); if (this.customSections[sIndex].rows[rIndex].columns.length === 0) { this.removeRow(sIndex, rIndex); } }
  addDoc(type: 'my' | 'foreign') { type === 'my' ? this.malaysianDocs.push("New Requirement") : this.foreignDocs.push("New Requirement"); }
  removeDoc(type: 'my' | 'foreign', index: number) { type === 'my' ? this.malaysianDocs.splice(index, 1) : this.foreignDocs.splice(index, 1); }
  trackByIndex(index: number, obj: any): any { return index; }

  openEditModal(mode: string) {
    this.editMode = mode;
    this.editData = { ...this.pageData };
  }

  openFieldEdit(fieldKey: string) {
    this.editMode = 'field';
    this.editFieldKey = fieldKey;
    this.editData = { ...this.pageData.fields[fieldKey] };
  }

  closeEditModal() {
    this.editMode = null;
    this.editData = {};
    this.editFieldKey = '';
  }

  saveEdits() {
    if (this.editMode === 'header') {
      this.pageData = { ...this.pageData, ...this.editData };
    } else if (this.editMode === 'field') {
      this.pageData.fields[this.editFieldKey] = { ...this.editData };
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
