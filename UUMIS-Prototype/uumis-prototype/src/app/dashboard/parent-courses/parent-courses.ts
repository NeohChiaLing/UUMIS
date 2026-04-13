import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parent-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-courses.html',
  styles: []
})
export class ParentCoursesComponent implements OnInit {

  currentUser: any = null;
  viewState: string = 'children';

  myChildren: any[] = [];
  selectedChild: any = null;
  selectedSubject: any = null;

  studentYear: string = 'Year 1';

  subjects: any[] = [];
  allAssignments: any[] = [];
  filteredAssignments: any[] = [];

  clickedTask: any = null;

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    // Fetch ALL children linked to this parent
    if (this.currentUser && this.currentUser.role.toLowerCase() === 'parent') {
      this.authService.getStudents().subscribe({
        next: (students: any[]) => {
          this.myChildren = students.filter(s => s.parentId === this.currentUser.id);
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'NA';
    return name.trim().slice(0, 2).toUpperCase();
  }

  // 1. Parent clicks a child card
  selectChild(child: any) {
    this.selectedChild = child;
    const childBio = child.bio || child.grade || '';

    if (childBio && childBio !== 'Unassigned') {
      const parts = childBio.split('-');
      this.studentYear = parts.length > 1 ? parts[1].trim() : parts[0].trim();
    } else {
      this.studentYear = 'Year 1';
    }

    this.loadChildData();
    this.viewState = 'subjects';
  }

  // 2. Fetch data based on the selected child's academic year
  loadChildData() {
    this.authService.getSubjects().subscribe({
      next: (dbSubjects) => {
        const mySubjects = dbSubjects.filter(s => (s.yearGroup || '').trim().toLowerCase() === this.studentYear.toLowerCase());

        this.authService.getAssignments().subscribe({
          next: (assignmentsRes) => {
            const myAssignments = assignmentsRes.filter(a => (a.yearGroup || '').trim().toLowerCase() === this.studentYear.toLowerCase());

            this.allAssignments = myAssignments.map(a => ({
              id: a.id, type: a.type, subjectCode: a.subject, title: a.topic,
              deadline: a.dueDate, status: a.status || 'Incomplete',
              fileName: a.fileName, fileUrl: a.fileUrl
            }));

            const colors = ['bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-pink-50 text-pink-600', 'bg-orange-50 text-orange-600', 'bg-emerald-50 text-emerald-600'];

            this.subjects = mySubjects.map((sub, index) => {
              const subCode = sub.code || sub.name;
              return {
                code: subCode, name: sub.name, icon: sub.icon || 'menu_book', color: colors[index % colors.length],
                tasksCount: this.allAssignments.filter(a => a.subjectCode === subCode && a.status !== 'Submitted').length
              };
            });
          }
        });
      }
    });
  }

  // 3. Parent clicks a subject
  selectSubject(subject: any): void {
    this.selectedSubject = subject;
    this.filteredAssignments = this.allAssignments.filter(a => a.subjectCode === subject.code);
    this.viewState = 'assignments';
  }

  // 4. Parent clicks an assignment
  openTask(task: any): void {
    this.clickedTask = task;
    this.viewState = 'details';
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

  // 5. Back Navigation routing
  goBack(): void {
    if (this.viewState === 'details') {
      this.viewState = 'assignments';
      this.clickedTask = null;
    }
    else if (this.viewState === 'assignments') {
      this.viewState = 'subjects';
      this.selectedSubject = null;
    }
    else if (this.viewState === 'subjects') {
      this.viewState = 'children';
      this.selectedChild = null;
      this.subjects = [];
    }
    else {
      this.location.back();
    }
  }
}
