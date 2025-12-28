import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assignments.html',
  styleUrl: './assignments.css'
})
export class AssignmentsComponent implements OnInit, OnDestroy {

  // Navigation State: 'years' | 'subjects' | 'tasks'
  viewState: string = 'years';

  selectedYear: string = '';
  selectedSubject: any = null;

  // --- 1. UPDATED: Full Years Data ---
  years = [
    'Pre-Kindergarten',
    'Kindergarten',
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'
  ];

  // 2. Subjects Data (Mock)
  subjects = [
    { code: 'MATH', name: 'Mathematics', icon: 'calculate', color: 'bg-orange-50 text-orange-600' },
    { code: 'ENG', name: 'English Language', icon: 'menu_book', color: 'bg-blue-50 text-blue-600' },
    { code: 'SCI', name: 'Science', icon: 'science', color: 'bg-emerald-50 text-emerald-600' },
    { code: 'HIST', name: 'History', icon: 'history_edu', color: 'bg-purple-50 text-purple-600' },
    { code: 'ART', name: 'Art & Design', icon: 'palette', color: 'bg-pink-50 text-pink-600' },
    { code: 'PE', name: 'Physical Education', icon: 'sports_soccer', color: 'bg-sky-50 text-sky-600' }
  ];

  // 3. Assignments Data Storage
  allAssignments: any = {};

  // UI State Control
  isAddingMode: boolean = false;
  isEditing: boolean = false;

  // Modals
  showQuizStartConfirm: boolean = false;
  showAssignmentDetails: boolean = false;
  isViewingPDF: boolean = false;
  isQuizActive: boolean = false;
  showResultModal: boolean = false;

  // Data
  currentPdfUrl: SafeResourceUrl | null = null;
  clickedTask: any = null;
  quizResult: any = null;
  countdownTimer: any = null;
  remainingTimeText: string = '00:00:00';
  userAnswers: any = {};

