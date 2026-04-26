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
import { FacultyStaffComponent } from './about/faculty-staff/faculty-staff';
import { ParentChildrenListComponent } from './dashboard/parent-children-list/parent-children-list';
import { ParentCoursesComponent } from './dashboard/parent-courses/parent-courses';
import { ParentGradesComponent } from './dashboard/parent-grades/parent-grades';
import { ParentAttendanceComponent } from './dashboard/parent-attendance/parent-attendance';
import { ParentFoodComponent } from './dashboard/parent-food/parent-food';
import { TeacherGradingComponent } from './dashboard/teacher-grading/teacher-grading';
import { TeacherProfileComponent } from './dashboard/teacher-profile/teacher-profile';
import { TeacherAttendanceComponent } from './dashboard/teacher-attendance/teacher-attendance';
import { TeacherAssignmentComponent } from './dashboard/teacher-assignment/teacher-assignment';
import { StaffProfileComponent } from './dashboard/staff-profile/staff-profile';

// Admin Dashboards
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard';
import { AdminProfileComponent } from './dashboard/admin-profile/admin-profile';
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
import { StudentProfileComponent } from './dashboard/student-profile/student-profile';

// Parent Specific
import { ParentStudentProfileComponent } from './dashboard/parent-student-profile/parent-student-profile';

// Parent Financial Components
import { PaymentComponent as ParentPaymentComponent } from './dashboard/parent-financial/payment/payment';
import { RefundComponent as ParentRefundComponent } from './dashboard/parent-financial/refund/refund';
import { WalletComponent as ParentWalletComponent } from './dashboard/parent-financial/wallet/wallet';
import { DiscountComponent as ParentDiscountComponent } from './dashboard/parent-financial/discount/discount';
import { UserProfileComponent } from './user-profile/user-profile';
import { WebsiteManagementComponent } from './dashboard/admin/website-management/website-management';
import { UserRolesComponent } from './dashboard/admin/user-roles/user-roles';

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
  { path: 'about/faculty-staff', component: FacultyStaffComponent },

  // --- ADMIN ROUTES ---
  { path: 'dashboard/admin', component: AdminDashboardComponent, title: 'Admin Portal' },
  { path: 'dashboard/student-info', component: StudentInfoComponent }, // Fallback alias
  { path: 'dashboard/admin/students', component: StudentInfoComponent, title: 'Manage Students' }, // The actual route staff uses
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
  { path: 'dashboard/admin/profile', component: AdminProfileComponent, title: 'Admin Profile' },
  { path: 'dashboard/admin/website', component: WebsiteManagementComponent, title: 'Website Editor' },
  { path: 'dashboard/admin/user-roles', component: UserRolesComponent },

  // Shared Settings Routes
  { path: 'dashboard/staff/settings', component: SettingsComponent, title: 'Staff - Settings' },
  { path: 'dashboard/teacher/settings', component: SettingsComponent, title: 'Teacher - Settings' },
  { path: 'dashboard/student/settings', component: SettingsComponent, title: 'Student - Settings' },
  { path: 'dashboard/parent/settings', component: SettingsComponent, title: 'Parent - Settings' },

  // --- FINANCIAL ROUTES (Admin/Staff Shared) ---
  {
    path: 'dashboard/financial',
    children: [
      // THE FIX: Allow dashboard/financial to load the Staff Dashboard so it isn't an empty screen!
      { path: '', component: StaffDashboardComponent, title: 'Financial Manager Portal' },
      { path: 'payment', component: PaymentComponent, title: 'Financial - Payment' },
      { path: 'payments', redirectTo: 'payment', pathMatch: 'full' }, // Alias for the buttons
      { path: 'refund', component: RefundComponent, title: 'Financial - Refund' },
      { path: 'refunds', redirectTo: 'refund', pathMatch: 'full' }, // Alias for the buttons
      { path: 'discount', component: DiscountComponent, title: 'Financial - Discount' },
      { path: 'discounts', redirectTo: 'discount', pathMatch: 'full' }, // Alias for the buttons
      { path: 'wallet', component: WalletComponent, title: 'Financial - Wallet' }
    ]
  },

  // --- STAFF ROUTES ---
  { path: 'dashboard/staff', component: StaffDashboardComponent, title: 'Staff Portal' },
  { path: 'dashboard/staff/student-info', component: StudentInfoComponent, title: 'Staff - Student Info' },
  { path: 'dashboard/staff/profile', component: StaffProfileComponent, title: 'Staff Profile' },

  // --- TEACHER ROUTES ---
  { path: 'dashboard/teacher', component: TeacherDashboardComponent, title: 'Teacher Portal' },
  { path: 'dashboard/teacher/profile', component: TeacherProfileComponent, title: 'Teacher Profile' },
  {
    path: 'dashboard/teacher/academic',
    children: [
      { path: 'assignments', component: TeacherAssignmentComponent, title: 'Teacher - Assignments' },
      { path: 'grading', component: TeacherGradingComponent, title: 'Teacher - Grading' },
      { path: 'attendance', component: TeacherAttendanceComponent, title: 'Teacher - Attendance' },
      { path: 'lesson-plan', component: TeacherLessonPlanComponent, title: 'Lesson Plan (Teacher)' },
    ]
  },

  // --- STUDENT ROUTES ---
  { path: 'dashboard/student', component: StudentDashboardComponent, title: 'Student Portal' },
  { path: 'dashboard/student/profile', component: StudentProfileComponent, title: 'My Profile' },
  { path: 'dashboard/student/assignments', component: StudentAssignmentComponent, title: 'My Courses' },
  { path: 'dashboard/student/grades', component: StudentGradesComponent, title: 'My Grades' },
  { path: 'dashboard/student/attendance', component: StudentAttendanceComponent, title: 'My Attendance' },
  { path: 'dashboard/student/food', component: StudentFoodComponent, title: 'Food Menu' },

  // --- PARENT ROUTES ---
  { path: 'dashboard/parent', component: ParentDashboardComponent, title: 'Parent Portal' },
  { path: 'dashboard/parent/profile', component: ParentStudentProfileComponent, title: 'Child Profile' },
  { path: 'dashboard/parent/courses', component: ParentCoursesComponent, title: 'Child Courses' },
  { path: 'dashboard/parent/grades', component: ParentGradesComponent, title: 'Child Grades' },
  { path: 'dashboard/parent/attendance', component: ParentAttendanceComponent, title: 'Child Attendance' },
  { path: 'dashboard/parent/food', component: ParentFoodComponent, title: 'Food Ordering' },
  { path: 'dashboard/parent/children-list', component: ParentChildrenListComponent, title: 'My Children' },

  // Parent Financial Sub-Routes
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

  // The Generic User Profile (The one you requested for Staff)
  { path: 'dashboard/user-profile', component: UserProfileComponent, title: 'My Profile' }
];
