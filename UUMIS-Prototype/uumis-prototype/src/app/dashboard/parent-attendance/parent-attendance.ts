import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-attendance.html',
  styles: []
})
export class ParentAttendanceComponent implements OnInit {

  currentUser: any = null;
  viewState: string = 'children';

  myChildren: any[] = [];
  selectedChild: any = null;

  attendanceRecords: any[] = [];
  isLoading: boolean = false;

  presentPercentage: number = 100;
  absentDays: number = 0;

  constructor(private location: Location, private authService: AuthService) {}

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
    this.viewState = 'attendance';
    this.loadAttendance();
  }

  loadAttendance() {
    this.isLoading = true;
    const targetUsername = this.selectedChild.username || this.selectedChild.email || this.selectedChild.id.toString();

    if (!targetUsername) {
      this.attendanceRecords = [];
      this.calculateStats();
      this.isLoading = false;
      return;
    }

    this.authService.getMyAttendance(targetUsername).subscribe({
      next: (res: any[]) => {
        this.attendanceRecords = (res || []).map(log => {
          let derivedMcStatus = log.mc_status || log.mcStatus;
          if (!derivedMcStatus && (log.mc_file || log.mcFile)) {
            if (log.status === 'EXCUSED') derivedMcStatus = 'Approved';
            else derivedMcStatus = 'Pending Review';
          }

          return {
            ...log,
            id: log.id,
            timeIn: log.time_in || log.timeIn || '--:--',
            mcFile: log.mc_file || log.mcFile || null,
            mcUrl: log.mc_url || log.mcUrl || null,
            mcStatus: derivedMcStatus
          };
        });

        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load attendance', err);
        this.attendanceRecords = [];
        this.calculateStats();
        this.isLoading = false;
      }
    });
  }

  uploadMC(log: any) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf, image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        log.mcFile = file.name;
        const reader = new FileReader();
        reader.onload = (event: any) => {
          log.mcUrl = event.target.result;
          log.mcStatus = 'Pending Review';
          log.status = 'ABSENT';

          const payload = [{
            id: log.id,
            studentId: log.student_id || log.studentId || this.selectedChild.studentId || this.selectedChild.student_id || this.selectedChild.username,
            student_id: log.student_id || log.studentId || this.selectedChild.studentId || this.selectedChild.student_id || this.selectedChild.username,
            studentName: log.student_name || log.studentName || this.selectedChild.fullName || this.selectedChild.username,
            student_name: log.student_name || log.studentName || this.selectedChild.fullName || this.selectedChild.username,
            yearGroup: log.year_group || log.yearGroup || this.selectedChild.bio || 'Unassigned',
            year_group: log.year_group || log.yearGroup || this.selectedChild.bio || 'Unassigned',
            date: log.date,
            timeIn: log.timeIn,
            time_in: log.timeIn,
            status: log.status,
            mcFile: log.mcFile,
            mc_file: log.mcFile,
            mcUrl: log.mcUrl,
            mc_url: log.mcUrl,
            mcStatus: log.mcStatus,
            mc_status: log.mcStatus
          }];

          this.authService.saveAttendance(payload).subscribe({
            next: () => alert('MC Uploaded successfully. Awaiting Admin review!'),
            error: () => alert('Failed to sync upload with server.')
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  downloadMC(log: any) {
    if (log.mcUrl) {
      const a = document.createElement('a');
      a.href = log.mcUrl;
      a.download = log.mcFile || 'MC_Document.pdf';
      a.click();
    }
  }

  calculateStats() {
    if (this.attendanceRecords.length === 0) {
      this.presentPercentage = 0;
      this.absentDays = 0;
      return;
    }

    const totalDays = this.attendanceRecords.length;

    this.absentDays = this.attendanceRecords.filter(r =>
      r.status && r.status.toLowerCase() === 'absent'
    ).length;

    const presentDays = totalDays - this.absentDays;
    this.presentPercentage = Math.round((presentDays / totalDays) * 100);
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'present') return 'bg-emerald-100 text-emerald-700';
    if (s === 'absent') return 'bg-rose-100 text-rose-700';
    if (s === 'late') return 'bg-orange-100 text-orange-700';
    if (s === 'excused') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-500';
  }

  goBack(): void {
    if (this.viewState === 'attendance') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.attendanceRecords = [];
      this.presentPercentage = 100;
      this.absentDays = 0;
    } else {
      this.location.back();
    }
  }
}
