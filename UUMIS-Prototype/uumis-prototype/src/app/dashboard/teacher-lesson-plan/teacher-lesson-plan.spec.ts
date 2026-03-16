import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherLessonPlan } from './teacher-lesson-plan';

describe('TeacherLessonPlan', () => {
  let component: TeacherLessonPlan;
  let fixture: ComponentFixture<TeacherLessonPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherLessonPlan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherLessonPlan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
