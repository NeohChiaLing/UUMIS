import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardOfGovernors } from './board-of-governors';

describe('BoardOfGovernors', () => {
  let component: BoardOfGovernors;
  let fixture: ComponentFixture<BoardOfGovernors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardOfGovernors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardOfGovernors);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
