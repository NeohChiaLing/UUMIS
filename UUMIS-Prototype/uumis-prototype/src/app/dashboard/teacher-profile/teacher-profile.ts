import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-profile.html',
  styles: []
})
export class TeacherProfileComponent implements OnInit {

  viewMode: 'profile' | 'teaching' | 'schedule' | 'certs' = 'profile';
  isEditMode: boolean = false;
  currentUser: any = null;

  selectedTeacher: any = {
    dbId: null, name: '', assignedSubjectsArray: [], assignedClassesArray: [],
    phone: '', email: '', linkedIn: '',
    summary: '', hardSkills: '', softSkills: '', philosophy: '',
    schedule: [
      { day: 'Sunday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' },
      { day: 'Monday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' },
      { day: 'Tuesday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' },
      { day: 'Wednesday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' },
      { day: 'Thursday', startHour: '08:00', startAmPm: 'AM', endHour: '09:00', endAmPm: 'AM', subject: '', class: '' }
    ],
    certificates: []
  };

  groupedSchedule: any[] = [];
  openScheduleDropdownSlot: any = null;

  constructor(private authService: AuthService, private location: Location) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) return;

    this.authService.getTeachers().subscribe({
      next: (teachers: any[]) => {
        const myFreshProfile = teachers.find(t => t.username === this.currentUser.username || (t.email && t.email === this.currentUser.email));

        if (myFreshProfile) {
          const bio = myFreshProfile.bio || '';
          const classList = bio && bio !== 'Unassigned'
            ? bio.split(',').map((c: string) => c.trim())
            : [];

          const assignedSubjRaw = myFreshProfile.assignedSubjects || myFreshProfile.assigned_subjects || '';
          const schedRaw = myFreshProfile.scheduleJson || myFreshProfile.schedule_json;
          const certsRaw = myFreshProfile.certificatesJson || myFreshProfile.certificates_json;

          let parsedSchedule = this.selectedTeacher.schedule;
          if (schedRaw) {
            const temp = JSON.parse(schedRaw);
            parsedSchedule = temp.map((s:any) => ({
              day: s.day,
              startHour: s.startHour || '08:00', startAmPm: s.startAmPm || 'AM',
              endHour: s.endHour || '09:00', endAmPm: s.endAmPm || 'AM',
              subject: s.subject || '', class: s.class || ''
            }));
          }

          this.selectedTeacher = {
            dbId: myFreshProfile.id,
            name: myFreshProfile.full_name || myFreshProfile.fullName || myFreshProfile.username,
            email: myFreshProfile.email || '',
            phone: myFreshProfile.phone || '',
            assignedSubjectsArray: assignedSubjRaw ? assignedSubjRaw.split(',').map((s: string) => s.trim()) : [],
            assignedClassesArray: classList,
            summary: myFreshProfile.summary || '',
            hardSkills: myFreshProfile.hardSkills || myFreshProfile.hard_skills || '',
            softSkills: myFreshProfile.softSkills || myFreshProfile.soft_skills || '',
            philosophy: myFreshProfile.philosophy || '',
            schedule: parsedSchedule,
            certificates: certsRaw ? JSON.parse(certsRaw) : []
          };

          this.buildGroupedSchedule();
        }
      }
    });
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
    this.buildGroupedSchedule();
  }

  removeSlot(slot: any) {
    const idx = this.selectedTeacher.schedule.indexOf(slot);
    if (idx > -1) {
      this.selectedTeacher.schedule.splice(idx, 1);
      this.buildGroupedSchedule();
    }
  }

  toggleScheduleDropdown(slot: any) {
    if (!this.isEditMode) return;
    this.openScheduleDropdownSlot = this.openScheduleDropdownSlot === slot ? null : slot;
  }

  selectScheduleSubject(slot: any, subjectName: string) {
    slot.subject = subjectName;
    this.openScheduleDropdownSlot = null;
  }

  closeAllDropdowns() {
    this.openScheduleDropdownSlot = null;
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
    if (!this.selectedTeacher.dbId) return;

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
        alert('Your Profile Updates have been saved!');
        this.isEditMode = false;
      },
      error: () => alert('Failed to save profile details. Check connection.')
    });
  }

  goBack() {
    this.location.back();
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
    }
  }
}
