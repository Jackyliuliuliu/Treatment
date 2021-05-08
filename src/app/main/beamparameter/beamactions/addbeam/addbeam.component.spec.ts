import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddbeamComponent } from './addbeam.component';

describe('AddbeamComponent', () => {
  let component: AddbeamComponent;
  let fixture: ComponentFixture<AddbeamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddbeamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddbeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
