import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  isStudent: boolean = false;

  constructor(
    private location: Location,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRealUser();
  }

  loadRealUser() {
    // 1. 从 AuthService 获取当前已登录的用户对象，而不是直接读写 localStorage，
    // 因为 AuthService 通常处理了登录后的最新状态同步。
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      const rawRole = currentUser.role ? currentUser.role.toLowerCase().trim() : '';
      this.isStudent = rawRole === 'student';

      // 2. 使用 JSON Unpacking 引擎解析当前登录用户的资料
      let profileData: any = {};
      const rawJson = currentUser.profileJson || currentUser.profile_json;
      if (rawJson) {
        try {
          profileData = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
        } catch(e) { console.error("Profile JSON 解析错误", e); }
      }

      // 3. 构建显示名：优先级为 firstName+lastName > fullName > username
      let displayName = currentUser.fullName || currentUser.full_name || currentUser.username || 'System User';
      if (profileData.firstName || profileData.lastName || profileData.familyName) {
        const fName = profileData.firstName || '';
        const mName = profileData.middleName || '';
        const lName = profileData.lastName || profileData.familyName || '';
        displayName = [fName, mName, lName].filter(Boolean).join(' ');
      }

      // 4. 赋值给 user 对象，确保界面渲染的是当前登录老师的信息
      this.user = {
        id: currentUser.id,
        name: displayName,
        role: currentUser.role || 'Standard',
        email: currentUser.email || 'No email provided',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        location: 'UUMIS Campus',
        initials: this.getInitials(displayName),
        avatarUrl: currentUser.avatar || null
      };
    } else {
      // 如果没有用户信息，跳转回登录页
      this.router.navigate(['/login']);
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
        // 更新本地缓存以保持同步
        const currentUser = this.authService.getCurrentUser();
        const updatedUser = { ...currentUser, ...res.user, fullName: this.user.name, full_name: this.user.name };

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
