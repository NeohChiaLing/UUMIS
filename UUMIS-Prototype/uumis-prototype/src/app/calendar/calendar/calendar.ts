import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [Navbar, Footer, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class CalendarComponent implements OnInit {
  // Added the new academic planner image as the absolute default
  pageData: any = {
    badge: 'Calendar',
    titleStart: 'Academic',
    titleHighlight: 'Calendar',
    description: '** The scheduled dates for events are not final and subject to change',
    bgImage: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1920&q=80',
    semesters: []
  };

  isAdmin: boolean = false;
  editMode: string | null = null;
  editData: any = {};
  editIndex: number = -1;
  showLangModal: boolean = false;

  constructor(private http: HttpClient, private authService: AuthService, private route: ActivatedRoute) {}

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

    this.loadData();
  }

  loadData() {
    const defaultData = {
      badge: 'Calendar',
      titleStart: 'Academic',
      titleHighlight: 'Calendar',
      description: '** The scheduled dates for events are not final and subject to change',
      bgImage: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1920&q=80',
      semesters: [
        {
          name: 'Semester 1 (Aug - Dec 2025)',
          images: ['assets/calender01.png', 'assets/calender02.png']
        }
      ]
    };

    this.http.get('/api/content/calendar', { responseType: 'text' }).subscribe({
      next: (data) => {
        if (data && data.length > 5) {
          const parsed = JSON.parse(data);
          this.pageData = parsed;

          // Failsafes for older database saves
          if (!this.pageData.bgImage) this.pageData.bgImage = defaultData.bgImage;
          if (!this.pageData.titleStart) {
            this.pageData.titleStart = defaultData.titleStart;
            this.pageData.titleHighlight = defaultData.titleHighlight;
            this.pageData.description = defaultData.description;
            this.pageData.badge = defaultData.badge;
          }
        } else {
          this.pageData = defaultData;
        }
      },
      error: () => this.pageData = defaultData
    });
  }

  publishChanges() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('/api/content/calendar', JSON.stringify(this.pageData), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Calendar published successfully!'),
      error: (err) => alert('Error saving to database.')
    });
  }

  // --- HEADER EDITING FUNCTIONS ---
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
      this.pageData.badge = this.editData.badge;
      this.pageData.titleStart = this.editData.titleStart;
      this.pageData.titleHighlight = this.editData.titleHighlight;
      this.pageData.description = this.editData.description;
      this.pageData.bgImage = this.editData.bgImage;
    }
    this.closeEditModal();
  }

  onFileSelectedSingle(event: any, fieldName: string) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.editData[fieldName] = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  // --- SEMESTER EDITING FUNCTIONS ---
  openEditSemester(index: number = -1) {
    this.editIndex = index;
    this.editMode = 'semester';
    if (index >= 0) {
      this.editData = JSON.parse(JSON.stringify(this.pageData.semesters[index]));
    } else {
      this.editData = { name: '', images: [] };
    }
  }

  saveSemester() {
    if (this.editIndex >= 0) {
      this.pageData.semesters[this.editIndex] = { ...this.editData };
    } else {
      this.pageData.semesters.push({ ...this.editData });
    }
    this.editMode = null;
  }

  deleteSemester(index: number) {
    if (confirm("Are you sure you want to delete this semester?")) {
      this.pageData.semesters.splice(index, 1);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => this.editData.images.push(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(idx: number) { this.editData.images.splice(idx, 1); }

  // Language Logic matches Home Page
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
