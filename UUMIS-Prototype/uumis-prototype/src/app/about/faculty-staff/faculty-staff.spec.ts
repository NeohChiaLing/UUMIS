import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyStaff } from './faculty-staff';

describe('FacultyStaff', () => {
  let component: FacultyStaff;
  let fixture: ComponentFixture<FacultyStaff>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyStaff]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyStaff);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
