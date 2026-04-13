import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, FormsModule, HttpClientModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class ContactComponent implements OnInit {

  isAdmin: boolean = false;
  showLangModal: boolean = false;

  editMode: string | null = null;
  editData: any = {};
  editIndex: number = -1;
  currentFormType: string = 'general';

  // Configuration for Page Text and Dynamic Questions
  pageData: any = {
    titleStart: 'Contact',
    titleHighlight: 'Us',
    description: 'We are here to assist with your enquiries.',

    banner: {
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
      title: 'Questions about student admissions?',
      desc: "We're here to help—please submit them through our Admissions Enquiry Form.",
      btnText: 'Contact Admissions Team'
    },

    // Dynamic Questions Array for the General Form
    generalQuestions: [
      { id: 'gq1', label: 'Select your preferred campus:', type: 'radio', options: 'Kuala Lumpur, Puchong', required: true, width: 'full' },
      { id: 'gq2', label: '', type: 'radio', options: 'General, Marketing, Alumni, Human Resources, Facilities Rental', required: true, width: 'full' },
      { id: 'gq3', label: 'First Name', type: 'text', options: '', required: true, width: 'half' },
      { id: 'gq4', label: 'Surname/Last Name', type: 'text', options: '', required: true, width: 'half' },
      { id: 'gq5', label: 'Phone', type: 'tel', options: '', required: true, width: 'half' },
      { id: 'gq6', label: 'Email', type: 'email', options: '', required: true, width: 'half' },
      { id: 'gq7', label: 'Share Your Questions', type: 'textarea', options: '', required: true, width: 'full' }
    ],

    // Dynamic Questions Array for the Admissions Form
    dynamicQuestions: [
      { id: 'q1', label: 'Select your preferred campus:', type: 'radio', options: 'Kuala Lumpur, Puchong', required: true, width: 'full' },
      { id: 'q2', label: 'PARENT/GUARDIAN DETAILS', type: 'header', options: '', required: false, width: 'full' },
      { id: 'q3', label: 'First Name', type: 'text', options: '', required: true, width: 'half' },
      { id: 'q4', label: 'Last Name', type: 'text', options: '', required: true, width: 'half' },
      { id: 'q5', label: 'Email', type: 'email', options: '', required: true, width: 'half' },
      { id: 'q6', label: 'Phone Number', type: 'tel', options: '', required: true, width: 'half' },
      { id: 'q7', label: 'Number of Children', type: 'select', options: '1, 2, 3, 4, 5+', required: true, width: 'full' }
    ]
  };

  // Form Data Models
  generalForm: any = { consent1: false, consent2: '' };
  admissionsForm: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.isAdmin = sessionStorage.getItem('websiteEditMode') === 'true';
    this.loadPageData();
  }

  loadPageData() {
    this.http.get('/api/content/contact', { responseType: 'text' }).subscribe({
      next: (data) => {
        if (data && data.length > 5) {
          const parsed = JSON.parse(data);
          if(parsed.titleStart) this.pageData = parsed;
        }
      },
      error: () => console.log("Using default contact data.")
    });
  }

  publishChanges() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('/api/content/contact', JSON.stringify(this.pageData), { headers, responseType: 'text' })
      .subscribe({
        next: () => alert('Contact page layout saved successfully!'),
        error: () => alert('Failed to save to database.')
      });
  }

  // --- FORM SUBMISSIONS ---
  submitGeneral(event: Event) {
    event.preventDefault();
    if(!this.generalForm.consent1 || !this.generalForm.consent2) {
      alert("Please agree to the Privacy Policy to continue.");
      return;
    }
    console.log("General Form Payload:", this.generalForm);
    alert('Thank you! Your general enquiry has been sent to our team.');
    this.generalForm = { consent1: false, consent2: '' };
  }

  submitAdmissions(event: Event) {
    event.preventDefault();
    console.log("Admissions Form Payload:", this.admissionsForm);
    alert('Thank you! Our Admissions team will contact you shortly.');
    this.admissionsForm = {};
  }

  scrollToAdmissions() {
    const el = document.getElementById('admissions-section');
    if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- ADMIN DYNAMIC FORM EDITOR ---
  openEditModal(mode: string) {
    this.editMode = mode;
    if (mode === 'pageInfo') {
      this.editData = { titleStart: this.pageData.titleStart, titleHighlight: this.pageData.titleHighlight, description: this.pageData.description };
    } else if (mode === 'banner') {
      this.editData = { ...this.pageData.banner };
    }
  }

  openAddQuestion(formType: string) {
    this.currentFormType = formType;
    this.editMode = 'question';
    this.editIndex = -1;
    this.editData = { label: 'New Question', type: 'text', options: '', required: false, width: 'full' };
  }

  openEditQuestion(formType: string, index: number) {
    this.currentFormType = formType;
    this.editMode = 'question';
    this.editIndex = index;
    if (formType === 'general') {
      this.editData = { ...this.pageData.generalQuestions[index] };
    } else {
      this.editData = { ...this.pageData.dynamicQuestions[index] };
    }
  }

  deleteQuestion(formType: string, index: number) {
    if(confirm("Are you sure you want to delete this question?")) {
      if (formType === 'general') {
        this.pageData.generalQuestions.splice(index, 1);
      } else {
        this.pageData.dynamicQuestions.splice(index, 1);
      }
    }
  }

  closeEditModal() {
    this.editMode = null;
    this.editData = {};
  }

  saveEdits() {
    if (this.editMode === 'pageInfo') {
      this.pageData.titleStart = this.editData.titleStart;
      this.pageData.titleHighlight = this.editData.titleHighlight;
      this.pageData.description = this.editData.description;
    }
    else if (this.editMode === 'banner') {
      this.pageData.banner = { ...this.editData };
    }
    else if (this.editMode === 'question') {
      const targetArray = this.currentFormType === 'general' ? this.pageData.generalQuestions : this.pageData.dynamicQuestions;

      if (this.editIndex === -1) {
        this.editData.id = 'q' + Date.now();
        targetArray.push({ ...this.editData });
      } else {
        targetArray[this.editIndex] = { ...this.editData };
      }
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

  // Language Logic
  toggleLangModal() { this.showLangModal = !this.showLangModal; }
  switchLanguage(lang: string) {
    this.showLangModal = false;
    if (lang === 'en') {
      const domains = [window.location.hostname, '.' + window.location.hostname, 'localhost', ''];
      domains.forEach(d => { document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${d}; path=/;`; });
      window.location.reload();
      return;
    }
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) { select.value = lang; select.dispatchEvent(new Event('change')); }
  }
}
