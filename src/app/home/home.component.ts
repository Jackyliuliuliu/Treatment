// tslint:disable:no-any
import { Component, OnInit } from '@angular/core';
import { PatientServiceProxy, Sorter, ListResultDtoOfPatientDto, PatientDto } from '@shared/service-proxies/service-proxies';
import { Router } from '@angular/router';

const count = 5;

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})

export class HomeComponent implements OnInit {
    patients: PatientDto[];

    constructor(
        private _router: Router,
        private _patientService: PatientServiceProxy) { }

    ngOnInit(): void {
        this._patientService.getAllPatients()
            .pipe()
            .subscribe((result: Array<PatientDto>) => {
                this.patients = result;
        });
    }

    machineScheduleClicked() {
        this._router.navigate(['app', 'machine-treatment-schedule']);
    }

    export(patient: PatientDto) {
        this._router.navigate(['app', 'export'], {queryParams: {vPId: patient.id}});
    }

    record(patient: PatientDto) {
        this._router.navigate(['app', 'treatment-summary'], {queryParams: {vPId: patient.id}});
    }

    schedule(patient: PatientDto) {
        this._router.navigate(['app', 'treatment-schedule'], {queryParams: {vPId: patient.id}});
    }

    beamGroup(patient: PatientDto) {
        this._router.navigate(['app', 'beamdefinition'], {queryParams: {vPId: patient.id}});
    }

    printClicked() {
    }
}