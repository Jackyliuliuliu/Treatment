import { Injectable, Output, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BeamActionCompletedService {

  constructor() { }

  @Output() beamActionCompleted = new EventEmitter<null>();
  @Output() beamActionStart = new EventEmitter<null>();
  
}
