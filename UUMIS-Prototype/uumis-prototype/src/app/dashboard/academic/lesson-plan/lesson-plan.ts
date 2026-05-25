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

  newPlanForm = { teacherName: '', subjectName: '', topic: '', level: '', year: '', fileName: '', fileBlobUrl: '' };

  lessonPlans: any[] = [];

  defaultPlans = [
    { teacher: 'MR. ANDERSON', teacherId: '#T-8821', subject: 'MATH', topic: 'QUADRATIC EQUATIONS', grade: 'UPPER SECONDARY - YEAR 10', status: 'Pending Review', avatar: 'AD', pdfUrl: '' }
  ];

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
      next: (data: any[]) => {
        if (!data || data.length === 0) {
          this.lessonPlans = JSON.parse(JSON.stringify(this.defaultPlans));
        } else {
          // THE FIX: Robust database mapping for both naming conventions
          this.lessonPlans = data.map(p => ({
            ...p,
            teacherId: p.teacher_id || p.teacherId,
            pdfUrl: p.pdf_url || p.pdfUrl,
            fileName: p.file_name || p.fileName
          }));
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
    if (!this.newPlanForm.teacherName || !this.newPlanForm.subjectName || !this.newPlanForm.topic || !this.newPlanForm.level || !this.newPlanForm.year || !this.newPlanForm.fileName) {
      alert('Please fill in all fields and upload a PDF.');
      return;
    }

    const combinedGrade = `${this.newPlanForm.level} - ${this.newPlanForm.year}`;
    const generatedId = '#T-' + Math.floor(1000 + Math.random() * 9000);

    // THE FIX: Provide both conventions to prevent DB nulls
    const newEntry = {
      teacher: this.newPlanForm.teacherName.toUpperCase(),
      teacherId: generatedId,
      teacher_id: generatedId,
      subject: this.newPlanForm.subjectName.toUpperCase(),
      topic: this.newPlanForm.topic.toUpperCase(),
      grade: combinedGrade.toUpperCase(),
      status: 'Pending Review',
      avatar: this.newPlanForm.teacherName.substring(0, 2).toUpperCase(),
      pdfUrl: this.newPlanForm.fileBlobUrl,
      pdf_url: this.newPlanForm.fileBlobUrl,
      fileName: this.newPlanForm.fileName,
      file_name: this.newPlanForm.fileName
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
    // Check both potential naming locations
    const pdfData = plan.pdfUrl || plan.pdf_url;

    if (pdfData) {
      this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfData);
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

  // THE FIX: Robust download logic for converting Base64 safely
  downloadPDF(plan: any) {
    const pdfData = plan.pdfUrl || plan.pdf_url;
    const fName = plan.fileName || plan.file_name || `${plan.subject}_Plan.pdf`;

    if (!pdfData) {
      alert('No PDF file attached to this record.');
      return;
    }

    try {
      if (pdfData.startsWith('data:')) {
        const arr = pdfData.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fName;
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        const link = document.createElement('a');
        link.href = pdfData;
        link.download = fName;
        link.click();
      }
    } catch (e) {
      console.error('Error downloading file', e);
      alert('Failed to download the file. The data format may be invalid.');
    }
  }
}
