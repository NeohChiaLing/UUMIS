import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-how-to-apply',
  standalone: true,
  imports: [Navbar, Footer, CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './how-to-apply.html',
  styleUrl: './how-to-apply.css'
})
export class HowToApplyComponent implements OnInit {

  pageData: any = {};
  isAdmin: boolean = false;
  editMode: string | null = null;
  editData: any = {};
  showLangModal: boolean = false;

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
      titleStart: 'How to', titleHighlight: 'Apply',
      findOutTitle: 'Find out more', findOutDesc: 'Find out more about our admissions process...',
      sem1: 'August To December', sem2: 'January To June', phone: '04-928 8790',
      brochureImage: 'assets/MAIN-BROCHURE.jpg', brochurePdf: 'assets/MAIN-BROCHURE.jpg'
    };

    // DB LOAD
    this.http.get('/api/content/how_to_apply', { responseType: 'text' }).subscribe({
      next: (data) => { this.pageData = (data && data.length > 5) ? JSON.parse(data) : defaultData; },
      error: () => { this.pageData = defaultData; }
    });
  }

  // DB SAVE
  publishChanges() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('/api/content/how_to_apply', JSON.stringify(this.pageData), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Changes published successfully to the database!'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

  toggleLangModal() { this.showLangModal = !this.showLangModal; }
  switchLanguage(lang: string) { /* your standard language code */ window.location.reload(); }
  openEditModal(type: string) { this.editMode = type; this.editData = { ...this.pageData }; }
  closeEditModal() { this.editMode = null; }
  saveEdits() { this.pageData = { ...this.editData }; this.closeEditModal(); }
  onFileSelected(event: any, fieldName: string) {
    const file: File = event.target.files[0];
    if (file) { const reader = new FileReader(); reader.onload = (e: any) => this.editData[fieldName] = e.target.result; reader.readAsDataURL(file); }
  }
}
