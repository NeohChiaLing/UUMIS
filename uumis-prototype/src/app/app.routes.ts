import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { LoginComponent } from './login/login';
import { MissionVisionComponent } from './about/mission-vision/mission-vision';
import { BoardOfGovernorsComponent } from './about/board-of-governors/board-of-governors';
import { OrganizationalStructureComponent } from './about/organizational-structure/organizational-structure';
import { HowToApplyComponent } from './admissions/how-to-apply/how-to-apply';
import { ApplicationFormComponent } from './admissions/application-form/application-form';
import { FeesComponent } from './admissions/fees/fees';
import { CalendarComponent } from './calendar/calendar/calendar';
import { ContactComponent } from './contact/contact';

// Admin Dashboards
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard';
import { StudentInfoComponent } from './dashboard/student-info/student-info';
import { TeacherInfoComponent } from './dashboard/teacher-info/teacher-info';
import { SubjectsComponent } from './dashboard/academic/subjects/subjects';
import { StudentScheduleComponent } from './dashboard/academic/student-schedule/student-schedule';
import { LessonPlanComponent } from './dashboard/academic/lesson-plan/lesson-plan';
import { AssignmentsComponent } from './dashboard/academic/assignments/assignments';
import { GradingComponent } from './dashboard/academic/grading/grading';
import { AttendanceComponent } from './dashboard/academic/attendance/attendance';
import { FoodOrderingComponent } from './dashboard/food-ordering/food-ordering';
import { InventoryComponent } from './dashboard/inventory/inventory';
import { NotificationComponent } from './dashboard/notification/notification';
import { SettingsComponent } from './dashboard/settings/settings';

// Financial (Admin/Staff Versions)
import { PaymentComponent } from './dashboard/financial/payment/payment';
import { RefundComponent } from './dashboard/financial/refund/refund';
import { DiscountComponent } from './dashboard/financial/discount/discount';
import { WalletComponent } from './dashboard/financial/wallet/wallet';

// Role Dashboards
import { StudentDashboardComponent } from './dashboard/student-dashboard/student-dashboard';
import { TeacherDashboardComponent } from './dashboard/teacher-dashboard/teacher-dashboard';
import { StaffDashboardComponent } from './dashboard/staff-dashboard/staff-dashboard';
import { ParentDashboardComponent } from './dashboard/parent-dashboard/parent-dashboard';

// Teacher Specific
import { TeacherLessonPlanComponent } from './dashboard/teacher-lesson-plan/teacher-lesson-plan';

// Student Specific
import { StudentGradesComponent } from './dashboard/student-grades/student-grades';
import { StudentAttendanceComponent } from './dashboard/student-attendance/student-attendance';
import { StudentFoodComponent } from './dashboard/student-food/student-food';
import { StudentAssignmentComponent } from './dashboard/student-assignment/student-assignment';

// Parent Specific
import { ParentStudentProfileComponent } from './dashboard/parent-student-profile/parent-student-profile';

// *** NEW: Parent Financial Components (Corrected Paths based on your logs) ***
import { PaymentComponent as ParentPaymentComponent } from './dashboard/parent-financial/payment/payment';
import { RefundComponent as ParentRefundComponent } from './dashboard/parent-financial/refund/refund';
import { WalletComponent as ParentWalletComponent } from './dashboard/parent-financial/wallet/wallet';
import { DiscountComponent as ParentDiscountComponent } from './dashboard/parent-financial/discount/discount';
import { UserProfileComponent } from './user-profile/user-profile';
import { WebsiteManagementComponent } from './dashboard/admin/website-management/website-management';



