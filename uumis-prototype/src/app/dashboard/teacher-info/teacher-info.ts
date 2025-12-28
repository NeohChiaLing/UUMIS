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
  viewMode: 'list' | 'profile' | 'teaching' | 'schedule' | 'certs' = 'list';
  searchQuery: string = '';
  isEditMode: boolean = false;
  isAddMode: boolean = false;

  // 权限控制变量
  isAdmin: boolean = false;
  isTeacher: boolean = false;

  teachers = [
    { no: 1, name: 'Neoh Chia Ling', subject: 'Information Technology' },
    { no: 2, name: 'Dr. Sarah Smith', subject: 'Science' }
  ];

  selectedTeacher: any = this.getNewTeacherTemplate();

  constructor(private authService: AuthService, private router: Router, private location: Location) {}

  ngOnInit() {
    this.userRole = this.authService.getRole();
    // 修复：确保 role 匹配正确 (转换为小写比较，更安全)
    const role = this.userRole ? this.userRole.toLowerCase() : '';

    this.isAdmin = role === 'admin';
    this.isTeacher = role === 'teacher';
  }

  // --- 这里的 HTML 需要用到的检查方法 ---
  // 原有的 canEditAll 逻辑保留给 Admin 添加新老师
  get canAddTeacher() {
    return this.isAdmin;
  }

  // 是否显示 Edit 按钮：Admin 可以，或者 Teacher 编辑自己
  get canEditProfile() {
    return this.isAdmin || this.isTeacher;
  }

  getNewTeacherTemplate() {
    return {
      no: null, name: '', subject: '',
      phone: '', email: '', website: '', linkedIn: '', emergencyContact: '',
      summary: '', education: '', experience: '',
      hardSkills: '', softSkills: '',
      philosophy: '', achievements: '', professionalDev: '',
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
  }

  selectTeacher(teacher: any) {
    this.selectedTeacher = {
      ...this.getNewTeacherTemplate(),
      ...teacher,
      phone: '012-4445556',
      email: 'neoh_cl@uumis.edu.my',
      summary: 'Experienced IT educator specializing in Angular and UI/UX design.',
      hardSkills: 'Angular, Java, Docker, SQL',
      softSkills: 'Leadership, Adaptability, Empathy',
      philosophy: 'Engaging students through hands-on project-based learning.',
      certificates: [{ name: 'AWS Cloud Practitioner', date: '2025-05-20', fileName: 'aws.pdf' }]
    };
    this.isAddMode = false;
    this.isEditMode = false;
    this.viewMode = 'profile';
  }

  saveData() {
    if (this.isAddMode) {
      this.teachers.push({
        no: this.selectedTeacher.no,
        name: this.selectedTeacher.name,
        subject: this.selectedTeacher.subject
      });
    } else {
      const idx = this.teachers.findIndex(t => t.no === this.selectedTeacher.no);
      if (idx !== -1) {
        this.teachers[idx].name = this.selectedTeacher.name;
        this.teachers[idx].subject = this.selectedTeacher.subject;
      }
    }
    alert('Teacher Profile Saved Successfully!');
    this.isEditMode = false;
    this.isAddMode = false;
  }

  goBack() {
    if (this.viewMode !== 'list') {
      this.viewMode = 'list';
      this.isEditMode = false;
    } else {
      this.location.back();
    }
  }

  triggerFileUpload() { document.getElementById('certUpload')?.click(); }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedTeacher.certificates.push({
        name: file.name.split('.')[0],
        date: new Date().toLocaleDateString(),
        fileName: file.name
      });
    }
  }

  downloadFile(fileName: string) {
    const blob = new Blob(["Simulated content"], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    window.URL.revokeObjectURL(url);
  }
}
