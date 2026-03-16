import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assignments.html',
  styleUrl: './assignments.css'
})
export class AssignmentsComponent implements OnInit, OnDestroy {

  viewState: string = 'years';
  selectedYear: string = '';
  selectedSubject: any = null;

  years = [
    'Pre-Kindergarten', 'Kindergarten',
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'
  ];

  // Data Storage
  allSubjectsFromDb: any[] = [];
  subjects: any[] = []; // Currently displayed subjects
  allAssignments: any = {};

  // UI State Control
  isAddingMode: boolean = false;
  isEditing: boolean = false;
  showQuizStartConfirm: boolean = false;
  showAssignmentDetails: boolean = false;
  isViewingPDF: boolean = false;
  isQuizActive: boolean = false;
  showResultModal: boolean = false;

  currentPdfUrl: SafeResourceUrl | null = null;
  clickedTask: any = null;
  quizResult: any = null;
  countdownTimer: any = null;
  remainingTimeText: string = '00:00:00';
  userAnswers: any = {};

  newTask: any = {};

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private location: Location,
    private authService: AuthService
  ) {
    this.resetForm();
  }

  ngOnInit() {
    this.loadSubjects();
    this.loadAssignments();
  }

  ngOnDestroy() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  // --- 1. Fetch all subjects but store them for filtering later ---
  loadSubjects() {
    this.authService.getSubjects().subscribe({
      next: (res) => {
        this.allSubjectsFromDb = res; // Store all subjects from backend
      }
    });
  }

  loadAssignments() {
    this.authService.getAssignments().subscribe({
      next: (res) => {
        this.allAssignments = {};
        res.forEach(a => {
          if (!this.allAssignments[a.yearGroup]) this.allAssignments[a.yearGroup] = {};
          if (!this.allAssignments[a.yearGroup][a.subject]) this.allAssignments[a.yearGroup][a.subject] = [];

          a.questions = a.questionsJson ? JSON.parse(a.questionsJson) : [];
          this.allAssignments[a.yearGroup][a.subject].push(a);
        });
      }
    });
  }

  // --- 2. Filter subjects precisely based on the Year Group clicked ---
  selectYear(year: string) {
    this.selectedYear = year;
    const colors = ['bg-orange-50 text-orange-600', 'bg-blue-50 text-blue-600', 'bg-emerald-50 text-emerald-600', 'bg-purple-50 text-purple-600', 'bg-pink-50 text-pink-600', 'bg-sky-50 text-sky-600'];

    // Only show subjects assigned to this year in the database!
    const filteredSubjects = this.allSubjectsFromDb.filter(s => s.yearGroup === year);

    this.subjects = filteredSubjects.map((s: any, i: number) => ({
      code: s.code || s.name,
      name: s.name,
      icon: s.icon || 'menu_book',
      color: colors[i % colors.length]
    }));

    this.viewState = 'subjects';
  }

  selectSubject(subject: any) {
    this.selectedSubject = subject;
    this.viewState = 'tasks';
  }

  get currentTasks() {
    if (!this.selectedYear || !this.selectedSubject) return [];
    if (!this.allAssignments[this.selectedYear]) this.allAssignments[this.selectedYear] = {};
    return this.allAssignments[this.selectedYear][this.selectedSubject.code] || [];
  }

  goBack() {
    if (this.isQuizActive) { this.closeQuizSession(); }
    else if (this.viewState === 'tasks') { this.viewState = 'subjects'; this.selectedSubject = null; }
    else if (this.viewState === 'subjects') { this.viewState = 'years'; this.selectedYear = ''; }
    else { this.location.back(); }
  }

  trackByIndex(index: number, obj: any): any { return index; }

  resetForm() {
    this.newTask = {
      type: 'Assignment', subject: '', topic: '', dueDate: '', fileName: '', fileUrl: '',
      quizDate: '', startTime: '09:00', endTime: '10:00', durationText: '1 hours 0 mins',
      durationHours: 1, durationMinutes: 0, releaseMarks: false,
      questions: [{text: '', options: ['', ''], correctAnswer: 0}]
    };
  }

  addQuestion() {
    if (!this.newTask.questions) this.newTask.questions = [];
    this.newTask.questions.push({text: '', options: ['', ''], correctAnswer: 0});
  }

  removeQuestion(index: number) {
    if (this.newTask.questions && this.newTask.questions.length > 1) this.newTask.questions.splice(index, 1);
  }

  addOption(qIndex: number) {
    if (!this.newTask.questions[qIndex].options) this.newTask.questions[qIndex].options = [];
    this.newTask.questions[qIndex].options.push('');
  }

  removeOption(qIndex: number, oIndex: number) {
    const opts = this.newTask.questions[qIndex].options;
    if (opts && opts.length > 2) opts.splice(oIndex, 1);
  }

  startQuiz() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.showQuizStartConfirm = false; this.showResultModal = false; this.isQuizActive = true; this.userAnswers = {};
    let h = parseInt(this.clickedTask?.durationHours || 0); let m = parseInt(this.clickedTask?.durationMinutes || 0);
    let totalSeconds = (h * 3600) + (m * 60);
    this.updateTimerText(totalSeconds);
    this.countdownTimer = setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) { this.submitQuiz(); return; }
      this.updateTimerText(totalSeconds);
    }, 1000);
  }

  submitQuiz() {
    clearInterval(this.countdownTimer);
    let score = 0; const questions = this.clickedTask?.questions || [];
    questions.forEach((q: any, index: number) => { if (this.userAnswers[index] == q.correctAnswer) score++; });
    this.quizResult = { score: score, total: questions.length, showMarks: this.clickedTask?.releaseMarks };
    this.showResultModal = true;
  }

  closeQuizSession() { this.isQuizActive = false; this.showResultModal = false; this.quizResult = null; }

  updateTimerText(totalSec: number) {
    const hours = Math.floor(totalSec / 3600); const minutes = Math.floor((totalSec % 3600) / 60); const seconds = totalSec % 60;
    this.remainingTimeText = `${hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  calculateDuration() {
    if (!this.newTask.startTime || !this.newTask.endTime) return;
    const [h1, m1] = this.newTask.startTime.split(':').map(Number);
    const [h2, m2] = this.newTask.endTime.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 1440;
    this.newTask.durationHours = Math.floor(diff / 60);
    this.newTask.durationMinutes = diff % 60;
    this.newTask.durationText = `${this.newTask.durationHours} hours ${this.newTask.durationMinutes} mins`;
  }

  toggleAdding() {
    this.isAddingMode = !this.isAddingMode; this.isEditing = false;
    if (this.isAddingMode) {
      this.resetForm();
      if (this.selectedSubject) this.newTask.subject = this.selectedSubject.code;
    }
  }

  saveTask() {
    if (!this.newTask.subject || !this.newTask.topic) { alert('Please fill out Subject and Topic.'); return; }
    this.newTask.yearGroup = this.selectedYear;
    this.newTask.status = 'Active';
    this.newTask.questionsJson = JSON.stringify(this.newTask.questions || []);

    if (this.isEditing) {
      this.authService.updateAssignment(this.newTask.id, this.newTask).subscribe({
        next: () => { this.loadAssignments(); this.isAddingMode = false; },
        error: () => alert('Failed to update task.')
      });
    } else {
      this.authService.saveAssignment(this.newTask).subscribe({
        next: () => { this.loadAssignments(); this.isAddingMode = false; },
        error: () => alert('Failed to save task.')
      });
    }
  }

  editTask(event: Event, task: any) {
    event.stopPropagation();
    this.newTask = JSON.parse(JSON.stringify(task));
    this.isEditing = true;
    this.isAddingMode = true;
  }

  onFileSelected(e: any) {
    const f = e.target.files[0];
    if (f) {
      this.newTask.fileName = f.name;
      const reader = new FileReader();
      reader.onload = (event: any) => { this.newTask.fileUrl = event.target.result; };
      reader.readAsDataURL(f);
    }
  }

  previewTask(e: Event, task: any) {
    e.stopPropagation();
    if (task.fileUrl && task.fileUrl !== '#') {
      this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(task.fileUrl);
      this.isViewingPDF = true;
    } else { alert('No preview available.'); }
  }

  onCardClick(task: any) {
    this.clickedTask = task;
    if (task.type === 'Assignment') this.showAssignmentDetails = true;
    else this.showQuizStartConfirm = true;
  }

  confirmDownload() {
    if (this.clickedTask?.fileUrl) {
      const a = document.createElement('a'); a.href = this.clickedTask.fileUrl; a.download = this.clickedTask.fileName; a.click();
    }
  }

  deleteTask(e: Event, id: number) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task?')) {
      this.authService.deleteAssignment(id).subscribe({
        next: () => this.loadAssignments(),
        error: () => alert('Failed to delete task.')
      });
    }
  }
}
