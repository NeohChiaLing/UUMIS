import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  newPlanForm = { teacherName: '', subjectName: '', fileName: '', fileBlobUrl: '' };

  lessonPlans: any[] = [
    { teacher: 'MR. ANDERSON', id: '#T-8821', subject: 'MATH', topic: 'QUADRATIC EQUATIONS', grade: 'GRADE 10', status: 'Pending Review', avatar: 'AD', pdfUrl: '' },
    { teacher: 'MS. ROBERTS', id: '#T-4402', subject: 'SCIENCE', topic: 'PHOTOSYNTHESIS', grade: 'GRADE 9', status: 'Pending Review', avatar: 'RB', pdfUrl: '' },
    { teacher: 'MR. LEE', id: '#T-9931', subject: 'HISTORY', topic: 'THE INDUSTRIAL REVOLUTION', grade: 'GRADE 11', status: 'Pending Review', avatar: 'LE', pdfUrl: '' }
  ];

  constructor(private sanitizer: DomSanitizer, private location: Location) {}

  ngOnInit() {}

  goBack() {
    this.location.back();
  }

  toggleAddingMode() {
    this.isAddingMode = !this.isAddingMode;
    if (this.isAddingMode) {
      this.newPlanForm = { teacherName: '', subjectName: '', fileName: '', fileBlobUrl: '' };
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newPlanForm.fileName = file.name;
      this.newPlanForm.fileBlobUrl = URL.createObjectURL(file);
    }
  }

  submitNewPlan() {
    if (!this.newPlanForm.teacherName || !this.newPlanForm.subjectName || !this.newPlanForm.fileName) {
      alert('Please fill in all fields and upload a PDF.');
      return;
    }
    const newEntry = {
      teacher: this.newPlanForm.teacherName.toUpperCase(),
      id: '#T-' + Math.floor(1000 + Math.random() * 9000),
      subject: this.newPlanForm.subjectName.toUpperCase(),
      topic: 'NEW CURRICULUM',
      grade: 'GRADE TBD',
      status: 'Pending Review',
      avatar: this.newPlanForm.teacherName.substring(0, 2).toUpperCase(),
      pdfUrl: this.newPlanForm.fileBlobUrl
    };
    this.lessonPlans.unshift(newEntry);
    this.isAddingMode = false;
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
