import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [Navbar, Footer, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class CalendarComponent implements OnInit {
  pageData: any = { title: 'Academic Calendar', semesters: [] };
  isAdmin: boolean = false;
  editMode: string | null = null;
  editData: any = {};
  editIndex: number = -1;
  showLangModal: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Check Admin status matches Home page logic
    const isEditMode = sessionStorage.getItem('websiteEditMode') === 'true';
    this.isAdmin = isEditMode;

    this.loadData();
  }

  loadData() {
    this.http.get('http://localhost:8080/api/content/calendar', { responseType: 'text' }).subscribe({
      next: (data) => {
        if (data && data.length > 5) {
          this.pageData = JSON.parse(data);
        } else {
          this.setupDefaults();
        }
      },
      error: () => this.setupDefaults()
    });
  }

  setupDefaults() {
    this.pageData = {
      title: 'Academic Calendar',
      semesters: [
        {
          name: 'Semester 1 (Aug - Dec 2025)',
          images: ['/assets/calender01.png', '/assets/calender02.png']
        }
      ]
    };
  }

  publishChanges() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('http://localhost:8080/api/content/calendar', JSON.stringify(this.pageData), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Calendar published successfully!'),
      error: (err) => alert('Error saving to database.')
    });
  }

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
