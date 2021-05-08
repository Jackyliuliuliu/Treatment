import { Injectable} from '@angular/core';

@Injectable()
export class GetBeamIdService {
    constructor() {
    }

    beamIndex:number;


    setBeamIndex(beamId:string) {
     if(beamId!= null){
         this.beamIndex = parseInt(beamId);
     }

    }

    getBeamIndex() {
        return this.beamIndex;
    }
} 