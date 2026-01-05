import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsiteManagement } from './website-management';

describe('WebsiteManagement', () => {
  let component: WebsiteManagement;
  let fixture: ComponentFixture<WebsiteManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebsiteManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebsiteManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
