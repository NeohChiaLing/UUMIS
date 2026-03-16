import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-organizational-structure',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Footer, FormsModule, HttpClientModule],
  templateUrl: './organizational-structure.html',
  styleUrl: './organizational-structure.css'
})
export class OrganizationalStructureComponent implements OnInit {

  pageData: any = {};
  isAdmin: boolean = false;
  editMode: boolean = false;
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
      badge: 'Hierarchy',
      titleStart: 'Organizational',
      titleHighlight: 'Structure',
      chartImage: '/assets/organizational structure.png'
    };

    // DB LOAD
    this.http.get('http://localhost:8080/api/content/organizational_structure', { responseType: 'text' }).subscribe({
      next: (data) => { this.pageData = (data && data.length > 5) ? JSON.parse(data) : defaultData; },
      error: () => { this.pageData = defaultData; }
    });
  }

  // DB SAVE
  publishChanges() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('http://localhost:8080/api/content/organizational_structure', JSON.stringify(this.pageData), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Changes published successfully!'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

  toggleLangModal() { this.showLangModal = !this.showLangModal; }
  switchLanguage(lang: string) { window.location.reload(); }
  openEditModal() { this.editMode = true; this.editData = { ...this.pageData }; }
  closeEditModal() { this.editMode = false; this.editData = {}; }
  saveEdits() { this.pageData = { ...this.editData }; this.closeEditModal(); }
  onFileSelected(event: any) { const file: File = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (e: any) => this.editData.chartImage = e.target.result; reader.readAsDataURL(file); } }
}
