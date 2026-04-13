import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Pointing to your Spring Boot Backend
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  // ==========================
  // 1. AUTHENTICATION APIs
  // ==========================

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  // --- NEW: SILENT SUBMISSION FOR APPLICATION FORM ---
  submitApplication(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply`, user);
  }

  // --- NEW: TRIGGER APPROVAL EMAILS ---
  sendApprovalEmail(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-approval-email`, payload);
  }

  verify(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify`, { email, code });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  // ==========================
  // 2. USER PROFILE APIs
  // ==========================

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  // ==========================
  // 3. ADMIN / STUDENT MANAGEMENT APIs
  // ==========================

  // Fetch all students (Used in Admin Student Info)
  getStudents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/students`);
  }

// --- RUN YEAR END PROMOTION ---
  promoteAllStudents(): Observable<any> {
    return this.http.post(`${this.apiUrl}/students/promote-all`, {});
  }
  // Approve a pending student
  approveStudent(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/students/${id}/approve`, {});
  }

  // ==========================
  // 4. HELPER METHODS (LocalStorage)
  // ==========================

  // Get current user's role from LocalStorage
  getRole(): string | null {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.role;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  // Clear session
  logout() {
    localStorage.removeItem('user');
    localStorage.clear();
  }

  // ... inside AuthService ...

  // --- 10. ADMIN UPDATE STUDENT ---
  adminUpdateStudent(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/students/${id}`, data);
  }
  // ==========================
  // FOOD ORDERING APIs
  // ==========================

  getFoodItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/food/items`);
  }

  saveFoodItems(items: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/food/items`, items);
  }

  getFoodOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/food/orders`);
  }

  submitFoodOrder(order: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/food/orders`, order);
  }

  completeFoodOrder(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/food/orders/${id}/complete`, {});
  }

  // ==========================
  // SUBJECT & CURRICULUM APIs
  // ==========================

  getSubjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/subjects`);
  }

  saveSubjects(subjects: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/subjects`, subjects);
  }

  deleteSubject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subjects/${id}`);
  }
  // ==========================
  // SCHEDULE APIs
  // ==========================

  getSchedule(level: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/schedules/${level}`);
  }

  saveSchedule(level: string, scheduleData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedules/${level}`, scheduleData);
  }
  // ==========================
  // LESSON PLAN APIs
  // ==========================

  getLessonPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/lesson-plans`);
  }

  submitLessonPlan(planData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/lesson-plans`, planData);
  }

  updateLessonPlanStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/lesson-plans/${id}/status`, { status });
  }
  deleteLessonPlan(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lesson-plans/${id}`);
  }
  // ==========================
  // ASSIGNMENTS APIs
  // ==========================
  getAssignments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assignments`);
  }
  saveAssignment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/assignments`, data);
  }
  updateAssignment(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/assignments/${id}`, data);
  }
  deleteAssignment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/assignments/${id}`);
  }
  // ==========================
  // GRADES & USERS APIs
  // ==========================

  getUsers(): Observable<any[]> {
    // FIX: Removed the /auth path so it correctly hits /api/users
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  getGrades(yearGroup: string, subject: string): Observable<any[]> {
    // FIX: Encodes the text so spaces and "&" symbols don't break the URL!
    const encodedYear = encodeURIComponent(yearGroup);
    const encodedSubject = encodeURIComponent(subject);
    return this.http.get<any[]>(`${this.apiUrl}/grades?yearGroup=${encodedYear}&subject=${encodedSubject}`);
  }
  getMyGrades(username: string): Observable<any[]> {
    // Encodes the username so special characters don't break the URL
    const encodedUser = encodeURIComponent(username);
    return this.http.get<any[]>(`${this.apiUrl}/grades/student/${encodedUser}`);
  }
  saveGrades(gradesData: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/grades`, gradesData);
  }
  // ==========================
  // ATTENDANCE APIs
  // ==========================

  getAttendance(yearGroup: string, date: string): Observable<any[]> {
    const encodedYear = encodeURIComponent(yearGroup);
    return this.http.get<any[]>(`${this.apiUrl}/attendance?yearGroup=${encodedYear}&date=${date}`);
  }

  // --- ADD THIS MISSING FUNCTION ---
  getMyAttendance(username: string): Observable<any[]> {
    const encodedUser = encodeURIComponent(username);
    return this.http.get<any[]>(`${this.apiUrl}/attendance/student/${encodedUser}`);
  }

  saveAttendance(records: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/bulk`, records);
  }

  deleteAttendance(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/attendance/${id}`);
  }

  // ==========================
  // TEACHER MANAGEMENT APIs
  // ==========================

  // Fetch all teachers for the Admin list
  getTeachers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/teachers`);
  }

  // Assign subjects to a specific teacher
  adminUpdateTeacher(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/teachers/${id}`, data);
  }

  // ==========================
  // FINANCIAL PAYMENT APIs
  // ==========================
  getStudentPayments(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments/student/${studentId}`);
  }

  addPayment(studentId: number, paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/student/${studentId}`, paymentData);
  }

  updatePayment(paymentId: number, paymentData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/payments/${paymentId}`, paymentData);
  }

  deletePayment(paymentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/payments/${paymentId}`);
  }
  // ==========================
  // APPOINTMENT & DATA APIs
  // ==========================

  // 1. Used to check localStorage and re-hydrate memory on refresh
  getCurrentUser(): any {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  // 2. PARENT SECURE DATA ACCESS
  // Instead of fetching data based on the logged-in user,
  // this API explicitly requests data for studentId 'X'.
  // We rely on backend security gaurds to ensure parent is linked to student X.
  getStudentDashboardData(studentId: number): Observable<any> {
    // Requires a new Backend endpoint: GET /api/dashboard/student/{studentId}
    return this.http.get(`${this.apiUrl}/dashboard/student/${studentId}`);
  }

  // --- FETCH PARENTS FOR DROPDOWN ---
  getParents(): import('rxjs').Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/parents`);
  }

