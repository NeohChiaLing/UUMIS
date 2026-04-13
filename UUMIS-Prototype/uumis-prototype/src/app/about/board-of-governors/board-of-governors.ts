import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-board-of-governors',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Footer, FormsModule, HttpClientModule],
  templateUrl: './board-of-governors.html',
  styleUrl: './board-of-governors.css'
})
export class BoardOfGovernorsComponent implements OnInit {

  pageData: any = {};
  isAdmin: boolean = false;
  editMode: string | null = null;
  editData: any = {};
  editIndex: number = -1;
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
      hero: { badge: 'School Leadership', titleStart: 'Board of', titleHighlight: 'Governors', desc: 'Committed to fostering an environment of academic excellence...', bgImage: 'assets/UUMIS.jpg' },
      vc: { name: 'Prof. Dr. Mohd Fo’ad Sakdan', title: 'Universiti Utara Malaysia', quote: '"Our mission is to cultivate global citizens..."', image: 'assets/Vice-Chancellor.png' },
      members: [
        { name: 'Prof. Dr. Mohd. Azizuddin Mohd Sani', role: 'Deputy Vice Chancellor', desc: '(Academic & International)', image: 'assets/Deputy Vice Chancellor.png', icon: 'account_balance' },
        { name: 'Y. Bhg. Prof. Dr. Abdul Malek', role: 'Board Member', desc: 'Contributing expertise...', image: 'assets/other1.png', icon: 'person' },
        { name: 'Y. Bhg. Datin Paduka Dato’ Hajah Azuyah', role: 'Board Member', desc: 'Ensuring holistic student development...', image: 'assets/other2.png', icon: 'person_3' }
      ]
    };

    // DB LOAD
    this.http.get('/api/content/board_of_governors', { responseType: 'text' }).subscribe({
      next: (data) => { this.pageData = (data && data.length > 5) ? JSON.parse(data) : defaultData; },
      error: () => { this.pageData = defaultData; }
    });
  }

  // DB SAVE
  publishChanges() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('/api/content/board_of_governors', JSON.stringify(this.pageData), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Changes published successfully!'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

  toggleLangModal() { this.showLangModal = !this.showLangModal; }
  switchLanguage(lang: string) { window.location.reload(); }
  openEditModal(type: string, item: any = null, index: number = -1) { this.editMode = type; this.editIndex = index; if (type === 'hero') this.editData = { ...this.pageData.hero }; else if (type === 'vc') this.editData = { ...this.pageData.vc }; else if (type === 'member') this.editData = item ? { ...item } : { name: '', role: '', desc: '', image: '', icon: 'person' }; }
  closeEditModal() { this.editMode = null; this.editData = {}; }
  saveEdits() { if (this.editMode === 'hero') this.pageData.hero = { ...this.editData }; else if (this.editMode === 'vc') this.pageData.vc = { ...this.editData }; else if (this.editMode === 'member') { if (this.editIndex >= 0) this.pageData.members[this.editIndex] = { ...this.editData }; else this.pageData.members.push({ ...this.editData }); } this.closeEditModal(); }
  deleteMember(index: number, event: Event) { event.stopPropagation(); if(confirm("Delete this board member?")) this.pageData.members.splice(index, 1); }
  onFileSelected(event: any, fieldName: string) { const file: File = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (e: any) => this.editData[fieldName] = e.target.result; reader.readAsDataURL(file); } }
}
