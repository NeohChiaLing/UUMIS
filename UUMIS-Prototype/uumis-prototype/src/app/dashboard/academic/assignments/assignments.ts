import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

  allSubjectsFromDb: any[] = [];
  subjects: any[] = [];
  allAssignments: any = {};

  isAddingMode: boolean = false;
  isEditing: boolean = false;
  showQuizStartConfirm: boolean = false;
  showAssignmentDetails: boolean = false;
  isViewingPDF: boolean = false;
  isQuizActive: boolean = false;
  showResultModal: boolean = false;

  showGradeModal: boolean = false;
  gradingStudent: any = null;
  gradingScore: string = '';

  currentPdfUrl: SafeResourceUrl | null = null;
  clickedTask: any = null;
  quizResult: any = null;
  countdownTimer: any = null;
  remainingTimeText: string = '00:00:00';
  userAnswers: any = {};
  newTask: any = {};

  taskSubmissions: any[] = [];
  isLoadingSubmissions: boolean = false;

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

  loadSubjects() {
    this.authService.getSubjects().subscribe({
      next: (res) => { this.allSubjectsFromDb = res; }
    });
  }

  loadAssignments() {
    this.authService.getAssignments().subscribe({
      next: (res) => {
        this.allAssignments = {};
        const now = new Date();

        res.forEach(a => {
          const yG = a.yearGroup || a.year_group || '';
          if (!this.allAssignments[yG]) this.allAssignments[yG] = {};
          if (!this.allAssignments[yG][a.subject]) this.allAssignments[yG][a.subject] = [];

          a.questions = a.questionsJson || a.questions_json ? JSON.parse(a.questionsJson || a.questions_json) : [];
          a.startTime = a.startTime || a.start_time || '09:00';
          a.endTime = a.endTime || a.end_time || '10:00';
          a.quizDate = a.quizDate || a.quiz_date || '';
          a.dueDate = a.dueDate || a.due_date || '';
          a.fileName = a.fileName || a.file_name || '';
          a.fileUrl = a.fileUrl || a.file_url || '';
          a.durationText = a.durationText || a.duration_text || '';

          let isReleased = false;
          if (a.releaseMarks !== undefined && a.releaseMarks !== null) {
            isReleased = a.releaseMarks === 1 || a.releaseMarks === true || a.releaseMarks === '1' || (a.releaseMarks.data && a.releaseMarks.data[0] === 1);
          } else if (a.release_marks !== undefined && a.release_marks !== null) {
            isReleased = a.release_marks === 1 || a.release_marks === true || a.release_marks === '1' || (a.release_marks.data && a.release_marks.data[0] === 1);
          }
          a.releaseMarks = isReleased;

          if (a.type === 'Quiz' && a.quizDate && a.endTime) {
            const quizEnd = new Date(`${a.quizDate}T${a.endTime}`);
            a.isPastDue = now > quizEnd;
            a.dynamicStatus = a.isPastDue ? 'Completed' : 'Active';
          } else if (a.type === 'Assignment' && a.dueDate) {
            const assignEnd = new Date(a.dueDate);
            a.isPastDue = now > assignEnd;
            a.dynamicStatus = a.isPastDue ? 'Completed' : 'Active';
          } else {
            a.isPastDue = false;
            a.dynamicStatus = 'Active';
          }

          this.allAssignments[yG][a.subject].push(a);
        });
      }
    });
  }

  selectYear(year: string) {
    this.selectedYear = year;
    const colors = ['bg-orange-50 text-orange-600', 'bg-blue-50 text-blue-600', 'bg-emerald-50 text-emerald-600', 'bg-purple-50 text-purple-600', 'bg-pink-50 text-pink-600', 'bg-sky-50 text-sky-600'];

    const filteredSubjects = this.allSubjectsFromDb.filter(s => {
      const subYear = s.yearGroup || s.year_group || '';
      return subYear.trim().toLowerCase() === year.toLowerCase();
    });

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
    else if (this.viewState === 'submissions') { this.viewState = 'tasks'; this.clickedTask = null; }
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

    if (totalSeconds <= 0) totalSeconds = 600;

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

  viewSubmissions(event: Event, task: any) {
    event.stopPropagation();

    this.clickedTask = task;
    this.viewState = 'submissions';
    this.isLoadingSubmissions = true;

    const subjectName = `${task.type}: ${task.topic}`;
    const oldSubjectName = `TASK_${task.id}`;

    // 获取当前老师点击的班级，比如 "Year 1"
    const currentYearGroup = this.selectedYear;

    this.authService.getUsers().subscribe(users => {
      // 1. 获取本班级档案里的正常学生
      const classStudents = users.filter(u => {
        if ((u.role || '').toLowerCase() !== 'student') return false;
        const yG = (u.bio || '').includes(' - ') ? (u.bio || '').split(' - ')[1]?.trim().toLowerCase() : (u.bio || '').trim().toLowerCase();
        return yG === currentYearGroup.toLowerCase();
      });

      // 2. ⭐ 安全直连读取：同时发送 subject 和 yearGroup 给数据库，严禁跨班级读取！
      Promise.all([
        fetch(`/api/grades?subject=${encodeURIComponent(subjectName)}&yearGroup=${encodeURIComponent(currentYearGroup)}`).then(res => res.ok ? res.json() : []),
        fetch(`/api/grades?subject=${encodeURIComponent(oldSubjectName)}&yearGroup=${encodeURIComponent(currentYearGroup)}`).then(res => res.ok ? res.json() : [])
      ]).then(([newGrades, oldGrades]) => {
        const allGrades = [...(Array.isArray(newGrades) ? newGrades : []), ...(Array.isArray(oldGrades) ? oldGrades : [])];

        // 3. 安全合并：只有被数据库证实是交给这个班级 (currentYearGroup) 的学生，才允许显示！
        const allStudentsToDisplay = [...classStudents];
        allGrades.forEach((g: any) => {
          const exists = allStudentsToDisplay.find(s =>
            String(s.username).toLowerCase() === String(g.studentUsername).toLowerCase() ||
            String(s.student_id).toLowerCase() === String(g.studentUsername).toLowerCase()
          );
          if (!exists && g.studentUsername) {
            allStudentsToDisplay.push({
              student_id: g.studentUsername,
              username: g.studentUsername,
              fullName: g.studentName || g.studentUsername,
              role: 'student'
            });
          }
        });

        if (allStudentsToDisplay.length === 0) {
          this.taskSubmissions = [];
          this.isLoadingSubmissions = false;
          return;
        }

        // 4. 匹配数据显示
        this.taskSubmissions = allStudentsToDisplay.map(stu => {
          const uniqueIds = [stu.student_id, stu.studentId, stu.username, stu.email, stu.fullName, stu.full_name]
            .filter(Boolean)
            .map(id => String(id).toLowerCase().trim());

          const gradeRec = allGrades.find((g: any) => {
            const gUname = String(g.studentUsername || g.student_username || '').toLowerCase().trim();
            const gName = String(g.studentName || g.student_name || '').toLowerCase().trim();
            return (gUname && uniqueIds.includes(gUname)) || (gName && uniqueIds.includes(gName));
          });

          const displayId = stu.student_id || stu.studentId || stu.username;

          let statusStr = 'Pending';
          let markStr = '-';
          let pctStr = '-';

          if (gradeRec) {
            statusStr = 'Submitted';
            markStr = gradeRec.mark !== null ? String(gradeRec.mark) : '-';
            pctStr = gradeRec.gradeLetter || '-';
          } else if (task.isPastDue) {
            statusStr = 'Unsubmitted';
            if (task.type === 'Quiz') {
              const qCount = task.questions ? task.questions.length : 0;
              markStr = `0 / ${qCount}`;
              pctStr = '0%';
            } else {
              markStr = '0';
              pctStr = '0%';
            }
          }

          return {
            name: stu.fullName || stu.username,
            id: displayId,
            status: statusStr,
            mark: markStr,
            percentage: pctStr,
            submittedFileName: gradeRec ? (gradeRec.submittedFileName || gradeRec.submitted_file_name) : null,
            submittedFileUrl: gradeRec ? (gradeRec.submittedFileUrl || gradeRec.submitted_file_url) : null
          };
        });

        this.isLoadingSubmissions = false;
      }).catch(err => {
        console.error("Fetch error: ", err);
        this.taskSubmissions = [];
        this.isLoadingSubmissions = false;
      });
    });
  }

  openGradeModal(student: any) {
    this.gradingStudent = student;
    const currentMark = String(student.mark);
    this.gradingScore = (currentMark === 'Pending Grading' || currentMark === 'File Uploaded' || currentMark === '-') ? '' : currentMark;
    this.showGradeModal = true;
  }

  downloadStudentSubmission(student: any) {
    if (student.submittedFileUrl) {
      const a = document.createElement('a');
      a.href = student.submittedFileUrl;
      a.download = student.submittedFileName || 'Submission.pdf';
      a.click();
    } else {
      alert("This student didn't upload a file.");
    }
  }

  saveStudentGrade() {
    if (!this.gradingScore) { alert('Please enter a score.'); return; }

    const subjectName = `${this.clickedTask.type}: ${this.clickedTask.topic}`;
    const gradePayload = [{
      studentUsername: this.gradingStudent.id,
      studentName: this.gradingStudent.name,
      yearGroup: this.selectedYear,
      subject: subjectName,
      mark: this.gradingScore,
      gradeLetter: '-',
      status: 'Submitted'
    }];

    this.authService.saveGrades(gradePayload).subscribe({
      next: () => {
        this.gradingStudent.mark = this.gradingScore;
        this.showGradeModal = false;
        alert('Grade saved successfully!');
      },
      error: () => alert('Failed to save grade.')
    });
  }

  toggleReleaseMarks() {
    if (!this.clickedTask) return;
    this.clickedTask.releaseMarks = !this.clickedTask.releaseMarks;

    const payload = { ...this.clickedTask, releaseMarks: this.clickedTask.releaseMarks ? 1 : 0 };

    this.authService.updateAssignment(this.clickedTask.id, payload).subscribe({
      next: () => {
        alert(this.clickedTask.releaseMarks ? 'Success! Marks are now published.' : 'Marks have been hidden.');
        const targetTask = this.currentTasks.find((t:any) => t.id === this.clickedTask.id);
        if (targetTask) targetTask.releaseMarks = this.clickedTask.releaseMarks;
      },
      error: () => {
        this.clickedTask.releaseMarks = !this.clickedTask.releaseMarks;
        alert('Failed to update release status.');
      }
    });
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
