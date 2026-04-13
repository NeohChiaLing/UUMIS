import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-mission-vision',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Footer, FormsModule, HttpClientModule],
  templateUrl: './mission-vision.html',
  styleUrl: './mission-vision.css'
})
export class MissionVisionComponent implements OnInit {

  pageData: any = {};
  isAdmin: boolean = false;
  editMode: string | null = null;
  editData: any = {};
  editIndex: number = -1;
  showLangModal: boolean = false;

  draggedObjIndex: number = -1;
  startX: number = 0; startY: number = 0;

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

    const rawObjectives = ["Acknowledges and values students' diversity...", "Discovers each student's uniqueness...", "Equips students with knowledge...", "Prepares students to be academically...", "Teaches students to respect different cultures..."];
    const defaultData = {
      hero: { badge: 'Est. 2014', titleStart: 'Our Purpose &', titleHighlight: 'Direction', desc: 'Driven by a commitment to excellence...', bgImage: '/assets/UUMIS.jpg' },
      legacy: { titleStart: 'A Legacy of', titleHighlight: 'Excellence', p1: 'UUM International School was formed in 2014...', p2: 'UUM International School offers a quality...', p3: 'UUM International School is committed...', image: 'assets/UUMIS-BROCHURE-1.jpg' },
      objectives: rawObjectives.map(text => ({ text: text, x: 0, y: 0 }))
    };

    // DB LOAD
    this.http.get('/api/content/mission_vision', { responseType: 'text' }).subscribe({
      next: (data) => {
        this.pageData = (data && data.length > 5) ? JSON.parse(data) : defaultData;
        this.recalculateCircleLayout();
      },
      error: () => {
        this.pageData = defaultData;
        this.recalculateCircleLayout();
      }
    });
  }

  // DB SAVE
  publishChanges() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('/api/content/mission_vision', JSON.stringify(this.pageData), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Changes published successfully!'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

  recalculateCircleLayout() { const total = this.pageData.objectives.length; const radius = 290; this.pageData.objectives.forEach((obj: any, i: number) => { const angle = (i / total) * 2 * Math.PI - (Math.PI / 2); obj.x = radius * Math.cos(angle); obj.y = radius * Math.sin(angle); }); }
  getArrowTransform(obj: any): string { const angle = Math.atan2(-obj.y, -obj.x) * (180 / Math.PI); return `translate(-50%, -50%) rotate(${angle}deg) translateX(155px)`; }
  startObjDrag(i: number, event: MouseEvent) { if (!this.isAdmin) return; this.draggedObjIndex = i; this.startX = event.clientX; this.startY = event.clientY; event.preventDefault(); }
  onObjDrag(event: MouseEvent) { if (this.draggedObjIndex === -1) return; const dx = event.clientX - this.startX; const dy = event.clientY - this.startY; this.pageData.objectives[this.draggedObjIndex].x += dx; this.pageData.objectives[this.draggedObjIndex].y += dy; this.startX = event.clientX; this.startY = event.clientY; }
  endObjDrag() { this.draggedObjIndex = -1; }
  toggleLangModal() { this.showLangModal = !this.showLangModal; }
  switchLanguage(lang: string) { window.location.reload(); }
  openEditModal(type: string, index: number = -1) { this.editMode = type; this.editIndex = index; if (type === 'hero') this.editData = { ...this.pageData.hero }; else if (type === 'legacy') this.editData = { ...this.pageData.legacy }; else if (type === 'objective') this.editData = { text: index >= 0 ? this.pageData.objectives[index].text : '' }; }
  closeEditModal() { this.editMode = null; this.editData = {}; }
  saveEdits() { if (this.editMode === 'hero') this.pageData.hero = { ...this.editData }; else if (this.editMode === 'legacy') this.pageData.legacy = { ...this.editData }; else if (this.editMode === 'objective') { if (this.editIndex >= 0) { this.pageData.objectives[this.editIndex].text = this.editData.text; } else { this.pageData.objectives.push({ text: this.editData.text, x: 0, y: 0 }); this.recalculateCircleLayout(); } } this.closeEditModal(); }
  deleteObjective(index: number, event: Event) { event.stopPropagation(); if(confirm("Delete this objective?")) { this.pageData.objectives.splice(index, 1); this.recalculateCircleLayout(); } }
  onFileSelected(event: any, fieldName: string) { const file: File = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (e: any) => this.editData[fieldName] = e.target.result; reader.readAsDataURL(file); } }
}
