import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditbeamComponent } from './editbeam.component';

describe('EditbeamComponent', () => {
  let component: EditbeamComponent;
  let fixture: ComponentFixture<EditbeamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditbeamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditbeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
