import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-profile.html',
  styles: []
})
export class AdminProfileComponent implements OnInit {

  viewMode: 'profile' | 'skills' | 'certs' = 'profile';
  isEditMode: boolean = false;
  currentUser: any = null;

  selectedAdmin: any = {
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

    // Fetch fresh data from DB
    this.authService.getUsers().subscribe({
      next: (users: any[]) => {
        const myFreshProfile = users.find(u => u.id === this.currentUser.id || (u.email && u.email === this.currentUser.email));

        if (myFreshProfile) {
          this.selectedAdmin = {
            dbId: myFreshProfile.id,
            name: myFreshProfile.fullName || myFreshProfile.username,
            role: myFreshProfile.role || 'Administrator',
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
    if (!this.selectedAdmin.dbId) return;

    const payload = {
      fullName: this.selectedAdmin.name,
      phone: this.selectedAdmin.phone,
      summary: this.selectedAdmin.summary,
      hardSkills: this.selectedAdmin.hardSkills,
      softSkills: this.selectedAdmin.softSkills,
      certificatesJson: JSON.stringify(this.selectedAdmin.certificates)
    };

    // We can reuse this endpoint since it updates the generic User fields in the DB!
    this.authService.adminUpdateTeacher(this.selectedAdmin.dbId, payload).subscribe({
      next: () => {
        alert('Your Admin Profile Updates have been saved!');
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
        this.selectedAdmin.certificates.push({
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
