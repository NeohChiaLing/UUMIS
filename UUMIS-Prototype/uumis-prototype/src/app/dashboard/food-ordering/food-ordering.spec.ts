import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodOrdering } from './food-ordering';

describe('FoodOrdering', () => {
  let component: FoodOrdering;
  let fixture: ComponentFixture<FoodOrdering>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodOrdering]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoodOrdering);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
