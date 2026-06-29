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

          // THE FIX: Deployed the Dual-Parent Smart Filter here
          this.myChildren = students
            .filter(child => {
              let pJson: any = {};
              const rawJson = child.profile_json || child.profileJson;
              if (rawJson) {
                try { pJson = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson; } catch(e){}
              }
              const isLegacyParent = String(child.parentId) === String(this.currentUser.id) || String(child.parent_id) === String(this.currentUser.id);
              const isFather = String(pJson.fatherAccountId) === String(this.currentUser.id);
              const isMother = String(pJson.motherAccountId) === String(this.currentUser.id);
              return isLegacyParent || isFather || isMother;
            })
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
                fullName: displayName,
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
