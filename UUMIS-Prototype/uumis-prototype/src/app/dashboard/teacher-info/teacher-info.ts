import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-info.html',
  styleUrl: './teacher-info.css'
})
export class TeacherInfoComponent implements OnInit {
  userRole: string | null = '';
  searchQuery: string = '';
  isAddMode: boolean = false;

  isAdmin: boolean = false;
  isTeacher: boolean = false;

  teachers: any[] = [];
  availableSubjects: any[] = [];

  showSubjectDropdown: boolean = false;
  openScheduleDropdownSlot: any = null;
  groupedSchedule: any[] = [];

  // ==========================================
  // --- STATE PERSISTENCE (SURVIVES REFRESH) ---
  // ==========================================
  private _viewMode: 'list' | 'profile' | 'teaching' | 'schedule' | 'certs' = 'list';
  get viewMode() { return this._viewMode; }
  set viewMode(val: 'list' | 'profile' | 'teaching' | 'schedule' | 'certs') {
    this._viewMode = val;
    sessionStorage.setItem('uumis_viewMode', val);
  }

  private _isEditMode: boolean = false;
  get isEditMode() { return this._isEditMode; }
  set isEditMode(val: boolean) {
    this._isEditMode = val;
    sessionStorage.setItem('uumis_isEditMode', val ? 'true' : 'false');
  }

  private _selectedTeacher: any = this.getNewTeacherTemplate();
  get selectedTeacher() { return this._selectedTeacher; }
  set selectedTeacher(val: any) {
    this._selectedTeacher = val;
    sessionStorage.setItem('uumis_selectedTeacher', JSON.stringify(val));
  }
  // ==========================================

  constructor(private authService: AuthService, private router: Router, private location: Location) {}

  ngOnInit() {
    const rawRole = this.authService.getRole() || '';
    this.userRole = String(rawRole).toLowerCase().trim();

    this.isAdmin = this.userRole === 'admin';
    this.isTeacher = this.userRole === 'teacher';

    // --- RESTORE STATE ON PAGE REFRESH ---
    const savedMode = sessionStorage.getItem('uumis_viewMode');
    if (savedMode) this._viewMode = savedMode as any;

    const savedEdit = sessionStorage.getItem('uumis_isEditMode');
    if (savedEdit) this._isEditMode = (savedEdit === 'true');

    const savedTeacher = sessionStorage.getItem('uumis_selectedTeacher');
    if (savedTeacher) {
      try {
        this._selectedTeacher = JSON.parse(savedTeacher);
        if (this._viewMode !== 'list') {
          this.buildGroupedSchedule(); // Rebuild the schedule UI if we are inside a profile
        }
      } catch(e) {}
    }
    // --------------------------------------

    this.loadTeachers();
    this.loadSubjects();
  }

  get canAddTeacher() {
    return true;
  }

  get canEditProfile() {
    return true;
  }

  loadTeachers() {
    this.authService.getTeachers().subscribe({
      next: (data) => {
        this.teachers = data.map((t: any, index: number) => ({
          dbId: t.id,
          no: index + 1,
          name: t.fullName || t.username,
          phone: t.phone || '',
          email: t.email || '',
          assignedSubjectsArray: t.assignedSubjects ? t.assignedSubjects.split(',') : [],

          website: '', linkedIn: '', emergencyContact: '',

          summary: t.summary || 'Experienced educator dedicated to student success.',
          education: '', experience: '',
          hardSkills: t.hardSkills || '',
          softSkills: t.softSkills || '',
          philosophy: t.philosophy || 'Engaging students through interactive learning.',

          schedule: t.scheduleJson ? JSON.parse(t.scheduleJson) : [
            { day: 'Sunday', time: '', subject: '', class: '' },
            { day: 'Monday', time: '', subject: '', class: '' },
            { day: 'Tuesday', time: '', subject: '', class: '' },
            { day: 'Wednesday', time: '', subject: '', class: '' },
            { day: 'Thursday', time: '', subject: '', class: '' }
          ],
          certificates: t.certificatesJson ? JSON.parse(t.certificatesJson) : []
        }));
      },
      error: () => console.log('Failed to fetch teachers')
    });
  }

  loadSubjects() {
    this.authService.getSubjects().subscribe({
      next: (data) => {
        this.availableSubjects = data.filter(s => s.active);
      }
    });
  }

  getNewTeacherTemplate() {
    return {
      dbId: null, no: null, name: '', assignedSubjectsArray: [],
      phone: '', email: '', website: '', linkedIn: '', emergencyContact: '',
      summary: '', education: '', experience: '', hardSkills: '', softSkills: '', philosophy: '',
      schedule: [
        { day: 'Sunday', time: '', subject: '', class: '' },
        { day: 'Monday', time: '', subject: '', class: '' },
        { day: 'Tuesday', time: '', subject: '', class: '' },
        { day: 'Wednesday', time: '', subject: '', class: '' },
        { day: 'Thursday', time: '', subject: '', class: '' }
      ],
      certificates: []
    };
  }