// --- REFUND APIs ---
  getStudentRefunds(studentId: number) { return this.http.get<any[]>(`${this.apiUrl}/refunds/student/${studentId}`); }
  requestRefund(studentId: number, payload: any) { return this.http.post(`${this.apiUrl}/refunds/student/${studentId}`, payload); }
  updateRefundStatus(refundId: number, status: string) { return this.http.put(`${this.apiUrl}/refunds/${refundId}?status=${status}`, {}); }

  // --- DISCOUNT APIs ---
  getAllDiscounts() { return this.http.get<any[]>(`${this.apiUrl}/discounts`); }
  getActiveDiscounts() { return this.http.get<any[]>(`${this.apiUrl}/discounts/active`); }
  createDiscount(payload: any) { return this.http.post(`${this.apiUrl}/discounts`, payload); }
  updateDiscount(id: number, payload: any) { return this.http.put(`${this.apiUrl}/discounts/${id}`, payload); }

  // --- WALLET APIs ---
  getWalletData(studentId: number) { return this.http.get<any>(`${this.apiUrl}/wallet/student/${studentId}`); }
  addWalletTransaction(studentId: number, payload: any) { return this.http.post<any>(`${this.apiUrl}/wallet/student/${studentId}/transaction`, payload); }

// --- INVENTORY APIs ---
  getInventory() { return this.http.get<any[]>(`${this.apiUrl}/inventory`); }
  addInventory(payload: any) { return this.http.post(`${this.apiUrl}/inventory`, payload); }
  updateInventory(id: string, payload: any) { return this.http.put(`${this.apiUrl}/inventory/${id}`, payload); }
  deleteInventory(id: string) { return this.http.delete(`${this.apiUrl}/inventory/${id}`); }

// --- NOTIFICATION APIs ---
  getNotifications() { return this.http.get<any[]>(`${this.apiUrl}/notifications`); }
  sendNotification(payload: any) { return this.http.post(`${this.apiUrl}/notifications`, payload); }

// --- USER ROLES APIs ---
  getAllUsers() { return this.http.get<any>(`${this.apiUrl}/users`); }
  updateUserRole(id: number, role: string) { return this.http.put(`${this.apiUrl}/users/${id}/role`, { role }); }

  // --- STUDENT GRADES API ---
  getStudentGrades(studentId: number) {
    // Note: If your Spring Boot controller uses a different URL (like /grades/student/), adjust this string!
    return this.http.get<any[]>(`${this.apiUrl}/student-grades/student/${studentId}`);
  }
// Example: Change these strings to match your Spring Boot URLs!
  getAllAttendance() {
    return this.http.get<any[]>(`${this.apiUrl}/attendance/all`);
  }

  getAllPayments() {
    return this.http.get<any[]>(`${this.apiUrl}/payments/all`);
  }

  getAllRefundRequests() {
    return this.http.get<any[]>(`${this.apiUrl}/refunds/all`);
  }
  // --- SAVE USER PROFILE / LANGUAGE ---
  updateUserProfile(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/users/${id}`, data);
  }
  deleteFoodOrder(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/food/orders/${id}`);
  }
}
