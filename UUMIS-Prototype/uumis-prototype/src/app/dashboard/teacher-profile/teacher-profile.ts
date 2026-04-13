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
      { day: 'Sunday', time: '', subject: '', class: '' },
      { day: 'Monday', time: '', subject: '', class: '' },
      { day: 'Tuesday', time: '', subject: '', class: '' },
      { day: 'Wednesday', time: '', subject: '', class: '' },
      { day: 'Thursday', time: '', subject: '', class: '' }
    ],
    certificates: []
  };

  groupedSchedule: any[] = [];
  openScheduleDropdownSlot: any = null;

  constructor(private authService: AuthService, private location: Location) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) return;

    this.authService.getUsers().subscribe({
      next: (users: any[]) => {
        const myFreshProfile = users.find(u => u.id === this.currentUser.id || (u.email && u.email === this.currentUser.email));

        if (myFreshProfile) {
          // --- NEW: Parse Multiple Classes ---
          const classArray = myFreshProfile.bio && myFreshProfile.bio !== 'Unassigned'
            ? myFreshProfile.bio.split(',').map((c: string) => c.trim())
            : [];

          this.selectedTeacher = {
            dbId: myFreshProfile.id,
            name: myFreshProfile.fullName || myFreshProfile.username,
            email: myFreshProfile.email || '',
            phone: myFreshProfile.phone || '',
            assignedSubjectsArray: myFreshProfile.assignedSubjects ? myFreshProfile.assignedSubjects.split(',').map((s: string) => s.trim()) : [],
            assignedClassesArray: classArray, // Save multi-class array
            summary: myFreshProfile.summary || '',
            hardSkills: myFreshProfile.hardSkills || '',
            softSkills: myFreshProfile.softSkills || '',
            philosophy: myFreshProfile.philosophy || '',
            schedule: myFreshProfile.scheduleJson ? JSON.parse(myFreshProfile.scheduleJson) : this.selectedTeacher.schedule,
            certificates: myFreshProfile.certificatesJson ? JSON.parse(myFreshProfile.certificatesJson) : []
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
    this.selectedTeacher.schedule.push({ day: dayName, time: '', subject: '', class: '' });
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

  saveData() {
    if (!this.selectedTeacher.dbId) return;

    // Send the array back joined as a string
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
    } else {
      alert("No file available for download.");
    }
  }
}
