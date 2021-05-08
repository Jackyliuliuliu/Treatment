import { TestBed } from '@angular/core/testing';

import { BeamActionCompletedService } from './beam-action-completed.service';

describe('BeamActionCompletedService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BeamActionCompletedService = TestBed.get(BeamActionCompletedService);
    expect(service).toBeTruthy();
  });
});
