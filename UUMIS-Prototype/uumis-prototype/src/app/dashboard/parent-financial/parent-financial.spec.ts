import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentFinancial } from './parent-financial';

describe('ParentFinancial', () => {
  let component: ParentFinancial;
  let fixture: ComponentFixture<ParentFinancial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentFinancial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentFinancial);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
