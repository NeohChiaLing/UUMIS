import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
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
  pageData: any = { locations: [] };
  formData = { fullName: '', contactNum: '', email: '', message: '' };

  isAdmin: boolean = false;
  showLangModal: boolean = false;
  editMode: string | null = null;
  editData: any = {};
  editIndex: number = -1;

  // Icon Library for the Admin to choose from
  availableIcons = [
    'location_on', 'mail', 'call', 'schedule', 'public',
    'school', 'info', 'share', 'description', 'none'
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.isAdmin = sessionStorage.getItem('websiteEditMode') === 'true';
    this.loadPageData();
  }

  loadPageData() {
    this.http.get('http://localhost:8080/api/content/contact', { responseType: 'text' }).subscribe({
      next: (data) => { if (data && data.length > 5) this.pageData = JSON.parse(data); },
      error: () => this.setupDefaults()
    });
  }

  setupDefaults() {
    this.pageData = {
      locations: [
        { icon: 'location_on', title: 'Location', address: 'UUM International School,\nThe Universiti Inn, UUM,\n06010 Sintok, Kedah, Malaysia.' }
      ]
    };
  }

  publishChanges() {
    this.http.post('http://localhost:8080/api/content/contact', this.pageData, { responseType: 'text' })
      .subscribe(() => alert('Contact page saved successfully!'));
  }

  openEditLocation(index: number = -1) {
    this.editIndex = index;
    this.editMode = 'location';
    if (index >= 0) {
      this.editData = { ...this.pageData.locations[index] };
    } else {
      this.editData = { icon: 'location_on', title: '', address: '' };
    }
  }

  saveLocation() {
    if (this.editIndex >= 0) {
      this.pageData.locations[this.editIndex] = { ...this.editData };
    } else {
      this.pageData.locations.push({ ...this.editData });
    }
    this.editMode = null;
  }

  sendInquiry() {
    this.http.post('http://localhost:8080/api/content/contact/send-email', this.formData, { responseType: 'text' }).subscribe({
      next: () => {
        alert('Thank you! Your inquiry has been sent to uumis@uum.edu.my');
        this.formData = { fullName: '', contactNum: '', email: '', message: '' };
      },
      error: () => alert('Failed to send email.')
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
}
