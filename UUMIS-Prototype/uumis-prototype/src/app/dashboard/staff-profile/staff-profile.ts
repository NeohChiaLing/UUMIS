import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-profile.html',
  styles: []
})
export class StaffProfileComponent implements OnInit {

  viewMode: 'profile' | 'skills' | 'certs' = 'profile';
  isEditMode: boolean = false;
  currentUser: any = null;

  selectedStaff: any = {
    dbId: null,
    name: '',
    role: '',
    phone: '',
    email: '',
    linkedIn: '',
    summary: '',
    hardSkills: '',
    softSkills: '',
    certificates: []
  };

  constructor(private authService: AuthService, private location: Location) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) return;

    this.authService.getUsers().subscribe({
      next: (users: any[]) => {
        const myFreshProfile = users.find(u => u.id === this.currentUser.id || (u.email && u.email === this.currentUser.email));

        if (myFreshProfile) {
          this.selectedStaff = {
            dbId: myFreshProfile.id,
            name: myFreshProfile.fullName || myFreshProfile.username,
            role: myFreshProfile.role || 'Staff',
            email: myFreshProfile.email || '',
            phone: myFreshProfile.phone || '',
            summary: myFreshProfile.summary || '',
            hardSkills: myFreshProfile.hardSkills || '',
            softSkills: myFreshProfile.softSkills || '',
            certificates: myFreshProfile.certificatesJson ? JSON.parse(myFreshProfile.certificatesJson) : []
          };
        }
      }
    });
  }

  saveData() {
    if (!this.selectedStaff.dbId) return;

    const payload = {
      fullName: this.selectedStaff.name,
      phone: this.selectedStaff.phone,
      summary: this.selectedStaff.summary,
      hardSkills: this.selectedStaff.hardSkills,
      softSkills: this.selectedStaff.softSkills,
      certificatesJson: JSON.stringify(this.selectedStaff.certificates)
    };

    // Utilizing the flexible backend endpoint
    this.authService.adminUpdateTeacher(this.selectedStaff.dbId, payload).subscribe({
      next: () => {
        alert('Your Staff Profile Updates have been saved!');
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
        this.selectedStaff.certificates.push({
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
