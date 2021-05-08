import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BeamparameterComponent } from './beamparameter.component';

describe('BeamparameterComponent', () => {
  let component: BeamparameterComponent;
  let fixture: ComponentFixture<BeamparameterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BeamparameterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BeamparameterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
