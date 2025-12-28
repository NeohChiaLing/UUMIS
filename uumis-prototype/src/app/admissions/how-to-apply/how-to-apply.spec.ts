import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowToApply } from './how-to-apply';

describe('HowToApply', () => {
  let component: HowToApply;
  let fixture: ComponentFixture<HowToApply>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowToApply]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HowToApply);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