  get filteredTeachers() {
    if (!this.searchQuery.trim()) return this.teachers;
    const q = this.searchQuery.toLowerCase();
    return this.teachers.filter(t => t.name.toLowerCase().includes(q) || t.no.toString().includes(q));
  }

  addNewTeacher() {
    this.selectedTeacher = this.getNewTeacherTemplate();
    this.selectedTeacher.no = this.teachers.length + 1;
    this.isAddMode = true;
    this.isEditMode = true;
    this.viewMode = 'profile';
    this.buildGroupedSchedule();
  }

  selectTeacher(teacher: any) {
    this.selectedTeacher = JSON.parse(JSON.stringify(teacher));
    this.isAddMode = false;
    this.isEditMode = false;
    this.viewMode = 'profile';
    this.buildGroupedSchedule();
  }

  buildGroupedSchedule() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    this.groupedSchedule = days.map(dayName => {
      return {
        day: dayName,
        slots: this.selectedTeacher.schedule.filter((s: any) => s.day === dayName)
      };
    });
  }

  addSlot(dayName: string) {
    this.selectedTeacher.schedule.push({ day: dayName, time: '', subject: '', class: '' });

    // Force setter to trigger a save to session storage
    this.selectedTeacher = this.selectedTeacher;
    this.buildGroupedSchedule();
  }

  removeSlot(slot: any) {
    const idx = this.selectedTeacher.schedule.indexOf(slot);
    if (idx > -1) {
      this.selectedTeacher.schedule.splice(idx, 1);

      // Force setter to trigger a save to session storage
      this.selectedTeacher = this.selectedTeacher;
      this.buildGroupedSchedule();
    }
  }

  toggleScheduleDropdown(slot: any) {
    if (!this.isEditMode) return;
    this.openScheduleDropdownSlot = this.openScheduleDropdownSlot === slot ? null : slot;
    this.showSubjectDropdown = false;
  }

  selectScheduleSubject(slot: any, subjectName: string) {
    slot.subject = subjectName;
    this.selectedTeacher = this.selectedTeacher; // Save state
    this.openScheduleDropdownSlot = null;
  }

  closeAllDropdowns() {
    this.showSubjectDropdown = false;
    this.openScheduleDropdownSlot = null;
  }

  toggleSubjectSelection(subjectName: string) {
    if (!this.isEditMode) return;
    const idx = this.selectedTeacher.assignedSubjectsArray.indexOf(subjectName);
    if (idx > -1) {
      this.selectedTeacher.assignedSubjectsArray.splice(idx, 1);
    } else {
      this.selectedTeacher.assignedSubjectsArray.push(subjectName);
    }
    this.selectedTeacher = this.selectedTeacher; // Save state
  }

  removeSubject(subjectName: string, event: Event) {
    event.stopPropagation();
    if (!this.isEditMode) return;
    this.selectedTeacher.assignedSubjectsArray = this.selectedTeacher.assignedSubjectsArray.filter((s: string) => s !== subjectName);
    this.selectedTeacher = this.selectedTeacher; // Save state
  }

  saveData() {
    if (!this.selectedTeacher.dbId) {
      alert("Teacher must be registered through Auth Portal first!");
      return;
    }

    const payload = {
      fullName: this.selectedTeacher.name,
      phone: this.selectedTeacher.phone,
      assignedSubjects: this.selectedTeacher.assignedSubjectsArray.join(','),
      summary: this.selectedTeacher.summary,
      hardSkills: this.selectedTeacher.hardSkills,
      softSkills: this.selectedTeacher.softSkills,
      philosophy: this.selectedTeacher.philosophy,
      scheduleJson: JSON.stringify(this.selectedTeacher.schedule),
      certificatesJson: JSON.stringify(this.selectedTeacher.certificates)
    };

    this.authService.adminUpdateTeacher(this.selectedTeacher.dbId, payload).subscribe({
      next: () => {
        alert('Teacher Profile Saved Successfully!');
        this.isEditMode = false;
        this.isAddMode = false;
        this.loadTeachers();
      },
      error: () => alert('Failed to save teacher details.')
    });
  }

  goBack() {
    if (this.viewMode !== 'list') {
      this.viewMode = 'list';
      this.isEditMode = false;
      this.closeAllDropdowns();
    } else {
      this.location.back();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedTeacher.certificates.push({
          name: file.name.split('.')[0],
          date: new Date().toLocaleDateString(),
          fileName: file.name,
          fileUrl: e.target.result
        });
        this.selectedTeacher = this.selectedTeacher; // Save state
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  downloadFile(cert: any) {
    if (cert.fileUrl) {
      const a = document.createElement('a');
      a.href = cert.fileUrl;
      a.download = cert.fileName;
      a.click();
    } else {
      alert("No file available for download.");
    }
  }
}
