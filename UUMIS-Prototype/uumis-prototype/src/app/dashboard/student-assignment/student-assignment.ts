import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class StudentAssignmentComponent implements OnInit, OnDestroy {

  viewState: string = 'subjects';
  selectedSubject: any = null;

  studentLevel: string = '';
  studentYear: string = 'Year 1';
  studentDbId: number = 0;
  studentUsername: string = '';
  studentName: string = '';

  subjects: any[] = [];
  allAssignments: any[] = [];
  filteredAssignments: any[] = [];

  clickedTask: any = null;
  remainingTimeText: string = '00:00';
  countdownTimer: any = null;

  selectedFileName: string = '';
  selectedFile: File | null = null;
  selectedFileBase64: string = '';
  userAnswers: any[] = [];
  quizResult: any = null;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.studentDbId = user.id ? Number(user.id) : 0;
          this.studentUsername = user.student_id || user.studentId || user.username || user.email;
          this.studentName = user.full_name || user.fullName || user.username;

          if (user.bio && user.bio !== 'Unassigned') {
            const parts = user.bio.includes(' - ') ? user.bio.split(' - ') : user.bio.split('-');
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

  ngOnDestroy() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  loadMyData() {
    this.authService.getSubjects().subscribe({
      next: (dbSubjects) => {
        const mySubjects = dbSubjects.filter((s: any) => {
          const subYear = (s.yearGroup || s.year_group || '').trim().toLowerCase();
          return subYear === this.studentYear.toLowerCase();
        });

        this.authService.getStudentGrades(this.studentDbId).subscribe({
          next: (myGrades: any[]) => {

            this.authService.getAssignments().subscribe({
              next: (assignmentsRes: any[]) => {
                const myAssignments = assignmentsRes.filter((a: any) => {
                  const taskYear = (a.yearGroup || a.year_group || '').trim().toLowerCase();
                  return taskYear === this.studentYear.toLowerCase();
                });

                this.allAssignments = myAssignments.map((a: any) => {

                  let isReleased = false;
                  if (a.releaseMarks !== undefined && a.releaseMarks !== null) {
                    isReleased = a.releaseMarks === 1 || a.releaseMarks === true || a.releaseMarks === '1' || (a.releaseMarks.data && a.releaseMarks.data[0] === 1);
                  }
                  if (a.release_marks !== undefined && a.release_marks !== null) {
                    isReleased = a.release_marks === 1 || a.release_marks === true || a.release_marks === '1' || (a.release_marks.data && a.release_marks.data[0] === 1);
                  }

                  const questionsArr = (a.questionsJson || a.questions_json) ? JSON.parse((a.questionsJson || a.questions_json)) : [];

                  const now = new Date();
                  let isPastDue = false;
                  if (a.type === 'Quiz' && a.quizDate && a.endTime) {
                    isPastDue = now > new Date(`${a.quizDate}T${a.endTime}`);
                  } else if (a.type === 'Assignment' && a.dueDate) {
                    isPastDue = now > new Date(a.dueDate);
                  }

                  const subjectName = `${a.type}: ${a.topic}`;

                  const gradeRecord = myGrades.find((g: any) => g.subject === 'TASK_' + a.id || g.subject === subjectName);

                  let finalStatus = 'Pending';
                  let finalScore = null;

                  if (gradeRecord) {
                    finalStatus = 'Submitted';
                    finalScore = gradeRecord.mark;
                  } else if (isPastDue) {
                    finalStatus = 'Unsubmitted';
                    finalScore = a.type === 'Quiz' ? `0 / ${questionsArr.length}` : '0';
                  } else {
                    finalStatus = a.status || 'Incomplete';
                  }

                  return {
                    id: a.id,
                    type: a.type,
                    subjectCode: a.subject,
                    title: a.topic,
                    deadline: a.dueDate || a.due_date || a.quizDate || a.quiz_date || new Date().toISOString(),
                    status: finalStatus,
                    scoreText: finalScore,
                    fileName: a.fileName || a.file_name,
                    fileUrl: a.fileUrl || a.file_url,
                    questions: questionsArr,
                    durationHours: a.durationHours || a.duration_hours || 0,
                    durationMinutes: a.durationMinutes || a.duration_minutes || 0,
                    durationText: a.durationText || a.duration_text,
                    releaseMarks: !!isReleased
                  };
                });

                const colors = ['bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-pink-50 text-pink-600', 'bg-orange-50 text-orange-600', 'bg-emerald-50 text-emerald-600'];

                this.subjects = mySubjects.map((sub: any, index: number) => {
                  const subCode = sub.code || sub.name;
                  return {
                    code: subCode,
                    name: sub.name,
                    tasksCount: this.allAssignments.filter(a => a.subjectCode === subCode && a.status !== 'Submitted' && a.status !== 'Unsubmitted').length,
                    icon: sub.icon || 'menu_book',
                    color: colors[index % colors.length]
                  };
                });
              },
              error: () => console.error('Failed to load assignments')
            });
          },
          error: () => console.error('Failed to load student grades')
        });
      },
      error: () => console.error('Failed to fetch subjects')
    });
  }

  selectSubject(subject: any): void {
    this.selectedSubject = subject;
    this.filteredAssignments = this.allAssignments.filter(a => a.subjectCode === subject.code);
    this.viewState = 'assignments';
  }

  openTask(task: any): void {
    this.clickedTask = task;

    if (task.type && task.type.toLowerCase() === 'quiz') {
      if (task.status === 'Submitted' || task.status === 'Unsubmitted') {
        if (task.releaseMarks) {
          const parts = String(task.scoreText || '0 / 0').split('/');
          this.quizResult = {
            score: parseInt(parts[0]?.trim()) || 0,
            total: parseInt(parts[1]?.trim()) || 0,
            showMarks: true
          };
          this.viewState = 'quiz-result';
        } else {
          alert('Marks are not yet released by the teacher.');
        }
      } else {
        this.viewState = 'quiz-gateway';
      }
    } else {
      // THE FIX: Allows Re-Submission if the teacher hasn't graded it!
      if (task.status === 'Submitted') {
        const scoreStr = String(task.scoreText);
        if (task.releaseMarks && task.scoreText !== null && scoreStr !== 'Pending Grading' && scoreStr !== 'File Uploaded') {
          // Teacher has released a real score (like 85/100 or A+)
          this.viewState = 'assignment-result';
        } else {
          // It's still pending, so let them open the details to resubmit their PDF!
          this.viewState = 'details';
        }
      } else if (task.status === 'Unsubmitted') {
        alert('You missed the deadline for this assignment.');
      } else {
        this.viewState = 'details';
      }
    }
  }

  startQuiz() {
    this.viewState = 'quiz';
    this.userAnswers = new Array(this.clickedTask.questions?.length || 0).fill(null);

    let h = parseInt(this.clickedTask?.durationHours || 0);
    let m = parseInt(this.clickedTask?.durationMinutes || 0);
    let totalSeconds = (h * 3600) + (m * 60);

    if (totalSeconds <= 0) totalSeconds = 300;

    this.updateTimerText(totalSeconds);

    this.countdownTimer = setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) {
        this.submitQuiz(true);
        return;
      }
      this.updateTimerText(totalSeconds);
    }, 1000);
  }

  updateTimerText(totalSec: number) {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    this.remainingTimeText = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  submitQuiz(isAutoSubmit: boolean = false): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    if (isAutoSubmit) {
      alert('Time is up! Your quiz has been automatically submitted.');
    }

    let score = 0;
    const questions = this.clickedTask?.questions || [];
    questions.forEach((q: any, index: number) => {
      if (this.userAnswers[index] == q.correctAnswer) score++;
    });

    const markStr = `${score} / ${questions.length}`;
    const pctStr = questions.length > 0 ? Math.round((score / questions.length) * 100) + '%' : '0%';

    this.quizResult = {
      score: score,
      total: questions.length,
      showMarks: this.clickedTask?.releaseMarks === true
    };

    this.clickedTask.status = 'Submitted';
    this.clickedTask.scoreText = markStr;

    const subjectName = `${this.clickedTask.type}: ${this.clickedTask.title}`;

    const gradePayload = [{
      studentUsername: this.studentUsername,
      studentName: this.studentName,
      yearGroup: this.studentYear,
      subject: subjectName,
      mark: markStr,
      gradeLetter: pctStr,
      status: 'Submitted'
    }];

    this.authService.saveGrades(gradePayload).subscribe({
      next: () => {
        if (this.quizResult.showMarks) {
          this.viewState = 'quiz-result';
        } else {
          alert('Quiz Submitted Successfully! Marks will be available once the teacher releases them.');
          this.viewState = 'assignments';
          this.clickedTask = null;
        }
      },
      error: () => {
        alert('Server Offline! Could not save the quiz.');
      }
    });
  }

  submitAssignment(): void {
    if (!this.selectedFile) { alert('Please select a file first!'); return; }

    const subjectName = `${this.clickedTask.type}: ${this.clickedTask.title}`;

    const gradePayload = [{
      studentUsername: this.studentUsername,
      studentName: this.studentName,
      yearGroup: this.studentYear,
      subject: subjectName,
      mark: 'Pending Grading',
      gradeLetter: '-',
      status: 'Submitted',
      submittedFileName: this.selectedFileName,
      submittedFileUrl: this.selectedFileBase64
    }];

    this.authService.saveGrades(gradePayload).subscribe({
      next: () => {
        alert(`Assignment "${this.selectedFileName}" Submitted Successfully!`);
        this.clickedTask.status = 'Submitted';
        this.clickedTask.scoreText = 'Pending Grading';
        this.selectedFile = null;
        this.selectedFileName = '';
        this.selectedFileBase64 = '';
        this.viewState = 'assignments';
        this.clickedTask = null;
      },
      error: () => {
        alert('Server Offline! Could not save the assignment.');
      }
    });
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

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFileBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  goBack(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    if (this.viewState === 'quiz-gateway' || this.viewState === 'quiz-result' || this.viewState === 'details' || this.viewState === 'assignment-result') {
      this.viewState = 'assignments';
      this.clickedTask = null;
    }
    else if (this.viewState === 'quiz') {
      if (confirm('Are you sure you want to exit? Your progress will be lost and you cannot retake it!')) {
        this.submitQuiz(false);
      }
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