  newTask: any = {
    type: 'Assignment', subject: '', topic: '', dueDate: '', fileName: '', fileUrl: '',
    quizDate: '', startTime: '09:00', endTime: '10:00', durationText: '1 hours 0 mins',
    durationHours: 1, durationMinutes: 0, releaseMarks: false,
    questions: []
  };

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private location: Location
  ) {
    this.resetForm();
  }

  ngOnInit() {
    // Initialize dummy data for demonstration if empty
    this.initializeMockData();
  }

  initializeMockData() {
    // Example: Populate Year 1 with some data
    if (!this.allAssignments['Year 1']) {
      this.allAssignments['Year 1'] = {
        'MATH': [
          {
            id: 2,
            type: 'Quiz',
            subject: 'MATH',
            topic: 'ADDITION',
            quizDate: '2025-12-20',
            startTime: '10:00',
            endTime: '11:06',
            durationText: '1 hours 6 mins',
            durationHours: 1,
            durationMinutes: 6,
            status: 'Active',
            releaseMarks: true,
            questions: [
              {text: 'What is 5 + 7?', options: ['10', '12', '15'], correctAnswer: 1},
              {text: 'Which number is even?', options: ['3', '7', '8'], correctAnswer: 2}
            ]
          }
        ]
      };
    }
  }

  ngOnDestroy() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  // --- Navigation Logic ---

  selectYear(year: string) {
    this.selectedYear = year;
    this.viewState = 'subjects';
  }

  selectSubject(subject: any) {
    this.selectedSubject = subject;
    this.viewState = 'tasks';
  }

  get currentTasks() {
    if (!this.selectedYear || !this.selectedSubject) return [];

    // Ensure structure exists
    if (!this.allAssignments[this.selectedYear]) {
      this.allAssignments[this.selectedYear] = {};
    }

    return this.allAssignments[this.selectedYear][this.selectedSubject.code] || [];
  }

  goBack() {
    if (this.isQuizActive) {
      this.closeQuizSession();
    } else if (this.viewState === 'tasks') {
      this.viewState = 'subjects';
      this.selectedSubject = null;
    } else if (this.viewState === 'subjects') {
      this.viewState = 'years';
      this.selectedYear = '';
    } else {
      this.location.back();
    }
  }

  // --- Existing Logic Preserved ---

  trackByIndex(index: number, obj: any): any {
    return index;
  }

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
    if (this.newTask.questions && this.newTask.questions.length > 1) {
      this.newTask.questions.splice(index, 1);
    }
  }

  addOption(questionIndex: number) {
    if (!this.newTask.questions[questionIndex].options) {
      this.newTask.questions[questionIndex].options = [];
    }
    this.newTask.questions[questionIndex].options.push('');
  }

  removeOption(qIndex: number, oIndex: number) {
    const opts = this.newTask.questions[qIndex].options;
    if (opts && opts.length > 2) {
      opts.splice(oIndex, 1);
    }
  }

  startQuiz() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.showQuizStartConfirm = false;
    this.showResultModal = false;
    this.isQuizActive = true;
    this.userAnswers = {};

    let h = parseInt(this.clickedTask?.durationHours || 0);
    let m = parseInt(this.clickedTask?.durationMinutes || 0);
    let totalSeconds = (h * 3600) + (m * 60);
    this.updateTimerText(totalSeconds);

    this.countdownTimer = setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) {
        this.submitQuiz();
        return;
      }
      this.updateTimerText(totalSeconds);
    }, 1000);
  }

  submitQuiz() {
    clearInterval(this.countdownTimer);
    let score = 0;
    const questions = this.clickedTask?.questions || [];
    questions.forEach((q: any, index: number) => {
      if (this.userAnswers[index] == q.correctAnswer) score++;
    });

    this.quizResult = {
      score: score,
      total: questions.length,
      showMarks: this.clickedTask?.releaseMarks
    };
    this.showResultModal = true;
  }

  closeQuizSession() {
    this.isQuizActive = false;
    this.showResultModal = false;
    this.quizResult = null;
  }

  updateTimerText(totalSec: number) {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
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
    this.isAddingMode = !this.isAddingMode;
    this.isEditing = false;
    if (this.isAddingMode) {
      this.resetForm();
      if (this.selectedSubject) {
        this.newTask.subject = this.selectedSubject.code;
      }
    }
  }

  saveTask() {
    if (!this.newTask.subject) {
      alert('Please enter subject.');
      return;
    }

    // Ensure structure
    if (!this.allAssignments[this.selectedYear]) {
      this.allAssignments[this.selectedYear] = {};
    }
    const subjectKey = this.selectedSubject ? this.selectedSubject.code : this.newTask.subject;

    if (!this.allAssignments[this.selectedYear][subjectKey]) {
      this.allAssignments[this.selectedYear][subjectKey] = [];
    }

    const list = this.allAssignments[this.selectedYear][subjectKey];

    if (this.isEditing) {
      const idx = list.findIndex((t: any) => t.id === this.newTask.id);
      if (idx !== -1) list[idx] = {...this.newTask};
    } else {
      list.unshift({...this.newTask, id: Date.now(), status: 'Active' });
    }
    this.isAddingMode = false;
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
      this.newTask.fileUrl = URL.createObjectURL(f);
    }
  }

  previewTask(e: Event, task: any) {
    e.stopPropagation();
    if (task.fileUrl && task.fileUrl !== '#') {
      this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(task.fileUrl);
      this.isViewingPDF = true;
    } else {
      alert('No preview available.');
    }
  }

  onCardClick(task: any) {
    this.clickedTask = task;
    if (task.type === 'Assignment') {
      this.showAssignmentDetails = true;
    } else {
      this.showQuizStartConfirm = true;
    }
  }

  confirmDownload() {
    if (this.clickedTask?.fileUrl) {
      const a = document.createElement('a');
      a.href = this.clickedTask.fileUrl;
      a.download = this.clickedTask.fileName;
      a.click();
    }
  }

  deleteTask(e: Event, id: number) {
    e.stopPropagation();
    if (confirm('Delete?')) {
      const list = this.allAssignments[this.selectedYear][this.selectedSubject.code];
      this.allAssignments[this.selectedYear][this.selectedSubject.code] = list.filter((t: any) => t.id !== id);
    }
  }
}
