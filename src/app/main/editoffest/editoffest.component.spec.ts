import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditoffestComponent } from './editoffest.component';

describe('EditoffestComponent', () => {
  let component: EditoffestComponent;
  let fixture: ComponentFixture<EditoffestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditoffestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditoffestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
