import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentChildrenList } from './parent-children-list';

describe('ParentChildrenList', () => {
  let component: ParentChildrenList;
  let fixture: ComponentFixture<ParentChildrenList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParentChildrenList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParentChildrenList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
