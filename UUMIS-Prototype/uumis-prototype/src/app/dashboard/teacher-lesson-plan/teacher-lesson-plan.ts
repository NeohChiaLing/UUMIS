import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-lesson-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-lesson-plan.html',
  styles: []
})
export class TeacherLessonPlanComponent implements OnInit {
  isAddingMode: boolean = false;
  isViewingPDF: boolean = false;
  currentPdfUrl: SafeResourceUrl | null = null;

  newPlanForm = { teacherName: '', subjectName: '', topic: '', level: '', year: '', fileName: '', fileBlobUrl: '' };

  lessonPlans: any[] = [];

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
    private sanitizer: DomSanitizer,
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.newPlanForm.teacherName = user.fullName || user.username || 'Teacher';
      }
    }
    this.loadPlans();
  }

  loadPlans() {
    this.authService.getLessonPlans().subscribe({
      next: (data) => {
        this.lessonPlans = data.filter(p => p.teacher.includes(this.newPlanForm.teacherName.toUpperCase()));
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
      const currentTeacher = this.newPlanForm.teacherName;
      this.newPlanForm = { teacherName: currentTeacher, subjectName: '', topic: '', level: '', year: '', fileName: '', fileBlobUrl: '' };
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
    if (!this.newPlanForm.teacherName || !this.newPlanForm.subjectName || !this.newPlanForm.topic || !this.newPlanForm.level || !this.newPlanForm.year || !this.newPlanForm.fileName) {
      alert('Please fill in all fields and upload a PDF.');
      return;
    }

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
        alert("Lesson Plan Submitted Successfully! Waiting for Admin Approval.");
        this.isAddingMode = false;
        this.loadPlans();
      },
      error: () => alert("Failed to submit lesson plan.")
    });
  }

  // --- NEW: Delete Plan Logic ---
  deletePlan(plan: any) {
    const confirmDelete = confirm(`Are you sure you want to delete the lesson plan for ${plan.subject}?`);
    if (confirmDelete) {
      if (plan.id) {
        this.authService.deleteLessonPlan(plan.id).subscribe({
          next: () => {
            alert("Lesson Plan deleted successfully!");
            this.loadPlans(); // Refresh the list
          },
          error: () => alert("Failed to delete lesson plan.")
        });
      }
    }
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

  downloadPDF(plan: any) {
    if (plan.pdfUrl) {
      const link = document.createElement('a');
      link.href = plan.pdfUrl;
      link.download = `${plan.subject}_Plan.pdf`;
      link.click();
    }
  }
}
