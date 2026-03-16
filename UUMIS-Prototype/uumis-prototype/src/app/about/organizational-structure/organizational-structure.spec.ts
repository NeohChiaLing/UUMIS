import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationalStructure } from './organizational-structure';

describe('OrganizationalStructure', () => {
  let component: OrganizationalStructure;
  let fixture: ComponentFixture<OrganizationalStructure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationalStructure]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationalStructure);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
