import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-assignment.html',
  styleUrls: ['./student-assignment.css']
})
export class StudentAssignmentComponent implements OnInit {

  viewState: string = 'subjects';
  selectedSubject: any = null;

  studentLevel: string = '';
  studentYear: string = 'Year 1'; // Default Fallback

  subjects: any[] = [];
  allAssignments: any[] = [];
  filteredAssignments: any[] = [];

  clickedTask: any = null;
  remainingTimeText: string = '15:00';
  selectedFileName: string = '';
  selectedFile: File | null = null;
  userAnswers: any[] = [];

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.bio && user.bio !== 'Unassigned') {

            // ====================================================================
            // THE FIX: Added spaces around the hyphen so "Pre-Kindergarten"
            // doesn't accidentally get chopped in half!
            // ====================================================================
            const parts = user.bio.split(' - ');

            if (parts.length > 1) {
              this.studentLevel = parts[0].trim();
              this.studentYear = parts[1].trim();
            } else {
              this.studentYear = parts[0].trim();
            }
          }
        } catch (e) {}
      }
    }

    this.loadMyData();
  }

  loadMyData() {
    this.authService.getSubjects().subscribe({
      next: (dbSubjects) => {

        const mySubjects = dbSubjects.filter(s => {
          const subYear = (s.yearGroup || '').trim().toLowerCase();
          return subYear === this.studentYear.toLowerCase();
        });

        this.authService.getAssignments().subscribe({
          next: (assignmentsRes) => {
            const myAssignments = assignmentsRes.filter(a => {
              const taskYear = (a.yearGroup || '').trim().toLowerCase();
              return taskYear === this.studentYear.toLowerCase();
            });

            this.allAssignments = myAssignments.map(a => {
              return {
                id: a.id,
                type: a.type,
                subjectCode: a.subject,
                title: a.topic,
                deadline: a.dueDate,
                status: a.status || 'Incomplete',
                fileName: a.fileName,
                fileUrl: a.fileUrl,
                questions: a.questionsJson ? JSON.parse(a.questionsJson) : [],
                durationText: a.durationText
              };
            });

            const colors = ['bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-pink-50 text-pink-600', 'bg-orange-50 text-orange-600', 'bg-emerald-50 text-emerald-600'];

            this.subjects = mySubjects.map((sub, index) => {
              const subCode = sub.code || sub.name;
              return {
                code: subCode,
                name: sub.name,
                tasksCount: this.allAssignments.filter(a => a.subjectCode === subCode).length,
                icon: sub.icon || 'menu_book',
                color: colors[index % colors.length]
              };
            });
          }
        });
      },
      error: () => console.log('Failed to fetch subjects')
    });
  }

  // --- UI Routing Functions ---
  selectSubject(subject: any): void {
    this.selectedSubject = subject;
    this.filteredAssignments = this.allAssignments.filter(a => a.subjectCode === subject.code);
    this.viewState = 'assignments';
  }

  openTask(task: any): void {
    this.clickedTask = task;
    if (task.type && task.type.toLowerCase() === 'quiz') {
      this.viewState = 'quiz';
      this.userAnswers = new Array(task.questions?.length || 0).fill(null);
    } else {
      this.viewState = 'details';
    }
  }

  submitQuiz(): void {
    alert('Quiz Submitted Successfully!');
    this.clickedTask.status = 'Submitted';
    this.viewState = 'assignments';
    this.clickedTask = null;
  }

  submitAssignment(): void {
    if (!this.selectedFile) { alert('Please select a file first!'); return; }
    alert(`Assignment "${this.selectedFileName}" Submitted!`);
    this.clickedTask.status = 'Submitted';
    this.selectedFile = null; this.selectedFileName = ''; this.viewState = 'assignments'; this.clickedTask = null;
  }

  confirmDownload(): void {
    if (this.clickedTask?.fileUrl) {
      const a = document.createElement('a');
      a.href = this.clickedTask.fileUrl;
      a.download = this.clickedTask.fileName || 'Download.pdf';
      a.click();
    } else {
      alert("No file attached to this assignment.");
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  goBack(): void {
    if (this.viewState === 'quiz' || this.viewState === 'details') {
      this.viewState = 'assignments';
      this.clickedTask = null;
    }
    else if (this.viewState === 'assignments') {
      this.viewState = 'subjects';
      this.selectedSubject = null;
    }
    else {
      this.location.back();
    }
  }
}
