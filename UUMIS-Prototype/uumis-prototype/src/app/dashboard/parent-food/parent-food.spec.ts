import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentFood } from './parent-food';

describe('ParentFood', () => {
  let component: ParentFood;
  let fixture: ComponentFixture<ParentFood>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentFood]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentFood);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
