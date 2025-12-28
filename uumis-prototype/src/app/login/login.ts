import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Define the possible views
type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  // Current active view
  currentView: AuthView = 'login'; // 方便测试，暂时改成 reset-password, 之后改回 login

  // UI States (Login/Register)
  showPassword = false;
  showSuccessMessage = false;
  modalType: 'register-success' | 'email-sent' = 'register-success';

  // UI States (Reset Password - 独立的眼睛控制)
  showResetPass = false;
  showConfirmResetPass = false;

  // Data Models
  username = '';
  password = '';

  registerData = {
    role: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  forgotData = {
    email: ''
  };

  resetData = {
    newPassword: '',
    confirmNewPassword: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  // --- Real-time Password Validation Getters ---
  // 这些函数会随着 resetData.newPassword 的变化自动更新结果
  get isLengthValid(): boolean {
    return this.resetData.newPassword.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.resetData.newPassword);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.resetData.newPassword);
  }

  get hasSymbol(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.resetData.newPassword);
  }

  // --- Navigation Helpers ---
  switchView(view: AuthView) {
    this.currentView = view;
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  // --- Logic: Login ---
  onLogin() {
    const role = this.authService.login(this.username, this.password);
    if (role) {
      switch (role) {
        case 'admin': this.router.navigate(['/dashboard/admin']); break;
        case 'student': this.router.navigate(['/dashboard/student']); break;
        case 'teacher': this.router.navigate(['/dashboard/teacher']); break;
        case 'staff': this.router.navigate(['/dashboard/staff']); break;
        case 'parent': this.router.navigate(['/dashboard/parent']); break;
        default: this.router.navigate(['/']);
      }
    } else {
      alert('Invalid credentials! Please try again.');
    }
  }

  // --- Logic: Register ---
  onRegister() {
    console.log('Registering:', this.registerData);
    this.modalType = 'register-success';
    this.showSuccessMessage = true;
  }

  // --- Logic: Forgot Password ---
  onVerifyEmail() {
    if(!this.forgotData.email) {
      alert("Please enter your email.");
      return;
    }
    console.log('Sending verification to:', this.forgotData.email);
    this.modalType = 'email-sent';
    this.showSuccessMessage = true;
  }

  // --- Logic: Reset Password ---
  onResetPassword() {
    // Check all requirements before submitting
    if (!this.isLengthValid || !this.hasUppercase || !this.hasNumber || !this.hasSymbol) {
      alert("Password does not meet requirements.");
      return;
    }

    if(this.resetData.newPassword !== this.resetData.confirmNewPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log('Resetting password...');
    alert("Password successfully reset! Please login.");
    this.switchView('login');
  }

  closeSuccessModal() {
    this.showSuccessMessage = false;
    if (this.modalType === 'register-success') {
      this.switchView('login');
    } else if (this.modalType === 'email-sent') {
      this.switchView('reset-password');
    }
  }
}
