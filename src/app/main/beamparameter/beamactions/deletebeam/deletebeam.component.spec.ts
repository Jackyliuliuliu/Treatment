import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletebeamComponent } from './deletebeam.component';

describe('DeletebeamComponent', () => {
  let component: DeletebeamComponent;
  let fixture: ComponentFixture<DeletebeamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeletebeamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeletebeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
