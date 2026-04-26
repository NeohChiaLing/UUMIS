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

  academicLevels = ['Kindergarten', 'Primary', 'Lower Secondary', 'Upper Secondary'];

  tempLevel: string = '';
  tempYear: string = '';

  getYearsForLevel(level: string): string[] {
    if (level === 'Kindergarten') return ['Pre-Kindergarten', 'Kindergarten'];
    if (level === 'Primary') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    if (level === 'Lower Secondary') return ['Year 7', 'Year 8', 'Year 9'];
    if (level === 'Upper Secondary') return ['Year 10', 'Year 11'];
    return [];
  }

  get filteredSubjectsForTeacher() {
    if (!this.selectedTeacher.assignedClassesArray || this.selectedTeacher.assignedClassesArray.length === 0) {
      return [];
    }
    return this.availableSubjects.filter(s => {
      const subjLevel = (s.level || '').trim().toLowerCase();
      const subjYear = (s.yearGroup || s.year_group || '').trim().toLowerCase();

      return this.selectedTeacher.assignedClassesArray.some((c: string) => {
        const parts = c.includes(' - ') ? c.split(' - ') : c.split('-');
        const cLevel = (parts[0] || '').trim().toLowerCase();
        const cYear = (parts.length > 1 ? parts[1] : parts[0]).trim().toLowerCase();
        return subjLevel === cLevel && subjYear === cYear;
      });
    });
  }

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

  constructor(private authService: AuthService, private router: Router, private location: Location) {}

  ngOnInit() {
    const rawRole = this.authService.getRole() || '';
    this.userRole = String(rawRole).toLowerCase().trim();

    this.isAdmin = this.userRole === 'admin';
    this.isTeacher = this.userRole === 'teacher';

    const savedMode = sessionStorage.getItem('uumis_viewMode');
    if (savedMode) this._viewMode = savedMode as any;

    const savedEdit = sessionStorage.getItem('uumis_isEditMode');
    if (savedEdit) this._isEditMode = (savedEdit === 'true');

    const savedTeacher = sessionStorage.getItem('uumis_selectedTeacher');
    if (savedTeacher) {
      try {
        this._selectedTeacher = JSON.parse(savedTeacher);
        if (this._viewMode !== 'list') {
          this.buildGroupedSchedule();
        }
      } catch(e) {}
    }

    this.loadTeachers();
    this.loadSubjects();
  }

  get canAddTeacher() { return true; }
  get canEditProfile() { return true; }

  loadTeachers() {
    this.authService.getTeachers().subscribe({
      next: (data) => {
        this.teachers = data.map((t: any, index: number) => {
          const classArray = t.bio && t.bio !== 'Unassigned' ? t.bio.split(',').map((c: string) => c.trim()) : [];

          const assignedSubjRaw = t.assignedSubjects || t.assigned_subjects || '';
          const schedRaw = t.scheduleJson || t.schedule_json;
          const certsRaw = t.certificatesJson || t.certificates_json;

          let parsedSchedule = this.getNewTeacherTemplate().schedule;
          if (schedRaw) {
            const temp = JSON.parse(schedRaw);
            parsedSchedule = temp.map((s:any) => ({
              day: s.day,
              startHour: s.startHour || '08:00', startAmPm: s.startAmPm || 'AM',
              endHour: s.endHour || '09:00', endAmPm: s.endAmPm || 'AM',
              subject: s.subject || '', class: s.class || ''
            }));
          }

          return {
            dbId: t.id,
            no: index + 1,
            name: t.full_name || t.fullName || t.username,
            phone: t.phone || '',
            email: t.email || '',
            assignedSubjectsArray: assignedSubjRaw ? assignedSubjRaw.split(',').map((s: string) => s.trim()) : [],
            assignedClassesArray: classArray,
            website: '', linkedIn: '', emergencyContact: '',
            summary: t.summary || 'Experienced educator dedicated to student success.',
            education: '', experience: '',
            hardSkills: t.hardSkills || t.hard_skills || '',
            softSkills: t.softSkills || t.soft_skills || '',
            philosophy: t.philosophy || 'Engaging students through interactive learning.',
            schedule: parsedSchedule,
            certificates: certsRaw ? JSON.parse(certsRaw) : []
          };
        });
      },
      error: () => console.log('Failed to fetch teachers')
    });
  }

  loadSubjects() {
    this.authService.getSubjects().subscribe({
      next: (data) => {
        this.availableSubjects = data;
      }
    });
  }

  getNewTeacherTemplate() {
    return {
      dbId: null, no: null, name: '', assignedSubjectsArray: [], assignedClassesArray: [],
      phone: '', email: '', website: '', linkedIn: '', emergencyContact: '',
      summary: '', education: '', experience: '', hardSkills: '', softSkills: '', philosophy: '',
      schedule: [
        { day: 'Sunday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' },
        { day: 'Monday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' },
        { day: 'Tuesday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' },
        { day: 'Wednesday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' },
        { day: 'Thursday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' }
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
    this.tempLevel = ''; this.tempYear = '';
    this.isAddMode = true;
    this.isEditMode = true;
    this.viewMode = 'profile';
    this.buildGroupedSchedule();
  }

  selectTeacher(teacher: any) {
    this.selectedTeacher = JSON.parse(JSON.stringify(teacher));
    this.tempLevel = ''; this.tempYear = '';
    this.isAddMode = false;
    this.isEditMode = false;
    this.viewMode = 'profile';
    this.buildGroupedSchedule();
  }

  addClass() {
    if (this.tempLevel && this.tempYear) {
      const combo = `${this.tempLevel} - ${this.tempYear}`;
      if (!this.selectedTeacher.assignedClassesArray.includes(combo)) {
        this.selectedTeacher.assignedClassesArray.push(combo);
        this.tempLevel = '';
        this.tempYear = '';
        this.selectedTeacher.assignedSubjectsArray = [];
        this.selectedTeacher = this.selectedTeacher;
      }
    }
  }

  removeClass(className: string) {
    this.selectedTeacher.assignedClassesArray = this.selectedTeacher.assignedClassesArray.filter((c: string) => c !== className);
    this.selectedTeacher.assignedSubjectsArray = [];
    this.selectedTeacher = this.selectedTeacher;
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
    this.selectedTeacher.schedule.push({ day: dayName, startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' });
    this.selectedTeacher = this.selectedTeacher;
    this.buildGroupedSchedule();
  }

  removeSlot(slot: any) {
    const idx = this.selectedTeacher.schedule.indexOf(slot);
    if (idx > -1) {
      this.selectedTeacher.schedule.splice(idx, 1);
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
    this.selectedTeacher = this.selectedTeacher;
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
    this.selectedTeacher = this.selectedTeacher;
  }

  removeSubject(subjectName: string, event: Event) {
    event.stopPropagation();
    if (!this.isEditMode) return;
    this.selectedTeacher.assignedSubjectsArray = this.selectedTeacher.assignedSubjectsArray.filter((s: string) => s !== subjectName);
    this.selectedTeacher = this.selectedTeacher;
  }

  formatTime(slot: any, field: string) {
    let val = slot[field];
    if (!val) return;
    val = val.trim();
    if (!val.includes(':')) {
      let num = parseInt(val, 10);
      if (!isNaN(num)) {
        slot[field] = `${num < 10 ? '0' + num : num}:00`;
      }
    }
  }

  saveData() {
    if (!this.selectedTeacher.dbId) {
      alert("Teacher must be registered through Auth Portal first!");
      return;
    }

    const combinedBio = this.selectedTeacher.assignedClassesArray.length > 0
      ? this.selectedTeacher.assignedClassesArray.join(', ')
      : 'Unassigned';

    const payload = {
      fullName: this.selectedTeacher.name,
      phone: this.selectedTeacher.phone,
      bio: combinedBio,
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
        this.selectedTeacher = this.selectedTeacher;
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
