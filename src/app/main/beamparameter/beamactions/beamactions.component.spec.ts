import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BeamactionsComponent } from './beamactions.component';

describe('BeamactionsComponent', () => {
  let component: BeamactionsComponent;
  let fixture: ComponentFixture<BeamactionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BeamactionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BeamactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
