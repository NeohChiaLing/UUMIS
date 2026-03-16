import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-lesson-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lesson-plan.html',
  styleUrl: './lesson-plan.css'
})
export class LessonPlanComponent implements OnInit {
  searchQuery: string = '';
  selectedGrade: string = 'All Grades';

  isAddingMode: boolean = false;
  isViewingPDF: boolean = false;
  currentPdfUrl: SafeResourceUrl | null = null;

  // FIX 1: Form now uses level and year instead of a single grade string
  newPlanForm = { teacherName: '', subjectName: '', topic: '', level: '', year: '', fileName: '', fileBlobUrl: '' };

  lessonPlans: any[] = [];

  defaultPlans = [
    { teacher: 'MR. ANDERSON', teacherId: '#T-8821', subject: 'MATH', topic: 'QUADRATIC EQUATIONS', grade: 'UPPER SECONDARY - YEAR 10', status: 'Pending Review', avatar: 'AD', pdfUrl: '' }
  ];

  // FIX 1: Academic Levels and Years for the dropdowns
  academicLevels = ['Kindergarten', 'Primary', 'Lower Secondary', 'Upper Secondary', 'KAFA'];

  getYearsForLevel(level: string): string[] {
    if (level === 'Kindergarten') return ['Pre-Kindergarten', 'Kindergarten'];
    if (level === 'Primary') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    if (level === 'Lower Secondary') return ['Year 7', 'Year 8', 'Year 9'];
    if (level === 'Upper Secondary') return ['Year 10', 'Year 11'];
    if (level === 'KAFA') return ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
    return [];
  }

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.authService.getLessonPlans().subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.lessonPlans = JSON.parse(JSON.stringify(this.defaultPlans));
        } else {
          this.lessonPlans = data;
        }
      },
      error: () => console.error("Failed to load lesson plans")
    });
  }

  goBack() {
    this.location.back();
  }

  toggleAddingMode() {
    this.isAddingMode = !this.isAddingMode;
    if (this.isAddingMode) {
      this.newPlanForm = { teacherName: '', subjectName: '', topic: '', level: '', year: '', fileName: '', fileBlobUrl: '' };
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newPlanForm.fileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newPlanForm.fileBlobUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  submitNewPlan() {
    // Check all fields
    if (!this.newPlanForm.teacherName || !this.newPlanForm.subjectName || !this.newPlanForm.topic || !this.newPlanForm.level || !this.newPlanForm.year || !this.newPlanForm.fileName) {
      alert('Please fill in all fields and upload a PDF.');
      return;
    }

    // Combine Level and Year for the database
    const combinedGrade = `${this.newPlanForm.level} - ${this.newPlanForm.year}`;

    const newEntry = {
      teacher: this.newPlanForm.teacherName.toUpperCase(),
      teacherId: '#T-' + Math.floor(1000 + Math.random() * 9000),
      subject: this.newPlanForm.subjectName.toUpperCase(),
      topic: this.newPlanForm.topic.toUpperCase(),
      grade: combinedGrade.toUpperCase(),
      status: 'Pending Review',
      avatar: this.newPlanForm.teacherName.substring(0, 2).toUpperCase(),
      pdfUrl: this.newPlanForm.fileBlobUrl,
      fileName: this.newPlanForm.fileName
    };

    this.authService.submitLessonPlan(newEntry).subscribe({
      next: () => {
        alert("Lesson Plan Submitted Successfully!");
        this.isAddingMode = false;
        this.loadPlans();
      },
      error: () => alert("Failed to submit lesson plan.")
    });
  }

  viewPDF(plan: any) {
    if (plan.pdfUrl) {
      this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(plan.pdfUrl);
      this.isViewingPDF = true;
    } else {
      alert('This record was created without a PDF file for preview.');
    }
  }

  closePDFViewer() {
    this.isViewingPDF = false;
    this.currentPdfUrl = null;
  }

  approvePlan(plan: any) {
    if(plan.id) {
      this.authService.updateLessonPlanStatus(plan.id, 'Approved').subscribe(() => plan.status = 'Approved');
    } else { plan.status = 'Approved'; }
  }

  rejectPlan(plan: any) {
    if(plan.id) {
      this.authService.updateLessonPlanStatus(plan.id, 'Needs Revision').subscribe(() => plan.status = 'Needs Revision');
    } else { plan.status = 'Needs Revision'; }
  }

  downloadPDF(plan: any) {
    if (plan.pdfUrl) {
      const link = document.createElement('a');
      link.href = plan.pdfUrl;
      link.download = `${plan.subject}_Plan.pdf`;
      link.click();
    }
  }
}
