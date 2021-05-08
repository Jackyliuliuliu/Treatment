import { Injectable } from '@angular/core';
import { BeamGroupDto } from '@shared/service-proxies/service-proxies';
import { NgModule } from '@angular/core';

@Injectable()
@NgModule()
export class CurrentPlanService {
  currentBeamGroup: BeamGroupDto;
  constructor() { }

  setCurrentPlan(beamGroup : BeamGroupDto){
    this.currentBeamGroup = beamGroup;
  }

  getCurentPlan() {
      return this.currentBeamGroup;
  }
}