import { Injectable } from '@angular/core';
import { STData } from '@delon/abc';
import { BeamsTreatmentScheduleServiceProxy } from '@shared/service-proxies/service-proxies';

@Injectable()
export class ScheduleService {

    selecteRows: STData[] = [];
    treatmentStatus: string = null;
    batchDate = new Date();
    IsSuccessModifySchedule: boolean = false;
    modalName: string = null;

    constructor(private _scheduleServiceProxy: BeamsTreatmentScheduleServiceProxy) {
    }

    batchAdvance(): void {


    }

    batchDelay(): void {

    }

    batchInActivate(): void {


    }

    batchActivate(): void {

    }

    batchDelete(): void {

    }

    batchTimeShifting(): void {


    }

    batchSettingDate(): void  {


    }



}