import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [Navbar, Footer, CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './fees.html',
  styleUrl: './fees.css'
})
export class FeesComponent implements OnInit {

  isAdmin: boolean = false;
  showLangModal: boolean = false;

  pageData: any = {};
  academicYear: string = '';
  availableYears: string[] = [];
  feeRows: any[] = [];
  notes: any[] = [];

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
      pageData: { titleStart: 'Fee Structure', desc: 'Transparent and comprehensive tuition and fee schedule for the upcoming academic year.' },
      academicYear: '2025 - 2026',
      availableYears: ['2024 - 2025', '2025 - 2026', '2026 - 2027', '2027 - 2028', '2028 - 2029', '2029 - 2030', '2030 - 2031', '2031 - 2032', '2032 - 2033', '2033 - 2034', '2034 - 2035', '2035 - 2036', '2036 - 2037', '2037 - 2038', '2038 - 2039', '2039 - 2040'],
      feeRows: [{ grade: 'Pre Kindergarten', semFee: '2,850.00', yearFee: '5,700.00', matFee: '300.00', techFee: '-', sciFee: '-', sub: '300.00', totSem: '3,150.00', totYear: '6,300.00', admFee: '250.00', uniFee: '250.00' }],
      notes: [{ text: "The academic year is structured into two semesters.", isRed: false }, { text: "Please be advised that all fees paid are strictly non-refundable.", isRed: true }]
    };

    // DB LOAD
    this.http.get('http://localhost:8080/api/content/fees', { responseType: 'text' }).subscribe({
      next: (data) => {
        const parsed = (data && data.length > 5) ? JSON.parse(data) : defaultData;
        this.pageData = parsed.pageData || defaultData.pageData;
        this.academicYear = parsed.academicYear || defaultData.academicYear;
        this.availableYears = parsed.availableYears || defaultData.availableYears;
        this.feeRows = parsed.feeRows || defaultData.feeRows;
        this.notes = parsed.notes || defaultData.notes;
      },
      error: () => {
        this.pageData = defaultData.pageData; this.academicYear = defaultData.academicYear;
        this.availableYears = defaultData.availableYears; this.feeRows = defaultData.feeRows; this.notes = defaultData.notes;
      }
    });
  }

  // DB SAVE
  publishChanges() {
    const payload = { pageData: this.pageData, academicYear: this.academicYear, availableYears: this.availableYears, feeRows: this.feeRows, notes: this.notes };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('http://localhost:8080/api/content/fees', JSON.stringify(payload), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Fees changes published successfully!'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

  toggleLangModal() { this.showLangModal = !this.showLangModal; }
  switchLanguage(lang: string) { window.location.reload(); }
  addRow() { this.feeRows.push({ grade: 'New Grade', semFee: '0.00', yearFee: '0.00', matFee: '0.00', techFee: '-', sciFee: '-', sub: '0.00', totSem: '0.00', totYear: '0.00', admFee: '0.00', uniFee: '0.00' }); }
  removeRow(index: number) { this.feeRows.splice(index, 1); }
  addNote() { this.notes.push({ text: "New note here", isRed: false }); }
  removeNote(index: number) { this.notes.splice(index, 1); }
}
