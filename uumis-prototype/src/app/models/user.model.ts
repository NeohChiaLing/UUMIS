export type UserRole = 'ADMIN' | 'STAFF_REGISTER' | 'STAFF_FINANCE' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  // Helper property to easily check permissions in HTML
  canAccessFinancials?: boolean;
}
