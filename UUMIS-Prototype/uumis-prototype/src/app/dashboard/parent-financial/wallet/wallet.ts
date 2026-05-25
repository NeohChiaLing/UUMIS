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
  walletTransactions: any[] = []; // THE FIX: Array to hold actual wallet records

  constructor(private authService: AuthService, private location: Location) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser && this.currentUser.role.toLowerCase() === 'parent') {
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {
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

  // THE FIX: Direct connection to the wallet API to fetch accurate ledger history!
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
