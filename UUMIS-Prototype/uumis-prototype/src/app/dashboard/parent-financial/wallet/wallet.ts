import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.html'
})
export class WalletComponent implements OnInit {

  currentUser: any = null;

  viewState: string = 'children';
  myChildren: any[] = [];
  selectedChild: any = null;

  walletBalance: number = 0.00;
  walletTransactions: any[] = [];

  constructor(private authService: AuthService, private location: Location) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser && this.currentUser.role.toLowerCase() === 'parent') {
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
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  selectChild(child: any) {
    this.selectedChild = child;
    this.viewState = 'details';
    this.loadWalletData(child.id);
  }

  loadWalletData(childId: number) {
    this.authService.getWalletData(childId).subscribe({
      next: (res: any) => {
        this.walletBalance = res.balance || 0.00;
        this.walletTransactions = res.transactions || [];
      },
      error: (err: any) => {
        console.error("Failed to load wallet data", err);
      }
    });
  }

  goBack() {
    if (this.viewState === 'details') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.walletBalance = 0;
      this.walletTransactions = [];
    } else {
      this.location.back();
    }
  }

}
