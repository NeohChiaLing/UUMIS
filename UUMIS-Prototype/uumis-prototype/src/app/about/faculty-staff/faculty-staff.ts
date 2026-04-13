import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-faculty-staff',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, Navbar, Footer],
  templateUrl: './faculty-staff.html',
  styleUrls: []
})
export class FacultyStaffComponent implements OnInit {

  pageData: any = {};
  isAdmin: boolean = false;

  liveAdmins: any[] = [];
  liveTeachers: any[] = [];
  isFetchingUsers: boolean = true;

  editMode: string | null = null;
  editData: any = {};
  editIndex: number = -1;

  showCVModal: boolean = false;
  selectedCV: any = null;
  isLoadingCV: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const isEditMode = sessionStorage.getItem('websiteEditMode') === 'true';
    const userStr = String(localStorage.getItem('user') || '').toLowerCase();
    const roleStr = String(localStorage.getItem('role') || '').toLowerCase();
    let fromService = false;
    try {
      const currentUser = this.authService.getCurrentUser ? this.authService.getCurrentUser() : null;
      if (currentUser && String(currentUser.role).toLowerCase().includes('admin')) { fromService = true; }
    } catch (e) {}
    this.isAdmin = isEditMode && (userStr.includes('admin') || roleStr.includes('admin') || fromService);

    let defaultData: any = {
      hero: {
        badge: 'OUR TEAM',
        titleStart: 'Faculty &',
        titleHighlight: 'Staff',
        desc: 'Meet the dedicated professionals who lead and inspire our students every day at UUMIS.',
        bgImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop'
      }
    };

    this.http.get('/api/content/faculty-staff', { responseType: 'text' }).subscribe({
      next: (data) => {
        if (data && data.length > 5) {
          this.pageData = JSON.parse(data);
        } else {
          this.pageData = defaultData;
        }
      },
      error: () => {
        this.pageData = defaultData;
      }
    });

    this.loadLiveStaff();
  }

  loadLiveStaff() {
    this.isFetchingUsers = true;
    this.authService.getUsers().subscribe({
      next: (users: any[]) => {
        this.liveAdmins = [];
        this.liveTeachers = [];

        users.forEach(user => {
          const role = (user.role || '').toLowerCase();

          let certs = [];
          if (user.certificatesJson) {
            try { certs = JSON.parse(user.certificatesJson); } catch(e) {}
          }

          const displayUser = {
            id: user.id,
            name: user.fullName || user.username,
            role: user.role,
            desc: user.summary || 'Professional staff member at UUMIS.',
            summary: user.summary,
            image: user.avatarUrl || null,
            email: user.email,
            phone: user.phone,
            hardSkills: user.hardSkills,
            softSkills: user.softSkills,
            philosophy: user.philosophy,
            assignedSubjects: user.assignedSubjects ? user.assignedSubjects.split(',').map((s:string) => s.trim()) : [],
            assignedClasses: user.bio && user.bio !== 'Unassigned' ? user.bio.split(',').map((c:string) => c.trim()) : [],
            certificates: certs,
            foundInDB: true
          };

          if (role.includes('admin') || role.includes('staff') || role.includes('manager')) {
            this.liveAdmins.push({...displayUser, type: 'admin'});
          } else if (role.includes('teacher')) {
            this.liveTeachers.push({...displayUser, type: 'teacher'});
          }
        });

        this.isFetchingUsers = false;
      },
      error: () => {
        this.isFetchingUsers = false;
        console.warn("Failed to fetch live staff from database.");
      }
    });
  }

  publishChanges() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('/api/content/faculty-staff', JSON.stringify(this.pageData), { headers, responseType: 'text' }).subscribe({
      next: () => alert('Page design published successfully! Note: Staff lists are controlled automatically by the Database.'),
      error: (err) => { console.error(err); alert('Error saving to database.'); }
    });
  }

  viewCV(person: any) {
    this.showCVModal = true;
    this.selectedCV = person;
  }

  closeCVModal() {
    this.showCVModal = false;
    this.selectedCV = null;
  }

  openEditModal(type: 'hero') {
    this.editMode = type;
    this.editData = { ...this.pageData.hero };
  }

  closeEditModal() {
    this.editMode = null;
    this.editData = {};
  }

  saveEdits() {
    if (this.editMode === 'hero') {
      this.pageData.hero = { ...this.editData };
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

  downloadCert(cert: any) {
    if (cert.fileUrl) {
      const a = document.createElement('a');
      a.href = cert.fileUrl;
      a.download = cert.fileName || 'certificate.pdf';
      a.click();
    } else {
      alert("No file available for download.");
    }
  }
}
