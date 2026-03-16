import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-student-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-schedule.html',
  styleUrl: './student-schedule.css'
})
export class StudentScheduleComponent implements OnInit {

  isEditMode = false;
  selectedLevel = 'Kindergarten';
  levels = ['Kindergarten', 'Primary', 'Lower Secondary', 'Upper Secondary', 'KAFA'];
  days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

  availableSubjects: any[] = [];

  scheduleData: any = {
    'Kindergarten': { headers: ['8:00 - 9:00', '9:00 - 10:00'], rows: Array(5).fill(null).map(() => Array(2).fill('')) },
    'Primary': { headers: ['8:00 - 9:00', '9:00 - 10:00'], rows: Array(5).fill(null).map(() => Array(2).fill('')) },
    'Lower Secondary': { headers: ['8:00 - 9:00', '9:00 - 10:00'], rows: Array(5).fill(null).map(() => Array(2).fill('')) },
    'Upper Secondary': { headers: ['8:00 - 9:00', '9:00 - 10:00'], rows: Array(5).fill(null).map(() => Array(2).fill('')) },
    'KAFA': { headers: ['2:00 - 3:00', '3:00 - 4:00'], rows: Array(5).fill(null).map(() => Array(2).fill('')) }
  };

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.loadSubjects();
    this.loadSchedule(this.selectedLevel);
  }

  loadSubjects() {
    this.authService.getSubjects().subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.availableSubjects = data;
        }
      },
      error: (err) => console.error('Failed to load subjects')
    });
  }

  loadSchedule(level: string) {
    this.authService.getSchedule(level).subscribe({
      next: (res) => {
        if (res) {
          this.scheduleData[level].headers = JSON.parse(res.headers);
          this.scheduleData[level].rows = JSON.parse(res.gridData);
        }
      },
      error: (err) => console.log('No existing schedule found for ' + level + ', using default grid.')
    });
  }

  onLevelChange() {
    this.isEditMode = false;
    this.loadSchedule(this.selectedLevel);
  }

  goBack() { this.location.back(); }
  toggleEditMode() { this.isEditMode = !this.isEditMode; }

  addColumn() {
    this.scheduleData[this.selectedLevel].headers.push('New Slot');
    this.scheduleData[this.selectedLevel].rows.forEach((row: any[]) => row.push(''));
  }

  submitSchedule() {
    const payload = {
      headers: JSON.stringify(this.scheduleData[this.selectedLevel].headers),
      gridData: JSON.stringify(this.scheduleData[this.selectedLevel].rows)
    };

    this.authService.saveSchedule(this.selectedLevel, payload).subscribe({
      next: () => {
        alert('Schedule saved successfully to Database!');
        this.isEditMode = false;
      },
      error: () => alert('Failed to save schedule.')
    });
  }

  // --- CORE FIX: Prevents inputs from losing focus while typing ---
  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
