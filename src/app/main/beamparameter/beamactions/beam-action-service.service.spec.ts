import { TestBed } from '@angular/core/testing';

import { BeamActionServiceService } from './beam-action-service.service';

describe('BeamActionServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BeamActionServiceService = TestBed.get(BeamActionServiceService);
    expect(service).toBeTruthy();
  });
});
