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

  // FIXED: Organized into pageData to match the unified modal logic
  pageData: any = {
    badge: 'Financial Information',
    titleStart: 'Fee Structure',
    desc: 'Transparent and comprehensive tuition and fee schedule for the upcoming academic year.',
    bgImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1920&q=80'
  };

  academicYear: string = '';
  availableYears: string[] = [];

  // Base Table Data
  feeRows: any[] = [];
  customColumns: string[] = [];

  // Additional Dynamic Tables
  extraTables: any[] = [];
  notes: any[] = [];

  // Background Editing Variables
  editMode: string | null = null;
  editData: any = {};

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
      pageData: {
        badge: 'Financial Information',
        titleStart: 'Fee Structure',
        desc: 'Transparent and comprehensive tuition and fee schedule for the upcoming academic year.',
        bgImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1920&q=80'
      },
      academicYear: '2025 - 2026',
      availableYears: ['2024 - 2025', '2025 - 2026', '2026 - 2027', '2027 - 2028', '2028 - 2029', '2029 - 2030', '2030 - 2031'],
      feeRows: [{ grade: 'Pre Kindergarten', semFee: '2,850.00', yearFee: '5,700.00', matFee: '300.00', techFee: '-', sciFee: '-', sub: '300.00', totSem: '3,150.00', totYear: '6,300.00', admFee: '250.00', uniFee: '250.00', isHeading: false, customData: [] }],
      customColumns: [],
      extraTables: [],
      notes: [{ text: "The academic year is structured into two semesters.", isRed: false }, { text: "Please be advised that all fees paid are strictly non-refundable.", isRed: true }]
    };

    // DB LOAD
    this.http.get('/api/content/fees', { responseType: 'text' }).subscribe({
      next: (data) => {
        const parsed = (data && data.length > 5) ? JSON.parse(data) : defaultData;
        this.pageData = parsed.pageData || defaultData.pageData;

        // Failsafes to prevent older DB schemas from breaking the new layout
        if (!this.pageData.bgImage) this.pageData.bgImage = defaultData.pageData.bgImage;
        if (!this.pageData.badge) this.pageData.badge = defaultData.pageData.badge;

        this.academicYear = parsed.academicYear || defaultData.academicYear;
        this.availableYears = parsed.availableYears || defaultData.availableYears;
        this.feeRows = parsed.feeRows || defaultData.feeRows;
        this.customColumns = parsed.customColumns || defaultData.customColumns;
        this.notes = parsed.notes || defaultData.notes;

        this.feeRows.forEach(row => { if (!row.customData) row.customData = new Array(this.customColumns.length).fill(''); });

        let loadedExtraTables = parsed.extraTables || defaultData.extraTables;
        this.extraTables = loadedExtraTables.map((t: any) => {
          if (!t.columns) {
            return {
              title: t.title,
              columns: ['Description', 'Amount (RM)'],
              rows: t.rows.map((r: any) => ({ isHeading: false, data: [r.title || '', r.amount || ''] }))
            };
          }
          return t;
        });
      },
      error: () => {
        this.pageData = defaultData.pageData; this.academicYear = defaultData.academicYear;
        this.availableYears = defaultData.availableYears; this.feeRows = defaultData.feeRows;
        this.customColumns = defaultData.customColumns; this.extraTables = defaultData.extraTables; this.notes = defaultData.notes;
      }
    });
  }

  publishChanges() {
    const payload = {
      pageData: this.pageData,
      academicYear: this.academicYear,
      availableYears: this.availableYears,
      feeRows: this.feeRows,
      customColumns: this.customColumns,
      extraTables: this.extraTables,
      notes: this.notes
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('/api/content/fees', JSON.stringify(payload), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Fees changes published successfully!'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

  toggleLangModal() { this.showLangModal = !this.showLangModal; }
  switchLanguage(lang: string) { window.location.reload(); }

  // --- BASE TABLE FUNCTIONS ---
  addRow() {
    this.feeRows.push({ grade: 'New Grade', semFee: '0.00', yearFee: '0.00', matFee: '0.00', techFee: '-', sciFee: '-', sub: '0.00', totSem: '0.00', totYear: '0.00', admFee: '0.00', uniFee: '0.00', isHeading: false, customData: new Array(this.customColumns.length).fill('') });
  }

  addMergedRow() {
    this.feeRows.push({ grade: '--- SECTION HEADING ---', semFee: '', yearFee: '', matFee: '', techFee: '', sciFee: '', sub: '', totSem: '', totYear: '', admFee: '', uniFee: '', isHeading: true, customData: new Array(this.customColumns.length).fill('') });
  }

  removeRow(index: number) { this.feeRows.splice(index, 1); }

  addColumn() {
    this.customColumns.push('New Column');
    this.feeRows.forEach(row => row.customData.push('0.00'));
  }

  removeColumn(colIndex: number) {
    if(confirm("Are you sure you want to delete this entire column?")) {
      this.customColumns.splice(colIndex, 1);
      this.feeRows.forEach(row => row.customData.splice(colIndex, 1));
    }
  }

  // --- DYNAMIC EXTRA TABLES FUNCTIONS ---
  addTable() {
    this.extraTables.push({
      title: 'Additional Fee Category',
      columns: ['Description', 'Amount (RM)'],
      rows: [{ isHeading: false, data: ['New Item', '0.00'] }]
    });
  }

  removeTable(tIndex: number) {
    if(confirm("Are you sure you want to delete this table?")) {
      this.extraTables.splice(tIndex, 1);
    }
  }

  addExtraTableColumn(tIndex: number) {
    this.extraTables[tIndex].columns.push('New Column');
    this.extraTables[tIndex].rows.forEach((row: any) => row.data.push('-'));
  }

  removeExtraTableColumn(tIndex: number, cIdx: number) {
    if (this.extraTables[tIndex].columns.length <= 1) {
      alert("You must have at least one column.");
      return;
    }
    if(confirm("Delete this column?")) {
      this.extraTables[tIndex].columns.splice(cIdx, 1);
      this.extraTables[tIndex].rows.forEach((row: any) => row.data.splice(cIdx, 1));
    }
  }

  addExtraTableRow(tIndex: number) {
    const emptyData = new Array(this.extraTables[tIndex].columns.length).fill('');
    emptyData[0] = 'New Item';
    emptyData[1] = '0.00';
    this.extraTables[tIndex].rows.push({ isHeading: false, data: emptyData });
  }

  addExtraTableHeading(tIndex: number) {
    const emptyData = new Array(this.extraTables[tIndex].columns.length).fill('');
    emptyData[0] = '--- Sub Heading ---';
    this.extraTables[tIndex].rows.push({ isHeading: true, data: emptyData });
  }

  removeExtraTableRow(tIndex: number, rIndex: number) {
    this.extraTables[tIndex].rows.splice(rIndex, 1);
  }

  addNote() { this.notes.push({ text: "New note here", isRed: false }); }
  removeNote(index: number) { this.notes.splice(index, 1); }

  // FIX: Edit modal clones the whole pageData object so we can edit text
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
      this.pageData = { ...this.editData };
    }
    this.closeEditModal();
  }

  onFileSelected(event: any, fieldName: string) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.editData[fieldName] = e.target.result;
      reader.readAsDataURL(file);
    }
  }
}
