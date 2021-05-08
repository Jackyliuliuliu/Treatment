import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopybeamComponent } from './copybeam.component';

describe('CopybeamComponent', () => {
  let component: CopybeamComponent;
  let fixture: ComponentFixture<CopybeamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopybeamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopybeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
