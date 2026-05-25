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

  // THE FIX: New dynamic error message state to display on the UI instead of browser alerts
  errorMessage: string = '';

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
  switchView(view: AuthView) {
    this.currentView = view;
    this.errorMessage = ''; // Clear error message when navigating
  }

  goHome() { this.router.navigate(['/home']); }

  // --- 1. LOGIN ---
  onLogin() {
    this.errorMessage = ''; // Reset error state

    const credentials = {username: this.username, password: this.password};

    this.authService.login(credentials).subscribe({
      next: (res: any) => {

        // Save user to local storage
        localStorage.setItem('user', JSON.stringify(res.user));

        // --- NEW ROLE-BASED ROUTING ---
        const userRole = res.user.role ? res.user.role.toLowerCase().trim() : 'student';

        // Route specific managers to the Staff portal where their tools are!
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
        // Render the exact error message from Spring Boot / Node onto the UI
        this.errorMessage = err.error?.message || "Login failed. Please check your credentials.";
      }
    });
  }

  // --- 2. FORGOT PASSWORD ---
  onVerifyEmail() {
    this.errorMessage = ''; // Reset error state

    if(!this.forgotData.email) {
      this.errorMessage = "Please enter your registered email or username.";
      return;
    }

    this.authService.forgotPassword(this.forgotData.email).subscribe({
      next: (res) => {
        this.modalType = 'email-sent';
        this.showSuccessMessage = true;
      },
      error: (err) => {
        // Render the "Account not approved or found" error dynamically onto the UI
        this.errorMessage = err.error?.message || "Email not found or account is not approved yet.";
      }
    });
  }

  // --- 3. RESET PASSWORD ---
  onResetPassword() {
    this.errorMessage = ''; // Reset error state

    // 1. Check Code
    if (!this.resetData.code) {
      this.errorMessage = "Please enter the verification code.";
      return;
    }

    // 2. Validate Password
    if (!this.isLengthValid || !this.hasUppercase || !this.hasNumber || !this.hasSymbol) {
      this.errorMessage = "Password does not meet the security requirements.";
      return;
    }
    if(this.resetData.newPassword !== this.resetData.confirmNewPassword) {
      this.errorMessage = "Passwords do not match!";
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
      error: (err) => {
        this.errorMessage = err.error?.message || "Password reset failed. Please try again.";
      }
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
