import { Component, OnInit, Injector, Output, EventEmitter, Input } from "@angular/core";
import { AppComponentBase } from "@shared/app-component-base";
import { NzModalRef, NzMessageService } from "ng-zorro-antd";
import { ScheduleService } from "@shared/schedule-service/schedule-service";
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, Observer } from 'rxjs';
import { TreatmentScheduleSessionDto, BeamsTreatmentScheduleServiceProxy } from "@shared/service-proxies/service-proxies";
import * as mom from 'moment';
import { ScheduleConverter } from "../treatment-schedule-converter";

@Component(
    {
        selector: "batch-date-change-modal",
        templateUrl: "./batch-date-change.component.html"
    }
)

export class BatchDateChangeComponent extends AppComponentBase implements OnInit {
    disabledDate = (date: Date): boolean => {
        let dateNow = new Date();
        let year = dateNow.getFullYear();
        let month = dateNow.getMonth();
        let day = dateNow.getDate();
        return date.getTime() < new Date(year, month, day).getTime();
    };

    validateForm: FormGroup;
    visible = false;
    modalName: string = null;
    date: Date;
    activeStatusWarning:string;
    completedStatusWarning:string;
    sessionItem: any;
    allCompletedOrStopSession:boolean;

    @Input() selectedRows: any;
    @Input() isFromMachineSchedule: boolean;
    @Output() unitCreated: EventEmitter<any> = new EventEmitter<any>();
    ngOnInit(): void {
        this.activeStatusWarning = "";
        this.completedStatusWarning = "";
        if (this.isFromMachineSchedule) {
            this.machineScheduleBatchDateChange();
        }
        else {
            this.allCompletedOrStopSession = true;
            this.modalName = this._scheduleService.modalName;
            this.visible = true;
            this.validateForm = this._fb.group({
                date: []
            });
            this.sessionItem = <any>[];
            if (this.selectedRows != null) {
                this.selectedRows.forEach(selectRow => {
                    var session = new TreatmentScheduleSessionDto();
                    session.id = selectRow.id;
                    session.status = selectRow.status;
                    session.isActive = selectRow.isActive;

                    if(session.status.id == 1 || session.status.id == 3 ){
                        this.allCompletedOrStopSession = false;
                        if(session.isActive){
                            this.sessionItem.push(session.id);
                        }
                        else{
                            this.activeStatusWarning = this.l("there are some sessions are stop, this action will change activce session's date!");
                        }
    
                    }
                    if(session.status.id == 0){
                        this.completedStatusWarning = this.l("there are some sessions are completed,this action will not change completed session's date!");
                    }
                });
                if(this.allCompletedOrStopSession){
                    this.completedStatusWarning = this.l("seleted sessions are completed or stop,these session can't be modify!");
                }
            }

        }
    }

    constructor(
        injector: Injector,
        private _scheduleService: ScheduleService,
        private _fb: FormBuilder,
        private _modal: NzModalRef,
        public msg: NzMessageService,
        private _beamsTreatmentScheduleServiceProxy: BeamsTreatmentScheduleServiceProxy) {
        super(injector);
    }

    close(): void {
        console.log("destroy");
        this._modal.destroy(false);
    }

    onConfirm(): void {
        if(this.sessionItem != []){
            this.batchSettingDateExecute(this.sessionItem, this.date);
        }
        else{
            this._modal.destroy(false);
        }
    }

    machineScheduleBatchDateChange(): void {
        this.modalName = this._scheduleService.modalName;
        this.visible = true;
        this.validateForm = this._fb.group({
            date: [null]
        });
        this.sessionItem = <any>[];
        if (this.selectedRows != null) {
            this.selectedRows.forEach(selectRow => {
                this.sessionItem.push(selectRow.id);
            })

        }

    }

    batchSettingDateExecute(sessionItem: any, date: Date): void {
        try {
            if(this.allCompletedOrStopSession){
                this.msg.error(this.l("seleted sessions are completed or stop,these session can't be modify!"));
                this._modal.destroy(false);
            }

            // this._beamsTreatmentScheduleServiceProxy.batchDateChangeSessions(sessionItem, mom(date)).subscribe(
            //     (result: boolean) => {
            //         if (result) {
            //             this._modal.destroy(true);
            //         }
            //     }
            // )
        } catch (error) {
            alert(error);
        }
    }

}