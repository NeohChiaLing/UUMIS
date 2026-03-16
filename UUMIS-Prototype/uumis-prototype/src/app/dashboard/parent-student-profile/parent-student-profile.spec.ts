import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentStudentProfile } from './parent-student-profile';

describe('ParentStudentProfile', () => {
  let component: ParentStudentProfile;
  let fixture: ComponentFixture<ParentStudentProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentStudentProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentStudentProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
