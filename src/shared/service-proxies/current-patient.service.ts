import { Injectable } from '@angular/core';
import { PatientDto } from './service-proxies';
import { Subject } from 'rxjs';


@Injectable()
export class CurrentPatientService {
    currentPatient: PatientDto;
    patientUid: string;
    private subject = new Subject<any>();

    patientChanged(patient: PatientDto) {
        this.currentPatient = patient;
        this.subject.next(patient);
    }

    getCurrentPatient(): Subject<any> {
        return this.subject;
    }

    /// <DSKey>
    /// ID:100281
    /// Title:DS_PRA_Common_DoubleCheck_PatientInfo
    /// </DSKey>
    patientConsitencyCheck(patient: PatientDto): Boolean {
        if (patient === null || patient === undefined ) {
            return false;
        }
        if (patient.patientID === this.currentPatient.patientID &&
            patient.patientName === this.currentPatient.patientName &&
            patient.patientSex === this.currentPatient.patientSex &&
            patient.patientAge === this.currentPatient.patientAge) {
            console.log( 'patientConsitencyCheck:' + true);
            return true;
        }else {
            console.log( 'patientConsitencyCheck:' + false);
            return false;
        }
    }

}
