import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditbeamgroupComponent } from './editbeamgroup.component';

describe('EditbeamgroupComponent', () => {
  let component: EditbeamgroupComponent;
  let fixture: ComponentFixture<EditbeamgroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditbeamgroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditbeamgroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
