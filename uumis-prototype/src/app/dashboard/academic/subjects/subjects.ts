import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // 导入 Router

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
    'business_center', 'functions', 'devices', 'trending_up', 'add_circle'
  ];

  categories = ['Languages', 'Core Sciences', 'Arts & Humanities', 'Humanities', 'Others'];

  subjects = [
    { name: 'English & English as A Second Language', code: 'ENG-101', category: 'Languages', status: 'Active', isEditing: false, icon: 'translate' },
    { name: 'Mathematics', code: 'MATH-101', category: 'Core Sciences', status: 'Active', isEditing: false, icon: 'calculate' },
    { name: 'Malay', code: 'MAL-101', category: 'Languages', status: 'Active', isEditing: false, icon: 'language' },
    { name: 'Islamic Studies/Moral', code: 'ISM-105', category: 'Humanities', status: 'Active', isEditing: false, icon: 'menu_book' },
    { name: 'Mandarin/Arabic', code: 'MAN-202', category: 'Languages', status: 'Active', isEditing: false, icon: 'interpreter_mode' },
    { name: 'Physical Education', code: 'PE-100', category: 'Others', status: 'Active', isEditing: false, icon: 'sports_soccer' },
    { name: 'Sensorial & Practical Life', code: 'SEN-001', category: 'Others', status: 'Active', isEditing: false, icon: 'accessibility_new' },
    { name: 'Science', code: 'SCI-101', category: 'Core Sciences', status: 'Active', isEditing: false, icon: 'science' },
    { name: 'Art', code: 'ART-101', category: 'Arts & Humanities', status: 'Active', isEditing: false, icon: 'palette' },
    { name: 'Social Studies', code: 'SOC-101', category: 'Arts & Humanities', status: 'Active', isEditing: false, icon: 'public' },
    { name: 'Geography', code: 'GEO-101', category: 'Arts & Humanities', status: 'Active', isEditing: false, icon: 'map' },
    { name: 'Global Perspectives', code: 'GP-101', category: 'Arts & Humanities', status: 'Active', isEditing: false, icon: 'language' },
    { name: 'History', code: 'HIST-101', category: 'Arts & Humanities', status: 'Active', isEditing: false, icon: 'history_edu' },
    { name: 'Computer Science / Computing', code: 'CS-101', category: 'Core Sciences', status: 'Active', isEditing: false, icon: 'computer' },
    { name: 'Biology', code: 'BIO-101', category: 'Core Sciences', status: 'Active', isEditing: false, icon: 'biotech' },
    { name: 'Chemistry', code: 'CHEM-101', category: 'Core Sciences', status: 'Active', isEditing: false, icon: 'ev_station' },
    { name: 'Physics', code: 'PHYS-101', category: 'Core Sciences', status: 'Active', isEditing: false, icon: 'flare' },
    { name: 'Business Studies', code: 'BUS-101', category: 'Humanities', status: 'Active', isEditing: false, icon: 'business_center' },
    { name: 'Additional Mathematics', code: 'AM-101', category: 'Core Sciences', status: 'Active', isEditing: false, icon: 'functions' },
    { name: 'ICT', code: 'ICT-101', category: 'Core Sciences', status: 'Active', isEditing: false, icon: 'devices' },
    { name: 'Economics', code: 'ECON-101', category: 'Humanities', status: 'Active', isEditing: false, icon: 'trending_up' }
  ];

  constructor(private router: Router) {} // 注入 Router

  ngOnInit() {}

  // 导航回主面板
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
      name: '', code: 'NEW-00', category: 'Others', status: 'Active', isEditing: true, icon: 'add_circle'
    });
  }

  toggleEdit(subject: any, index: number) {
    subject.isEditing = !subject.isEditing;
    if (!subject.isEditing) this.showIconPickerIndex = null;
  }

  selectIcon(subject: any, icon: string) {
    subject.icon = icon;
    this.showIconPickerIndex = null;
  }

  deleteSubject(index: number) {
    if(confirm('Delete this subject?')) this.subjects.splice(index, 1);
  }

  saveAll() {
    this.subjects.forEach(s => s.isEditing = false);
    alert('Curriculum Changes Submitted!');
  }
}
