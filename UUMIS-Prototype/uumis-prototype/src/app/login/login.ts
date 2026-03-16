import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

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
  modalType: 'register-success' | 'email-sent' = 'register-success';
  showResetPass = false;
  showConfirmResetPass = false;

  // Data Models
  username = '';
  password = '';
  verificationCode = ''; // For Registration Verify

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
    // Inside your login success response:
    this.authService.login(credentials).subscribe({
      next: (res: any) => {

        // Save user to local storage
        localStorage.setItem('user', JSON.stringify(res.user));

        // --- NEW ROLE-BASED ROUTING ---
        const userRole = res.user.role ? res.user.role.toLowerCase() : 'student';

        if (userRole === 'admin') {
          this.router.navigate(['/dashboard/admin']);
        } else if (userRole === 'staff') {
          this.router.navigate(['/dashboard/staff']);
        } else if (userRole === 'teacher') {
          this.router.navigate(['/dashboard/teacher']);
        } else if (userRole === 'parent') {
          this.router.navigate(['/dashboard/parent']);
        } else {
          // Default fallback is the student portal
          this.router.navigate(['/dashboard/student']);
        }

      },
      error: (err) => {
        alert("Login failed: " + err.error.message);
      }
    });
  }

  // --- 2. REGISTER ---
  onRegister() {
    this.authService.register(this.registerData).subscribe({
      next: (res) => {
        // Show success modal
        this.modalType = 'register-success';
        this.showSuccessMessage = true;
      },
      error: (err) => {
        console.error("Registration Error:", err); // Print full error to F12 Console
        // Check different places where the error message might be
        const msg = err.error?.message || err.message || "Registration Failed";
        alert(msg);
      }
    });
  }

  // --- 3. VERIFY REGISTRATION ---
  onVerifyAccount() {
    if (!this.verificationCode) {
      alert("Please enter the code from your email.");
      return;
    }
    this.authService.verify(this.registerData.email, this.verificationCode).subscribe({
      next: (res) => {
        alert("Account Verified! You can now login.");
        this.showSuccessMessage = false;
        this.switchView('login');
      },
      error: (err) => alert(err.error.message || "Verification Failed")
    });
  }

  // --- 4. FORGOT PASSWORD ---
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

  // --- 5. RESET PASSWORD ---
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
      code: this.resetData.code, // Use the input field value
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

  // Update this function to prevent the old behavior
  closeSuccessModal() {
    this.showSuccessMessage = false;
    if (this.modalType === 'register-success') {
      // Stay here
    } else if (this.modalType === 'email-sent') {
      // Do nothing here, proceedToReset handles it now
    }
  }
}
