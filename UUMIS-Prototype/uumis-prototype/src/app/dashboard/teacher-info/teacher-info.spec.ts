import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherInfo } from './teacher-info';

describe('TeacherInfo', () => {
  let component: TeacherInfo;
  let fixture: ComponentFixture<TeacherInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
