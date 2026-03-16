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

    // DB LOAD
    this.http.get('http://localhost:8080/api/content/application_form', { responseType: 'text' }).subscribe({
      next: (data) => {
        const parsed = (data && data.length > 5) ? JSON.parse(data) : defaultData;
        this.malaysianDocs = parsed.malaysianDocs || defaultData.malaysianDocs;
        this.foreignDocs = parsed.foreignDocs || defaultData.foreignDocs;
        this.customSections = parsed.customSections || [];
      },
      error: () => {
        this.malaysianDocs = defaultData.malaysianDocs;
        this.foreignDocs = defaultData.foreignDocs;
      }
    });
  }

  // DB SAVE
  publishChanges() {
    const payload = {
      malaysianDocs: this.malaysianDocs,
      foreignDocs: this.foreignDocs,
      customSections: this.customSections
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('http://localhost:8080/api/content/application_form', JSON.stringify(payload), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Application Form Structure published successfully!'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

  submitForm(event: Event) { event.preventDefault(); alert('Application Submitted! Data will be sent to Admin Portal.'); }
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
}
