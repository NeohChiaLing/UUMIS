import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

type AuthView = 'login' | 'forgot-password' | 'reset-password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  currentView: AuthView = 'login';

  // UI States
  showPassword = false;
  showSuccessMessage = false;
  modalType: 'email-sent' = 'email-sent';
  showResetPass = false;
  showConfirmResetPass = false;

  // Data Models
  username = '';
  password = '';

  forgotData = {
    email: ''
  };

  resetData = {
    code: '',
    newPassword: '',
    confirmNewPassword: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  // --- Getters ---
  get isLengthValid(): boolean { return this.resetData.newPassword.length >= 8; }
  get hasUppercase(): boolean { return /[A-Z]/.test(this.resetData.newPassword); }
  get hasNumber(): boolean { return /\d/.test(this.resetData.newPassword); }
  get hasSymbol(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.resetData.newPassword); }

  // --- Navigation ---
  switchView(view: AuthView) { this.currentView = view; }
  goHome() { this.router.navigate(['/home']); }

  // --- 1. LOGIN ---
  onLogin() {
    const credentials = {username: this.username, password: this.password};

    this.authService.login(credentials).subscribe({
      next: (res: any) => {

        // Save user to local storage
        localStorage.setItem('user', JSON.stringify(res.user));

        // --- NEW ROLE-BASED ROUTING ---
        const userRole = res.user.role ? res.user.role.toLowerCase().trim() : 'student';

        // THE FIX: Route specific managers to the Staff portal where their tools are!
        if (userRole === 'admin') {
          this.router.navigate(['/dashboard/admin']);
        } else if (userRole === 'staff' || userRole === 'financial_manager' || userRole === 'register_manager') {
          this.router.navigate(['/dashboard/staff']);
        } else if (userRole === 'teacher') {
          this.router.navigate(['/dashboard/teacher']);
        } else if (userRole === 'parent') {
          this.router.navigate(['/dashboard/parent']);
        } else {
          this.router.navigate(['/dashboard/student']);
        }

      },
      error: (err) => {
        alert("Login failed: " + err.error.message);
      }
    });
  }

  // --- 2. FORGOT PASSWORD ---
  onVerifyEmail() {
    if(!this.forgotData.email) return;
    this.authService.forgotPassword(this.forgotData.email).subscribe({
      next: (res) => {
        this.modalType = 'email-sent';
        this.showSuccessMessage = true;
      },
      error: (err) => alert("User not found")
    });
  }

  // --- 3. RESET PASSWORD ---
  onResetPassword() {
    // 1. Check Code
    if (!this.resetData.code) {
      alert("Please enter the verification code.");
      return;
    }

    // 2. Validate Password
    if (!this.isLengthValid || !this.hasUppercase || !this.hasNumber || !this.hasSymbol) {
      alert("Password does not meet requirements.");
      return;
    }
    if(this.resetData.newPassword !== this.resetData.confirmNewPassword) {
      alert("Passwords do not match!");
      return;
    }

    // 3. Send to Backend
    const payload = {
      email: this.forgotData.email,
      code: this.resetData.code,
      newPassword: this.resetData.newPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: (res) => {
        alert("Password reset successful! Please login.");
        this.switchView('login');
      },
      error: (err) => alert(err.error.message || "Reset failed")
    });
  }

  proceedToReset() {
    if (!this.resetData.code) {
      alert("Please enter the verification code from your email.");
      return;
    }
    // Code entered successfully, close modal and go to next step
    this.showSuccessMessage = false;
    this.switchView('reset-password');
  }

  closeSuccessModal() {
    this.showSuccessMessage = false;
  }
}
