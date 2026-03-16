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

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.loadRealUser();
  }

  loadRealUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const storedUser = JSON.parse(userStr);
      this.user = {
        id: storedUser.id,
        // Fallbacks added so Admin/New users don't have blank profiles!
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
        // ====================================================
        // THE FIX: SAFE MERGE TO PROTECT LOCAL STORAGE
        // ====================================================
        const existingUserStr = localStorage.getItem('user');
        let updatedUser = res.user;

        if (existingUserStr) {
          const existingUser = JSON.parse(existingUserStr);
          // Blend the old secure data (like role) with the newly saved data
          updatedUser = { ...existingUser, ...res.user };

          // Absolute guarantee the role is never wiped!
          if (!updatedUser.role) {
            updatedUser.role = existingUser.role;
          }
        }

        localStorage.setItem('user', JSON.stringify(updatedUser));
        // ====================================================

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
    if (this.isEditMode) {
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
