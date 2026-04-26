import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-roles.html'
})
export class UserRolesComponent implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  selectedRoleFilter: string = 'All';

  // THE FIX: We use objects now so the database gets the exact code ('financial_manager')
  // but your dashboard UI displays it cleanly as "Financial Manager"
  availableRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'staff', label: 'General Staff' },
    { value: 'register_manager', label: 'Register Manager' },
    { value: 'financial_manager', label: 'Financial Manager' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'student', label: 'Student' }
  ];

  // Modal State Variables
  showInviteModal: boolean = false;
  inviteEmail: string = '';
  inviteRole: string = 'staff';
  isInviting: boolean = false;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getAllUsers().subscribe({
      next: (res: any) => {
        let rawUsers = Array.isArray(res) ? res : (res.users || res.data || []);

        this.users = rawUsers.map((u: any) => {
          if (u.role) {
            u.role = u.role.trim().toLowerCase();
          } else {
            u.role = 'student';
          }
          return u;
        });

        console.log("Loaded Users from DB:", this.users);
        this.filterUsers();
      },
      error: (err) => console.error('Failed to fetch users', err)
    });
  }

  goBack() {
    this.location.back();
  }

  filterUsers() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u => {
      const matchesSearch = (u.fullName?.toLowerCase() || '').includes(term) ||
        (u.email?.toLowerCase() || '').includes(term) ||
        (u.username?.toLowerCase() || '').includes(term);

      const userRole = u.role?.toLowerCase() || 'student';
      const matchesRole = this.selectedRoleFilter === 'All' || userRole === this.selectedRoleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }

  changeRole(user: any, event: any) {
    const newRole = event.target.value.toLowerCase();

    if(confirm(`Change ${user.fullName || user.username}'s role to ${this.formatRole(newRole).toUpperCase()}?`)) {
      this.authService.updateUserRole(user.id, newRole).subscribe({
        next: () => {
          user.role = newRole;
          alert('Role updated successfully.');
        },
        error: () => {
          alert('Failed to update role.');
          event.target.value = user.role || 'student';
        }
      });
    } else {
      event.target.value = user.role || 'student';
    }
  }

  deleteUser(user: any) {
    if (confirm(`Are you absolutely sure you want to permanently delete ${user.fullName || user.username}'s account?`)) {
      this.authService.deleteUser(user.id).subscribe({
        next: () => {
          alert('User deleted successfully.');
          this.loadUsers();
        },
        error: () => alert('Failed to delete user. They might be linked to existing records.')
      });
    }
  }

  // THE FIX: This helper cleans up the ugly underscores in the database role names for the UI!
  formatRole(roleValue: string): string {
    if (!roleValue) return 'Student';
    const found = this.availableRoles.find(r => r.value === roleValue.toLowerCase());
    return found ? found.label : roleValue;
  }

  // --- Invite Modal Functions ---
  openInviteModal() {
    this.inviteEmail = '';
    this.inviteRole = 'staff';
    this.showInviteModal = true;
  }

  closeInviteModal() {
    this.showInviteModal = false;
  }

  submitInvite() {
    if (!this.inviteEmail) {
      alert("Please enter an email address.");
      return;
    }

    this.isInviting = true;
    this.authService.inviteUser(this.inviteEmail, this.inviteRole).subscribe({
      next: (res: any) => {
        alert(res.message || 'User invited successfully! They will receive an email shortly.');
        this.isInviting = false;
        this.closeInviteModal();
        this.loadUsers(); // Refresh the table to show the new user
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Failed to send invite. Please check the email and try again.');
        this.isInviting = false;
      }
    });
  }
}
