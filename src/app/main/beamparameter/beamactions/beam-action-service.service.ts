import { Injectable, Output, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BeamActionServiceService {

  constructor() { }

  @Output() CopyBeamLoading  = new EventEmitter<null>();

  @Output() AddBeamLoading  = new EventEmitter<null>();

  @Output() DeleteBeamLoading  = new EventEmitter<null>();
}
