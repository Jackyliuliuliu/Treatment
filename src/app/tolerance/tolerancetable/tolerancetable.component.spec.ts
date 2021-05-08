import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TolerancetableComponent } from './tolerancetable.component';

describe('TolerancetableComponent', () => {
  let component: TolerancetableComponent;
  let fixture: ComponentFixture<TolerancetableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TolerancetableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TolerancetableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
