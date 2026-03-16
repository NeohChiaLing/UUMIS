import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentGrades } from './student-grades';

describe('StudentGrades', () => {
  let component: StudentGrades;
  let fixture: ComponentFixture<StudentGrades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentGrades]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentGrades);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
