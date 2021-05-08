import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditbeamimagingComponent } from './editbeamimaging.component';

describe('EditbeamimagingComponent', () => {
  let component: EditbeamimagingComponent;
  let fixture: ComponentFixture<EditbeamimagingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditbeamimagingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditbeamimagingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
