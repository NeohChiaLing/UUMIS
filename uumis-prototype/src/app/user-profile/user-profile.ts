import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service'; // 假设你有这个服务获取当前用户角色

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styles: []
})
export class UserProfileComponent implements OnInit {

  // 模拟当前登录用户的数据
  // 在实际应用中，这应该从 Service 或 Backend 获取
  user: any = {
    name: '',
    role: '',
    email: '',
    phone: '',
    location: 'Kedah, Malaysia',
    bio: 'Dedicated to creating a positive learning environment.',
    avatarUrl: null, // 如果为null，显示默认字母头像
    initials: ''
  };

  isEditMode: boolean = false;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    // 模拟根据角色加载不同数据
    // 注意：你需要确保 authService.getRole() 能返回当前角色
    const role = this.authService.getRole()?.toLowerCase() || 'admin';
    this.loadMockData(role);
  }

  loadMockData(role: string) {
    switch(role) {
      case 'student':
        this.user = {
          name: 'Alex Morgan', role: 'Student', email: 'alex.m@student.uumis.edu.my',
          phone: '+60 12-345 6789', initials: 'AM',
          bio: 'Year 10 Student | Science Stream',
          location: 'Penang, Malaysia'
        };
        break;
      case 'parent':
        this.user = {
          name: 'Sarah Johnson', role: 'Parent', email: 'sarah.j@gmail.com',
          phone: '+60 17-888 9999', initials: 'SJ',
          bio: 'Parent of Leo Johnson (Year 5)',
          location: 'Kuala Lumpur, Malaysia'
        };
        break;
      case 'teacher':
        this.user = {
          name: 'Neoh Chia Ling', role: 'Teacher', email: 'neoh_cl@uumis.edu.my',
          phone: '+60 12-444 5556', initials: 'TC',
          bio: 'IT & Computer Science Educator',
          location: 'Kedah, Malaysia'
        };
        break;
      case 'staff':
        this.user = {
          name: 'Staff Member', role: 'Staff', email: 'staff@uumis.edu.my',
          phone: '+60 19-222 3333', initials: 'SF',
          bio: 'Administrative Support Staff',
          location: 'Kedah, Malaysia'
        };
        break;
      case 'admin':
      default:
        this.user = {
          name: 'System Admin', role: 'Administrator', email: 'admin@uumis.edu.my',
          phone: '+60 10-111 2222', initials: 'AD',
          bio: 'System Administrator & IT Support',
          location: 'UUMIS Main Campus'
        };
        break;
    }
  }

  goBack() {
    this.location.back();
  }

  toggleEdit() {
    this.isEditMode = !this.isEditMode;
  }

  saveProfile() {
    alert('Profile Updated Successfully!');
    this.isEditMode = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.avatarUrl = e.target.result; // 预览图片
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput() {
    if (this.isEditMode) {
      document.getElementById('avatarInput')?.click();
    }
  }
}
