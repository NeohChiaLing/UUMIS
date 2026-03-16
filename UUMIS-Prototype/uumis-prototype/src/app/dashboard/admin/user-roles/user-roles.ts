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

  availableRoles = ['admin', 'staff', 'teacher', 'parent', 'student'];

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getAllUsers().subscribe({
      next: (res: any) => {
        // Safely handle the response whether it's an array or an object
        this.users = Array.isArray(res) ? res : (res.users || res.data || []);
        console.log("Loaded Users from DB:", this.users); // Check your browser console!
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

      const userRole = u.role?.toLowerCase() || 'student'; // Default to student
      const matchesRole = this.selectedRoleFilter === 'All' || userRole === this.selectedRoleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }

  changeRole(user: any, event: any) {
    const newRole = event.target.value.toLowerCase();
    if(confirm(`Change ${user.fullName || user.username}'s role to ${newRole.toUpperCase()}?`)) {
      this.authService.updateUserRole(user.id, newRole).subscribe({
        next: () => {
          user.role = newRole;
          alert('Role updated successfully.');
        },
        error: () => {
          alert('Failed to update role.');
          event.target.value = user.role || 'student'; // Revert dropdown on failure
        }
      });
    } else {
      event.target.value = user.role || 'student'; // Revert dropdown if cancelled
    }
  }

  deleteUser(user: any) {
    if (confirm(`Are you absolutely sure you want to permanently delete ${user.fullName || user.username}'s account?`)) {
      this.authService.deleteUser(user.id).subscribe({
        next: () => {
          alert('User deleted successfully.');
          this.loadUsers(); // Refresh the table
        },
        error: () => alert('Failed to delete user. They might be linked to existing records.')
      });
    }
  }
}
