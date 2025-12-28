import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-student-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-schedule.html',
  styleUrl: './student-schedule.css'
})
export class StudentScheduleComponent implements OnInit {
  isEditMode: boolean = false;
  selectedLevel: string = 'Kindergarten';
  // 1. 在这里添加了 'KAFA' 选项
  levels = ['Kindergarten', 'Primary', 'Lower Secondary', 'Upper Secondary', 'KAFA'];
  days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

  scheduleData: any = {
    'Kindergarten': {
      headers: ['8:00', '8:15 - 8:55', '8:55 - 9:35', '9:35 - 9:55', '9:55 - 10:35', '10:35 - 11:15', '11:15 - 11:55'],
      rows: this.initRows(7)
    },
    'Primary': {
      headers: ['8:00', '8:15 - 8:55', '8:55 - 9:35', '9:35 - 9:55', '9:55 - 10:35', '10:35 - 11:15', '11:15 - 11:55', '11:55 - 12:20'],
      rows: this.initRows(8)
    },
    'Lower Secondary': {
      headers: ['8:00', '8:15 - 8:55', '8:55 - 9:35', '9:35 - 9:55', '9:55 - 10:35', '10:35 - 11:15', '11:15 - 11:55', '11:55 - 12:20', '12:20 - 1:00'],
      rows: this.initRows(9)
    },
    'Upper Secondary': {
      headers: ['8:00', '8:15 - 8:55', '8:55 - 9:35', '9:35 - 9:55', '9:55 - 10:35', '10:35 - 11:15', '11:15 - 11:55', '11:55 - 12:20', '12:20 - 1:00', '1:00 - 1:40'],
      rows: this.initRows(10)
    },
    // 2. 新增 KAFA 的时间表数据结构
    'KAFA': {
      headers: ['2:30 - 3:00', '3:00 - 3:30', '3:30 - 4:00', '4:00 - 4:30', '4:30 - 5:00', '5:00 - 5:30'],
      // 初始化5行（对应周日到周四），每行6个空单元格
      rows: this.initRows(6)
    }
  };

  constructor(private router: Router) {}

  ngOnInit() {}

  // 初始化空行数据
  initRows(count: number) {
    return this.days.map(() => Array(count).fill(''));
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  // 动态增加列功能对 KAFA 同样适用
  addColumn() {
    const current = this.scheduleData[this.selectedLevel];
    current.headers.push('NEW SLOT');
    current.rows.forEach((row: any[]) => row.push(''));
  }

  goBack() {
    this.router.navigate(['/dashboard/admin']);
  }

  submitSchedule() {
    alert(`Timetable for ${this.selectedLevel} has been saved and locked!`);
    this.isEditMode = false;
  }
}
