import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subjects.html',
  styleUrl: './subjects.css'
})
export class SubjectsComponent implements OnInit {
  searchQuery: string = '';
  selectedCategory: string = 'All';
  showIconPickerIndex: number | null = null;

  availableIcons = [
    'translate', 'calculate', 'language', 'menu_book', 'interpreter_mode',
    'sports_soccer', 'accessibility_new', 'science', 'palette', 'public',
    'map', 'history_edu', 'computer', 'biotech', 'ev_station', 'flare',
    'business_center', 'functions', 'devices', 'trending_up', 'add_circle',
    'music_note', 'engineering', 'psychology', 'gavel', 'local_library'
  ];

  categories = ['Languages', 'Core Sciences', 'Arts & Humanities', 'Humanities', 'Others'];

  academicLevels = ['Kindergarten', 'Primary', 'Lower Secondary', 'Upper Secondary', 'KAFA'];

  getYearsForLevel(level: string): string[] {
    if (level === 'Kindergarten') return ['Pre-Kindergarten', 'Kindergarten'];
    if (level === 'Primary') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    if (level === 'Lower Secondary') return ['Year 7', 'Year 8', 'Year 9'];
    if (level === 'Upper Secondary') return ['Year 10', 'Year 11'];
    if (level === 'KAFA') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    return [];
  }

  subjects: any[] = [];

  defaultSubjects = [
    { name: 'English & English as A Second Language', code: 'ENG-101', category: 'Languages', level: 'Primary', yearGroup: 'Year 1', active: true, isEditing: false, icon: 'translate' },
    { name: 'Mathematics', code: 'MATH-101', category: 'Core Sciences', level: 'Primary', yearGroup: 'Year 1', active: true, isEditing: false, icon: 'calculate' },
    { name: 'Malay', code: 'MAL-101', category: 'Languages', level: 'Primary', yearGroup: 'Year 1', active: true, isEditing: false, icon: 'language' }
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.authService.getSubjects().subscribe({
      next: (data: any[]) => {
        if (data.length === 0) {
          this.subjects = JSON.parse(JSON.stringify(this.defaultSubjects));
        } else {
          // THE FIX: Map year_group from the database directly to yearGroup in Angular!
          this.subjects = data.map(item => ({
            ...item,
            yearGroup: item.year_group || item.yearGroup || '',
            isEditing: false
          }));
        }
      },
      error: (err) => console.error('Failed to load subjects', err)
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/admin']);
  }

  get filteredSubjects() {
    return this.subjects.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || s.code.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchCategory = this.selectedCategory === 'All' || s.category === this.selectedCategory;
      return matchSearch && matchCategory;
    });
  }

  addNewSubject() {
    this.subjects.unshift({
      name: '', code: 'NEW-00', category: 'Others', level: '', yearGroup: '', active: false, isEditing: true, icon: 'add_circle'
    });
  }

  selectIcon(subject: any, icon: string) {
    subject.icon = icon;
    this.showIconPickerIndex = null;
  }

  deleteSubject(index: number, subject: any) {
    if(confirm('Delete this subject?')) {
      if (subject.id) {
        this.authService.deleteSubject(subject.id).subscribe({
          next: () => this.subjects.splice(index, 1),
          error: (err) => alert('Failed to delete subject from database.')
        });
      } else {
        this.subjects.splice(index, 1);
      }
    }
  }

  saveAll() {
    this.subjects.forEach(s => s.isEditing = false);

    const payload = this.subjects.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      category: s.category,
      level: s.level,
      yearGroup: s.yearGroup,
      active: s.active,
      icon: s.icon
    }));

    this.authService.saveSubjects(payload).subscribe({
      next: (res) => {
        alert('Curriculum Changes Submitted and saved to Database!');
        this.loadSubjects();
      },
      error: (err) => alert('Failed to save changes.')
    });
  }
}
