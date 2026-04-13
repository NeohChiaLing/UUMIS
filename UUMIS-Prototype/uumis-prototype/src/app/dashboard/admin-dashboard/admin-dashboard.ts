import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {

  lang = { text: { sidebar: {
        dashboard: 'Dashboard', management: 'Management', students: 'Students',
        teachers: 'Teachers', foodOrdering: 'Food Ordering', academic: 'Academic',
        subjects: 'Subjects', schedule: 'Schedule', lessonPlan: 'Lesson Plan',
        assignments: 'Assignments', grading: 'Grading', attendance: 'Attendance',
        administration: 'Administration', inventory: 'Inventory', financial: 'Financial',
        payment: 'Payment', refund: 'Refund', discount: 'Discount', wallet: 'Wallet',
        notifications: 'Notifications', settings: 'Settings', logout: 'Logout'
      }}};

  isAcademicOpen = false;
  isFinancialOpen = false;
  showDashboardContent = true;

  totalStudents: number = 0;

  // --- ATTENDANCE VARIABLES ---
  selectedAttMonth: string = 'All';
  selectedAttYear: string = '2026';
  allAttendanceData: any[] = [];

  totalPresent: number = 0;
  totalAbsent: number = 0;
  attRate: string = '0'; // Default to 0%

  // --- FINANCIAL VARIABLES ---
  selectedFinMonth: string = 'All';
  selectedFinYear: string = '2026';
  allPayments: any[] = [];
  allRefunds: any[] = [];

  totalPayments: number = 0;
  totalRefunds: number = 0;
  netRevenue: number = 0;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getUsers().subscribe({
      next: (users: any[]) => {
        this.totalStudents = users.filter(u => u.role.toLowerCase() === 'student').length;
      },
      error: () => console.log('Failed to fetch user count')
    });

    this.fetchAttendanceData();
    this.fetchFinancialData();
  }

  toggleAcademic() { this.isAcademicOpen = !this.isAcademicOpen; }
  toggleFinancialMenu() { this.isFinancialOpen = !this.isFinancialOpen; }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
// ==========================================
  // YEAR-END BATCH PROMOTION
  // ==========================================
  runYearEndPromotion() {
    const confirmation = confirm("⚠️ CRITICAL ACTION: Are you sure you want to run the Year-End Promotion? This will instantly advance all active students to the next grade level.");

    if (confirmation) {
      this.authService.promoteAllStudents().subscribe({
        next: (res: any) => {
          alert(res.message);
          window.location.reload(); // Refresh to see the new data
        },
        error: (err) => alert('Failed to promote students. Ensure your backend is running.')
      });
    }
  }
  // ==========================================
  // BULLETPROOF ARRAY EXTRACTOR
  // Handles whatever format Spring Boot throws at us
  // ==========================================
  private extractArray(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.content) return res.content;
    if (res.data) return res.data;
    if (res.body) return res.body;
    if (res._embedded) {
      const keys = Object.keys(res._embedded);
      if (keys.length > 0) return res._embedded[keys[0]];
    }
    return [];
  }

  // ==========================================
  // BULLETPROOF DATE PARSER
  // ==========================================
  private parseDate(dateStr: string): { year: string, month: string } {
    if (!dateStr) return { year: '', month: '' };

    // Handles database format "2026-03-03" directly
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) return { year: parts[0], month: parts[1] };
    }

    // Fallback format
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return {
        year: d.getFullYear().toString(),
        month: ('0' + (d.getMonth() + 1)).slice(-2)
      };
    }
    return { year: '', month: '' };
  }

  // ==========================================
  // DYNAMIC ATTENDANCE LOGIC
  // ==========================================
  fetchAttendanceData() {
    this.authService.getAllAttendance().subscribe({
      next: (res: any) => {
        this.allAttendanceData = this.extractArray(res);
        console.log("✅ RAW ATTENDANCE LOADED:", this.allAttendanceData); // <--- Check Console (F12)
        this.calculateAttendance();
      },
      error: (err) => console.log('❌ Error fetching overall attendance:', err)
    });
  }

  calculateAttendance() {
    this.totalPresent = 0;
    this.totalAbsent = 0;

    this.allAttendanceData.forEach(record => {
      const { year, month } = this.parseDate(record.date);

      const yearMatch = (this.selectedAttYear === 'All' || this.selectedAttYear === year);
      const monthMatch = (this.selectedAttMonth === 'All' || this.selectedAttMonth === month);

      if (yearMatch && monthMatch && record.status) {
        const stat = record.status.trim().toUpperCase();
        if (stat === 'PRESENT') {
          this.totalPresent++;
        } else if (stat === 'ABSENT') {
          this.totalAbsent++;
        }
      }
    });

    const totalRecords = this.totalPresent + this.totalAbsent;
    if (totalRecords > 0) {
      this.attRate = ((this.totalPresent / totalRecords) * 100).toFixed(0);
    } else {
      this.attRate = '0';
    }
  }

  // ==========================================
  // DYNAMIC FINANCIAL LOGIC
  // ==========================================
  fetchFinancialData() {
    this.authService.getAllPayments().subscribe({
      next: (res: any) => {
        this.allPayments = this.extractArray(res);
        console.log("✅ RAW PAYMENTS LOADED:", this.allPayments); // <--- Check Console (F12)
        this.calculateFinance();
      },
      error: (err) => console.log('❌ Error fetching payments:', err)
    });

    this.authService.getAllRefundRequests().subscribe({
      next: (res: any) => {
        this.allRefunds = this.extractArray(res);
        console.log("✅ RAW REFUNDS LOADED:", this.allRefunds); // <--- Check Console (F12)
        this.calculateFinance();
      },
      error: (err) => console.log('❌ Error fetching refunds:', err)
    });
  }

  calculateFinance() {
    this.totalPayments = 0;
    this.totalRefunds = 0;

    // Loop Payments
    this.allPayments.forEach(payment => {
      const { year, month } = this.parseDate(payment.date);
      const yearMatch = (this.selectedFinYear === 'All' || this.selectedFinYear === year);
      const monthMatch = (this.selectedFinMonth === 'All' || this.selectedFinMonth === month);

      if (yearMatch && monthMatch && payment.status) {
        const stat = payment.status.trim().toUpperCase();
        if (stat === 'COMPLETED' || stat === 'SUCCESSFUL' || stat === 'PAID') {
          this.totalPayments += Number(payment.amount || 0);
        }
      }
    });

    // Loop Refunds
    this.allRefunds.forEach(refund => {
      const { year, month } = this.parseDate(refund.date);
      const yearMatch = (this.selectedFinYear === 'All' || this.selectedFinYear === year);
      const monthMatch = (this.selectedFinMonth === 'All' || this.selectedFinMonth === month);

      if (yearMatch && monthMatch && refund.status) {
        const stat = refund.status.trim().toUpperCase();
        if (stat === 'APPROVED') {
          this.totalRefunds += Number(refund.amount || 0);
        }
      }
    });

    this.netRevenue = this.totalPayments - this.totalRefunds;
  }
}