export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },

  // Public Pages
  { path: 'about/mission', component: MissionVisionComponent },
  { path: 'about/board', component: BoardOfGovernorsComponent },
  { path: 'about/structure', component: OrganizationalStructureComponent },
  { path: 'admissions/how-to-apply', component: HowToApplyComponent },
  { path: 'admissions/application-form', component: ApplicationFormComponent },
  { path: 'admissions/fees', component: FeesComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'contact', component: ContactComponent },

  // --- ADMIN ROUTES ---
  { path: 'dashboard/admin', component: AdminDashboardComponent, title: 'Admin Portal' },
  { path: 'dashboard/student-info', component: StudentInfoComponent },
  { path: 'dashboard/teacher-info', component: TeacherInfoComponent },
  { path: 'dashboard/academic/subjects', component: SubjectsComponent },
  { path: 'dashboard/academic/student-schedule', component: StudentScheduleComponent },
  { path: 'dashboard/academic/lesson-plan', component: LessonPlanComponent },
  { path: 'dashboard/academic/assignments', component: AssignmentsComponent },
  { path: 'dashboard/academic/grading', component: GradingComponent },
  { path: 'dashboard/academic/attendance', component: AttendanceComponent },
  { path: 'dashboard/admin/food-ordering', component: FoodOrderingComponent, title: 'Admin - Food Ordering' },
  { path: 'dashboard/admin/inventory', component: InventoryComponent, title: 'Admin - Inventory' },
  { path: 'dashboard/admin/notification', component: NotificationComponent, title: 'Admin - Notifications' },
  { path: 'dashboard/admin/settings', component: SettingsComponent, title: 'Admin - Settings' },
  { path: 'dashboard/staff/settings', component: SettingsComponent, title: 'Staff - Settings' },
  { path: 'dashboard/teacher/settings', component: SettingsComponent, title: 'Teacher - Settings' },
  { path: 'dashboard/student/settings', component: SettingsComponent, title: 'Student - Settings' },
  { path: 'dashboard/parent/settings', component: SettingsComponent, title: 'Parent - Settings' },

  // --- FINANCIAL ROUTES (Admin/Staff Shared) ---
  {
    path: 'dashboard/financial',
    children: [
      { path: '', redirectTo: 'payment', pathMatch: 'full' },
      { path: 'payment', component: PaymentComponent, title: 'Financial - Payment' },
      { path: 'refund', component: RefundComponent, title: 'Financial - Refund' },
      { path: 'discount', component: DiscountComponent, title: 'Financial - Discount' },
      { path: 'wallet', component: WalletComponent, title: 'Financial - Wallet' }
    ]
  },

  // --- STAFF ROUTES ---
  { path: 'dashboard/staff', component: StaffDashboardComponent, title: 'Staff Portal' },
  { path: 'dashboard/staff/student-info', component: StudentInfoComponent, title: 'Staff - Student Info' },
  {
    path: 'dashboard/staff/financial',
    children: [
      { path: 'payment', component: PaymentComponent, title: 'Staff - Payment' },
      { path: 'refund', component: RefundComponent, title: 'Staff - Refund' },
      { path: 'discount', component: DiscountComponent, title: 'Staff - Discount' },
      { path: 'wallet', component: WalletComponent, title: 'Staff - Wallet' }
    ]
  },

  // --- TEACHER ROUTES ---
  { path: 'dashboard/teacher', component: TeacherDashboardComponent, title: 'Teacher Portal' },
  { path: 'dashboard/teacher/profile', component: TeacherInfoComponent, title: 'Teacher Profile' },
  {
    path: 'dashboard/teacher/academic',
    children: [
      { path: 'assignments', component: AssignmentsComponent, title: 'Teacher - Assignments' },
      { path: 'grading', component: GradingComponent, title: 'Teacher - Grading' },
      { path: 'attendance', component: AttendanceComponent, title: 'Teacher - Attendance' },
      { path: 'lesson-plan', component: TeacherLessonPlanComponent, title: 'Lesson Plan (Teacher)' },
    ]
  },

  // --- STUDENT ROUTES ---
  { path: 'dashboard/student', component: StudentDashboardComponent, title: 'Student Portal' },
  { path: 'dashboard/student/profile', component: StudentInfoComponent, title: 'My Profile' },
  { path: 'dashboard/student/assignments', component: StudentAssignmentComponent, title: 'My Courses' },
  { path: 'dashboard/student/grades', component: StudentGradesComponent, title: 'My Grades' },
  { path: 'dashboard/student/attendance', component: StudentAttendanceComponent, title: 'My Attendance' },
  { path: 'dashboard/student/food', component: StudentFoodComponent, title: 'Food Menu' },

  // --- PARENT ROUTES ---
  { path: 'dashboard/parent', component: ParentDashboardComponent, title: 'Parent Portal' },

  // *** PARENT FINANCIAL SUB-ROUTES ***
  {
    path: 'dashboard/parent/financial',
    children: [
      { path: '', redirectTo: 'payment', pathMatch: 'full' },
      { path: 'payment', component: ParentPaymentComponent, title: 'Parent - Fees' },
      { path: 'refund', component: ParentRefundComponent, title: 'Parent - Refund Request' },
      { path: 'wallet', component: ParentWalletComponent, title: 'Parent - E-Wallet' },
      { path: 'discount', component: ParentDiscountComponent, title: 'Parent - Discounts' }
    ]
  },

  { path: 'dashboard/parent/profile', component: ParentStudentProfileComponent, title: 'Child Profile' },
  { path: 'dashboard/parent/courses', component: StudentAssignmentComponent, title: 'Child Courses' },
  { path: 'dashboard/parent/grades', component: StudentGradesComponent, title: 'Child Grades' },
  { path: 'dashboard/parent/attendance', component: StudentAttendanceComponent, title: 'Child Attendance' },
  { path: 'dashboard/parent/food', component: StudentFoodComponent, title: 'Food Ordering' },

  // 示例
  // 修复：路径必须包含 'dashboard/' 以匹配按钮的 routerLink
  { path: 'dashboard/user-profile', component: UserProfileComponent, title: 'My Profile' },
  { path: 'dashboard/admin/website', component: WebsiteManagementComponent, title: 'Website Editor' },
];
