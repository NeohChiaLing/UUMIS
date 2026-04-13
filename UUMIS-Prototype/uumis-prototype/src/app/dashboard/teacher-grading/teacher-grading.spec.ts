import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherGrading } from './teacher-grading';

describe('TeacherGrading', () => {
  let component: TeacherGrading;
  let fixture: ComponentFixture<TeacherGrading>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherGrading]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherGrading);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
