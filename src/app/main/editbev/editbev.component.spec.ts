import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditbevComponent } from './editbev.component';

describe('EditbevComponent', () => {
  let component: EditbevComponent;
  let fixture: ComponentFixture<EditbevComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditbevComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditbevComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
