import { Component, OnInit, Input} from "@angular/core";
import { PatientDto, PatientServiceProxy} from "@shared/service-proxies/service-proxies";
import { ActivatedRoute } from "@angular/router";
import { CurrentPatientService} from "@shared/service-proxies/current-patient.service";
import {Location} from '@angular/common';

import { Subscription } from "rxjs";
@Component({
    selector: 'patientCard-component',
    templateUrl: './patientCard.component.html',
    styleUrls: [
        './patientCard.component.less'
    ],
})

export class PatientCardComponent implements OnInit {
    
    patients: PatientDto[];
    selectPatient: PatientDto;
    selectPatientBirthDate: string;
    patientName: string;
    patientID: string;
    patientSex: boolean;
    patientAge: string;
    keyWords: string;
    resultUserList: PatientDto[];
    isHassaerchedPatients: boolean = true;
    startSearch: boolean = false;
    isLoad: boolean = false;
    isSelectedNewPatient: boolean = false;
    patientPhotoUrl: string;
    searchInput: string;
    subscription: Subscription;
    isDropDownList:boolean;

    @Input()
    inputpPatientID: string;

    constructor(private _patientService: PatientServiceProxy, private _activatedRouter: ActivatedRoute,private _currentPatientService:CurrentPatientService) {
      
    }

    ngOnInit(): void {
        let patientId = this._activatedRouter.queryParams['_value']['vPId'];
        this.isDropDownList = false;
        this._patientService.getAllPatients()
            .pipe()
            .subscribe((result: Array<PatientDto>) => {
                this.patients = result;
                console.log("ID:" + patientId);
                this.patients.forEach(pa => {
                    if (patientId == pa.id) {
                        this._currentPatientService.patientChanged(pa);
                        this.selectPatient = pa;
                        this.patientName = pa.patientName;
                        this.patientID = pa.patientID;
                        this.patientAge = pa.patientAge;
                        if (pa.patientSex == "Male") {
                            this.patientSex = true;
                        }
                        else {
                            this.patientSex = false;
                        }

                        if (pa.patientsBirthDate != null) {
                            this.selectPatientBirthDate = pa.patientsBirthDate.format('YYYY/MM/DD');
                        }
                        console.log("pa:" + pa.id);
                    }
                });
            });
    }
    //当其他模块调用pateintCard时，会调用这个函数并初始化
    //建议初始化抽一个函数出来，接受从其他模块传进来的patientid ,初始化界面
    ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
        for (let propName in changes) {
            if (propName.lastIndexOf("inputpPatientID") > -1) {
                this._patientService.getAllPatients()
                    .pipe()
                    .subscribe((result: Array<PatientDto>) => {
                        this.patients = result;
                    });
                let changedProp = changes[propName];
                var patientid = changedProp.currentValue;
                if (this.patients !== null && this.patients !== undefined && this.patients.length > 0) {
                    this.patients.forEach(pa => {
                        if (patientid == pa.id) {
                            this.selectPatient = pa;
                            this.patientName = pa.patientName;
                            this.patientID = pa.patientID;
                            this.patientAge = pa.patientAge;
                            if (pa.patientSex == "Male") {
                                this.patientSex = true;
                            }
                            else {
                                this.patientSex = false;
                            }
                            if (pa.patientsBirthDate != null) {
                                this.selectPatientBirthDate = pa.patientsBirthDate.format('YYYY/MM/DD');
                            }
                            console.log("pa:" + pa.id);
                            this.isDropDownList = false;
                        }
                    });
                }
            }
        }
    }

    search($event) {
        this.startSearch = true;
        this.isLoad = true;
        this.isSelectedNewPatient = false;
        this.isDropDownList = true;
        this.searchInput = this.keyWords;
        if( this.searchInput != null && this.searchInput != ""){
            this.searchInput = this.searchInput.trimLeft().trimRight();
        }
        if(this.keyWords === "" || this.keyWords == null){
            return;
        }
        if (this.searchInput === "" ||this.keyWords.trim() === "") {
            this.resultUserList = new Array<PatientDto>();
            this.startSearch = false;
            this.isLoad = false;
            this.isHassaerchedPatients = true;
            this.isDropDownList = false;
            console.log("keyword is null");
            return;
        }
        if (this.patients === null || this.patients === undefined || this.patients.length === 0) {
            this.resultUserList = new Array<PatientDto>();
            return;
        }
        var len: number = this.patients.length;
        this.resultUserList = new Array<PatientDto>();
        for (let i = 0; i < len; i++) {
            let element: PatientDto = this.patients[i];
            if (element.patientID.toLowerCase().indexOf(this.searchInput) !== -1
                || element.patientID.toUpperCase().indexOf(this.searchInput) !== -1
                || element.patientName.toLowerCase().indexOf(this.searchInput) !== -1
                || element.patientName.toUpperCase().indexOf(this.searchInput) !== -1
            ) {
                this.resultUserList.push(element);
            }
            if (this.resultUserList.length == 0) {
                this.isHassaerchedPatients = false;
                this.isDropDownList = false;
            }
            else {
                this.isHassaerchedPatients = true;
                this.resultUserList.sort(p=>p.id);
                this.isDropDownList = true;
            }
        }
        this.isLoad = false;

    }

    clearKeyWord(){
        this.keyWords="";
        this.isHassaerchedPatients = true;
        this.startSearch = false;
        this.isDropDownList = false;
        console.log("clear keyword")

    }

    selectedPatient(patient: PatientDto) {
        console.log("selected patient");
        this.selectPatient = patient;
        this.patientName = patient.patientName;
        console.log(this.patientName);
        this.patientID = patient.patientID;
        this.patientAge = patient.patientAge;
        console.log(this.patientID);
        if (patient.patientSex == "Male") {
            this.patientSex = true;
            console.log("Male");
        }
        else {
            this.patientSex = false;
            console.log("Female");
        }

        if (patient.patientsBirthDate != null) {
            this.selectPatientBirthDate = patient.patientsBirthDate.format('YYYY/MM/DD');
        }


        this._currentPatientService.patientChanged(this.selectPatient);

        this.keyWords = this.patientID;
        this.isSelectedNewPatient = true;
        this.isHassaerchedPatients = true;
        this.startSearch = false;
        this.isDropDownList = false;

    }

}