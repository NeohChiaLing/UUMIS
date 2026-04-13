import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentCourses } from './parent-courses';

describe('ParentCourses', () => {
  let component: ParentCourses;
  let fixture: ComponentFixture<ParentCourses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentCourses]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentCourses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
