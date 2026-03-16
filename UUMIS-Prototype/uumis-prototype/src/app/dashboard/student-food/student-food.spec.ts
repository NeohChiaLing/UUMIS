import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentFood } from './student-food';

describe('StudentFood', () => {
  let component: StudentFood;
  let fixture: ComponentFixture<StudentFood>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentFood]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentFood);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
