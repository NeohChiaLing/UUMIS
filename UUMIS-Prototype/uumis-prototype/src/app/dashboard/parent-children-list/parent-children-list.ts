import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-children-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-children-list.html'
})
export class ParentChildrenListComponent implements OnInit {
  myChildren: any[] = [];
  currentUser: any = null;
  isLoading: boolean = true;

  constructor(private authService: AuthService, private router: Router, private location: Location) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {

          // THE FIX: Unpack the JSON safely to build the proper display name
          this.myChildren = students
            .filter(s => s.parentId === this.currentUser.id || s.parent_id === this.currentUser.id)
            .map(child => {
              let profileData: any = {};
              const rawProfileJson = child.profile_json || child.profileJson;

              if (rawProfileJson) {
                try { profileData = JSON.parse(rawProfileJson); } catch (e) {}
              }

              let displayName = child.fullName || child.username || 'No Name';

              if (profileData.firstName || profileData.lastName || profileData.familyName) {
                const lName = profileData.lastName || profileData.familyName || '';
                displayName = [profileData.firstName, profileData.middleName, lName].filter(Boolean).join(' ');
              }

              return {
                ...child,
                displayName: displayName,
                fullName: displayName, // Overrides the core variable so HTML works without changes
                name: displayName
              };
            });

          this.isLoading = false;
        },
        error: () => {
          console.error('Failed to load children');
          this.isLoading = false;
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name || name === 'No Name') return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  viewProfile(childId: string) {
    sessionStorage.setItem('parentActiveChildId', childId);
    this.router.navigate(['/dashboard/parent/profile']);
  }

  goBack() {
    this.location.back();
  }
}
