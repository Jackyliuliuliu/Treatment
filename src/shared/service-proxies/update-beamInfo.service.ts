import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';



@Injectable()
export class UpdateBeamInfoService {

    private subject = new Subject<any>();

    beamInfoChanged() {
        this.subject.next();
    }


    getBeamInfo() {
        return this.subject.asObservable();
    }



}