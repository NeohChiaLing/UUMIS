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
  selectedLevel = 'Primary';
  selectedYear = 'Year 1'; // NEW: Added selectedYear

  levels = ['Kindergarten', 'Primary', 'Lower Secondary', 'Upper Secondary', 'KAFA'];
  days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

  availableSubjects: any[] = [];

  // NEW: Updated the default structure to handle a generic "currentGrid"
  currentGrid: any = { headers: ['8:00 - 9:00', '9:00 - 10:00'], rows: Array(5).fill(null).map(() => Array(2).fill('')) };

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.loadSubjects();
    this.loadSchedule(); // Loads based on selectedLevel + selectedYear
  }

  // --- NEW: Dynamic Year Dropdown based on the selected Level ---
  get yearsForSelectedLevel(): string[] {
    if (this.selectedLevel === 'Kindergarten') return ['Pre-Kindergarten', 'Kindergarten'];
    if (this.selectedLevel === 'Primary') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    if (this.selectedLevel === 'Lower Secondary') return ['Year 7', 'Year 8', 'Year 9'];
    if (this.selectedLevel === 'Upper Secondary') return ['Year 10', 'Year 11'];
    if (this.selectedLevel === 'KAFA') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    return [];
  }

  // --- NEW: Filters the dropdown to ONLY show subjects matching the Level & Year! ---
  get filteredSubjects() {
    return this.availableSubjects.filter(sub => {
      const subLevel = (sub.level || '').trim().toLowerCase();
      const subYear = (sub.yearGroup || sub.year_group || '').trim().toLowerCase();
      return subLevel === this.selectedLevel.toLowerCase() && subYear === this.selectedYear.toLowerCase();
    });
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

  loadSchedule() {
    // The key combines the level and the year (e.g., "Primary - Year 1")
    const combinedKey = `${this.selectedLevel} - ${this.selectedYear}`;

    this.authService.getSchedule(combinedKey).subscribe({
      next: (res) => {
        if (res && res.headers) {
          this.currentGrid.headers = JSON.parse(res.headers);
          this.currentGrid.rows = JSON.parse(res.gridData || res.grid_data);
        } else {
          this.resetGrid(); // Load defaults if nothing found
        }
      },
      error: (err) => {
        console.log(`No existing schedule found for ${combinedKey}, using default grid.`);
        this.resetGrid(); // Load defaults if error
      }
    });
  }

  resetGrid() {
    // Default headers depend on if it is KAFA or a standard class
    const defaultHeaders = this.selectedLevel === 'KAFA' ? ['2:00 - 3:00', '3:00 - 4:00'] : ['8:00 - 9:00', '9:00 - 10:00'];
    this.currentGrid = {
      headers: defaultHeaders,
      rows: Array(5).fill(null).map(() => Array(defaultHeaders.length).fill(''))
    };
  }

  onSelectionChange() {
    this.isEditMode = false;
    // Safety check: if they switch from Primary to Kindergarten, 'Year 1' isn't valid anymore!
    if (!this.yearsForSelectedLevel.includes(this.selectedYear)) {
      this.selectedYear = this.yearsForSelectedLevel[0];
    }
    this.loadSchedule();
  }

  goBack() { this.location.back(); }
  toggleEditMode() { this.isEditMode = !this.isEditMode; }

  addColumn() {
    this.currentGrid.headers.push('New Slot');
    this.currentGrid.rows.forEach((row: any[]) => row.push(''));
  }

  submitSchedule() {
    const combinedKey = `${this.selectedLevel} - ${this.selectedYear}`;

    const payload = {
      headers: JSON.stringify(this.currentGrid.headers),
      gridData: JSON.stringify(this.currentGrid.rows)
    };

    this.authService.saveSchedule(combinedKey, payload).subscribe({
      next: () => {
        alert(`Schedule for ${combinedKey} saved successfully to Database!`);
        this.isEditMode = false;
      },
      error: () => alert('Failed to save schedule.')
    });
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
