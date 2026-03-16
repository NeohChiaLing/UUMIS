import { ComponentFixture, TestBed } from '@angular/core/testing';
// FIX: Import 'MissionVisionComponent' instead of 'MissionVision'
import { MissionVisionComponent } from './mission-vision';

describe('MissionVisionComponent', () => {
  let component: MissionVisionComponent;
  let fixture: ComponentFixture<MissionVisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionVisionComponent] // FIX: Use the correct class name here
    })
      .compileComponents();

    fixture = TestBed.createComponent(MissionVisionComponent); // FIX: And here
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
