import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Added Location
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-assignment.html',
  styleUrls: ['./student-assignment.css']
})
export class StudentAssignmentComponent {

  // Navigation State: 'subjects' | 'assignments' | 'details' | 'quiz'
  viewState: string = 'subjects';
  selectedSubject: any = null;

  // --- 1. Enrolled Subjects Data ---
  subjects = [
    { code: 'STID 3014', name: 'Database Systems', tasksCount: 3, icon: 'database', color: 'bg-blue-50 text-blue-600' },
    { code: 'STIW 3054', name: 'Real-Time Programming', tasksCount: 1, icon: 'code', color: 'bg-purple-50 text-purple-600' },
    { code: 'STIM 2013', name: 'Multimedia Design', tasksCount: 2, icon: 'palette', color: 'bg-pink-50 text-pink-600' },
    { code: 'STQS 1023', name: 'Mathematics', tasksCount: 4, icon: 'calculate', color: 'bg-orange-50 text-orange-600' },
    { code: 'STIA 1113', name: 'Programming 1', tasksCount: 0, icon: 'terminal', color: 'bg-emerald-50 text-emerald-600' }
  ];

  // --- 2. All Assignments Data ---
  allAssignments = [
    {
      subjectCode: 'STID 3014',
      subject: 'STID 3014',
      topic: 'Project Proposal',
      title: 'Project Proposal',
      deadline: '2023-12-25',
      status: 'Pending',
      type: 'Assignment'
    },
    {
      subjectCode: 'STIW 3054',
      subject: 'STIW 3054',
      topic: 'Real-Time Quiz',
      title: 'Chapter 1 Quiz',
      deadline: '2023-12-28',
      status: 'Incomplete',
      type: 'Quiz',
      questions: [
        { text: 'What is a thread?', options: ['Process', 'Lightweight Process', 'Task'] },
        { text: 'Java Keyword for thread?', options: ['run()', 'start()', 'synchronized'] }
      ]
    },
    {
      subjectCode: 'STIM 2013',
      subject: 'STIM 2013',
      topic: 'UI/UX Design',
      title: 'Wireframe Submission',
      deadline: '2023-12-30',
      status: 'Submitted',
      type: 'Assignment'
    }
  ];

  // Filtered list based on selected subject
  filteredAssignments: any[] = [];

  // --- 3. Task Details & Quiz State ---
  clickedTask: any = null;
  remainingTimeText: string = '15:00';
  selectedFileName: string = '';
  selectedFile: File | null = null;
  userAnswers: any[] = [];

  constructor(private location: Location) {}

  // --- FUNCTIONS ---

  selectSubject(subject: any): void {
    this.selectedSubject = subject;
    // Filter assignments for this subject
    this.filteredAssignments = this.allAssignments.filter(a => a.subjectCode === subject.code);
    this.viewState = 'assignments';
  }

  openTask(task: any): void {
    this.clickedTask = task;
    if (task.type.toLowerCase() === 'quiz') {
      this.viewState = 'quiz';
      // Reset quiz answers
      this.userAnswers = new Array(task.questions?.length || 0).fill(null);
    } else {
      this.viewState = 'details';
    }
  }

  submitQuiz(): void {
    alert('Quiz Submitted Successfully!');
    this.viewState = 'assignments';
    this.clickedTask = null;
  }

  submitAssignment(): void {
    if (!this.selectedFile) {
      alert('Please select a file first!');
      return;
    }
    alert(`Assignment "${this.selectedFileName}" Submitted!`);
    this.selectedFile = null;
    this.selectedFileName = '';
    this.viewState = 'assignments';
    this.clickedTask = null;
  }

  confirmDownload(): void {
    alert('Downloading question file...');
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
      this.viewState = 'assignments'; // Back to list
      this.clickedTask = null;
    } else if (this.viewState === 'assignments') {
      this.viewState = 'subjects'; // Back to subjects
      this.selectedSubject = null;
    } else {
      this.location.back(); // Back to Dashboard
    }
  }
}
