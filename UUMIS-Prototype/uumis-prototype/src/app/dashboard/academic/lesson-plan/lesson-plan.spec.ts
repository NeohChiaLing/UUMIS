import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonPlan } from './lesson-plan';

describe('LessonPlan', () => {
  let component: LessonPlan;
  let fixture: ComponentFixture<LessonPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonPlan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonPlan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
