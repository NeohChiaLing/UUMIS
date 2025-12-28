import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentAssignment } from './student-assignment';

describe('StudentAssignment', () => {
  let component: StudentAssignment;
  let fixture: ComponentFixture<StudentAssignment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentAssignment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentAssignment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
