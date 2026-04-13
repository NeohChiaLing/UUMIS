import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styles: []
})
export class UserProfileComponent implements OnInit {

  user: any = {};
  isEditMode: boolean = false;
  isStudent: boolean = false; // THE FIX: Added a flag to track if they are a student

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.loadRealUser();
  }

  loadRealUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const storedUser = JSON.parse(userStr);

      // THE FIX: Check if the user's role is exactly 'student'
      const rawRole = storedUser.role ? storedUser.role.toLowerCase().trim() : '';
      this.isStudent = rawRole === 'student';

      this.user = {
        id: storedUser.id,
        name: storedUser.fullName || storedUser.username || 'System User',
        role: storedUser.role || 'Standard',
        email: storedUser.email || 'No email provided',
        phone: storedUser.phone || '',
        bio: storedUser.bio || '',
        location: 'UUMIS Campus',
        initials: this.getInitials(storedUser.fullName || storedUser.username || 'U'),
        avatarUrl: storedUser.avatar || null
      };
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  goBack() { this.location.back(); }

  toggleEdit() {
    if (this.isEditMode) {
      this.saveProfile();
    } else {
      this.isEditMode = true;
    }
  }

  saveProfile() {
    const payload = {
      fullName: this.user.name,
      phone: this.user.phone,
      bio: this.user.bio,
      avatar: this.user.avatarUrl
    };

    this.authService.updateUser(this.user.id, payload).subscribe({
      next: (res: any) => {
        const existingUserStr = localStorage.getItem('user');
        let updatedUser = res.user;

        if (existingUserStr) {
          const existingUser = JSON.parse(existingUserStr);
          updatedUser = { ...existingUser, ...res.user };
          if (!updatedUser.role) {
            updatedUser.role = existingUser.role;
          }
        }

        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('Profile Saved Successfully!');
        this.isEditMode = false;
        this.loadRealUser();
      },
      error: (err: any) => {
        console.error(err);
        alert("Failed. Image might be too large (Max 1MB recommended).");
      }
    });
  }

  triggerFileInput() {
    // THE FIX: Prevent file input click if they are a student!
    if (this.isEditMode && !this.isStudent) {
      document.getElementById('avatarInput')?.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.avatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
