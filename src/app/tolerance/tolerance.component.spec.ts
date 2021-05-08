import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ToleranceComponent } from './tolerance.component';

describe('ToleranceComponent', () => {
  let component: ToleranceComponent;
  let fixture: ComponentFixture<ToleranceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ToleranceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToleranceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
