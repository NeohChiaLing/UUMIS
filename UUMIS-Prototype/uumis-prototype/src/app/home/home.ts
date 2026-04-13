import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { WebsiteDataService } from '../services/website-data';
import { LanguageService } from '../services/language.service';
import { AuthService } from '../services/auth.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Footer, FormsModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  pageData: any = {};
  safeVideoUrl: SafeResourceUrl | null = null;
  selectedImage: string | null = null;

  currentZoom: number = 1;
  isDragging: boolean = false;
  panX: number = 0; panY: number = 0;
  startX: number = 0; startY: number = 0;
  showLangModal: boolean = false;

  isAdmin: boolean = false;
  editMode: string | null = null;
  editData: any = {};
  editIndex: number = -1;

  constructor(
    private webService: WebsiteDataService,
    private sanitizer: DomSanitizer,
    public lang: LanguageService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient
  ) {}

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

    let defaultData: any = this.webService.getHomeData();

    if (!defaultData.hero || !defaultData.hero.badge) {
      defaultData.hero = {
        badge: 'EST. 2014',
        titleStart: 'Shaping Future',
        titleHighlight: 'Global Leaders',
        description: 'Providing a nurturing environment where students thrive academically and develop into well-rounded individuals within the serene UUM campus.',
        bgImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1920&q=80'
      };
    }
    if (!defaultData.videoText) {
      defaultData.videoText = {
        badge: 'Virtual Campus Tour',
        titleStart: 'Experience UUMIS',
        titleEnd: 'Like never before.',
        desc: 'Take a journey through our state-of-the-art facilities, modern classrooms, and vibrant student life.'
      };
    }
    // NEW: Default Editable Shortcuts
    if (!defaultData.shortcuts) {
      defaultData.shortcuts = [
        { title: 'Board of Governors', subtitle: 'Meet the leadership', link: '/about/board', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1080&q=90' },
        { title: 'Apply Online', subtitle: 'Start admission', link: '/admissions/application-form', image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1080&q=90' },
        { title: 'School Calendar', subtitle: 'View key dates', link: '/calendar', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1080&q=90' },
        { title: 'Make an Inquiry', subtitle: 'Contact our staff', link: '/contact', image: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=1080&q=90' }
      ];
    }

    this.http.get('/api/content/home', { responseType: 'text' }).subscribe({
      next: (data) => {
        if (data && data.length > 5) {
          this.pageData = JSON.parse(data);
          // Failsafe in case existing DB doesn't have shortcuts yet
          if(!this.pageData.shortcuts) this.pageData.shortcuts = defaultData.shortcuts;
        } else {
          this.pageData = defaultData;
        }
        if (this.pageData.videoSection?.youtubeUrl) this.updateVideoUrl(this.pageData.videoSection.youtubeUrl);
      },
      error: (err) => {
        console.warn("DB not connected, using defaults");
        this.pageData = defaultData;
        if (this.pageData.videoSection?.youtubeUrl) this.updateVideoUrl(this.pageData.videoSection.youtubeUrl);
      }
    });
  }

  publishChanges() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('/api/content/home', JSON.stringify(this.pageData), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Home Page changes published successfully to the database!'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

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

  openEditModal(type: string, item: any = null, index: number = -1) {
    this.editMode = type; this.editIndex = index;
    if (type === 'hero') this.editData = { ...this.pageData.hero };
    else if (type === 'video') this.editData = { ...this.pageData.videoText, url: this.pageData.videoSection.youtubeUrl };
    else if (type === 'announcement') this.editData = { ...item };
    else if (type === 'event') this.editData = item ? { ...item } : { month: '', day: '', title: '', subtitle: '' };
    else if (type === 'shortcut') this.editData = { ...item }; // NEW: Handle Shortcut edit
  }

  closeEditModal() { this.editMode = null; this.editData = {}; }

  saveEdits() {
    if (this.editMode === 'hero') { this.pageData.hero = { ...this.editData }; }
    else if (this.editMode === 'video') {
      this.pageData.videoText = { badge: this.editData.badge, titleStart: this.editData.titleStart, titleEnd: this.editData.titleEnd, desc: this.editData.desc };
      this.pageData.videoSection.youtubeUrl = this.editData.url;
      this.updateVideoUrl(this.editData.url);
    }
    else if (this.editMode === 'announcement') { this.pageData.announcements[this.editIndex] = { ...this.editData }; }
    else if (this.editMode === 'event') {
      if (this.editIndex >= 0) this.pageData.events[this.editIndex] = { ...this.editData };
      else this.pageData.events.push({ ...this.editData });
    }
    else if (this.editMode === 'shortcut') {
      // NEW: Save Shortcut edit
      this.pageData.shortcuts[this.editIndex] = { ...this.editData };
    }
    this.closeEditModal();
  }

  onFileSelected(event: any, fieldName: string) {
    const file: File = event.target.files[0];
    if (file) { const reader = new FileReader(); reader.onload = (e: any) => this.editData[fieldName] = e.target.result; reader.readAsDataURL(file); }
  }

  deleteEvent(index: number) { if(confirm("Are you sure you want to delete this event?")) this.pageData.events.splice(index, 1); }
  updateVideoUrl(url: string) { this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url); }
  openImage(imageSrc: string): void { this.selectedImage = imageSrc; this.resetImageState(); }
  closeImage(): void { this.selectedImage = null; this.resetImageState(); }
  resetImageState(): void { this.currentZoom = 1; this.panX = 0; this.panY = 0; this.isDragging = false; }
  zoomIn(event: Event): void { event.stopPropagation(); if (this.currentZoom < 3) this.currentZoom += 0.25; }
  zoomOut(event: Event): void { event.stopPropagation(); if (this.currentZoom > 0.5) this.currentZoom -= 0.25; if (this.currentZoom <= 1) { this.panX = 0; this.panY = 0; } }
  startDrag(event: MouseEvent): void { if (this.currentZoom <= 1) return; event.preventDefault(); this.isDragging = true; this.startX = event.clientX - this.panX; this.startY = event.clientY - this.panY; }
  onDrag(event: MouseEvent): void { if (!this.isDragging) return; event.preventDefault(); this.panX = event.clientX - this.startX; this.panY = event.clientY - this.startY; }
  endDrag(): void { this.isDragging = false; }
}
