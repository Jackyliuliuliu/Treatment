import { Component, OnInit, Injector, Output, EventEmitter, Input } from "@angular/core";
import { AppComponentBase } from "@shared/app-component-base";
import { NzModalRef, NzMessageService } from "ng-zorro-antd";
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, Observer } from 'rxjs';
import { ScheduleService } from "@shared/schedule-service/schedule-service";
import { TreatmentScheduleSessionDto,  BeamsTreatmentScheduleServiceProxy, TreatmentSessionDto, TreatmentSessionStatus } from "@shared/service-proxies/service-proxies";
import { ScheduleConverter } from "../treatment-schedule-converter";

@Component({
    selector: "batch-date-shift-modal",
    templateUrl: "./batch-date-shift.component.html"
})

export class BatchDateShiftComponent extends AppComponentBase implements OnInit {

    validateForm: FormGroup;
    visible = false;
    modalName: string = null;
    days: number;
    warning: string;
    today: Date;
    dayRange: number = 90;
    sessionItem:any;
    activeStatusWarning:string;
    completedStatusWarning:string;
    allCompletedOrStopSession:boolean;


    @Input() selectedRows: any;
    @Input() isDelay: boolean;
    @Input() isFromMachineSchedule: boolean;
    @Output() unitCreated: EventEmitter<any> = new EventEmitter<any>();
    ngOnInit(): void {
        if (this.isFromMachineSchedule) {
            this.machineShiftForward();
        }
        else {
            this.activeStatusWarning = "";
            this.completedStatusWarning = "";
            this.modalName = this._scheduleService.modalName;
            this.visible = true;
            this.allCompletedOrStopSession = true;
            if (this.selectedRows != null) {
                if (this.isDelay == false) {
                    var selectedSession = this.selectedRows[0];
                    this.selectedRows.forEach(element => {
                        if(element.status.id == 1 || element == 3){
                            this.allCompletedOrStopSession = false;
                           if(element.scheduledDate < selectedSession.scheduledDate){
                               selectedSession = element;
                           }
                        }
                        
                    });
                    var strArray: string[] = ScheduleConverter.getScheduledDate(selectedSession.scheduledDate).split('/');
                    var yearNum: number = parseInt(strArray[0], 10);
                    var monthNum: number = parseInt(strArray[1], 10) - 1;
                    var dayNum: number = parseInt(strArray[2], 10);
                    var planDate = new Date(yearNum, monthNum, dayNum, 0, 0, 0);
                    console.log("plandate" + planDate);
                    var range = (planDate.getTime() - this.today.getTime()) / 1000 / 60 / 60 / 24;
                    var newPlanDate = new Date(new Date(selectedSession.scheduledDate).getTime()- range*1000*60*60*24);
                    if( newPlanDate.getTime() < new Date().getTime()){
                            range --;
                        }
                    this.dayRange = range;
                }
                else {
                    this.selectedRows.forEach(element => {
                        if(element.status.id == 1 || element == 3){
                            this.allCompletedOrStopSession = false;
                        }
                        
                    });
                    this.dayRange = 90;
                }
            }

            this.validateForm = this._fb.group({
                days: [null, [Validators.required, Validators.max(this.dayRange), Validators.min(0), Validators.maxLength(2)]],
            });
            this.sessionItem = <any>[];
            if (this.selectedRows != null) {
                this.selectedRows.forEach(selectRow => {
                    var session = new TreatmentScheduleSessionDto();
                    session.id = selectRow.id;
                    session.status = selectRow.status;
                    session.isActive = selectRow.isActive;
                    session.scheduledDate = selectRow.scheduledDate;
                    if(session.status.id == 1 || session.status.id == 3 ){
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
        private _fb: FormBuilder,
        private _scheduleService: ScheduleService,
        private _beamsTreatmentScheduleServiceProxy: BeamsTreatmentScheduleServiceProxy,
        public msg: NzMessageService,
        private _modal: NzModalRef) {
        super(injector);
        let dateNow = new Date();
        let year = dateNow.getFullYear();
        let month = dateNow.getMonth();
        let day = dateNow.getDate();
        this.today = new Date(year, month, day, 0, 0);

    }

    close(): void {
        this._modal.destroy(false);
    }

    machineShiftForward(): void {
        this.modalName = this._scheduleService.modalName;
        this.visible = true;
        if (this.selectedRows != null) {
            if (this.isDelay==false) {
                var selectedSession = this.selectedRows[0];
                    this.selectedRows.forEach(element => {
                        if(element.status.id == 1 || element == 3){
                            this.allCompletedOrStopSession = false;
                           if(element.scheduledDate < selectedSession.scheduledDate){
                               selectedSession = element;
                           }
                        }
                        
                    });
                    var strArray: string[] = ScheduleConverter.getScheduledDate(selectedSession.scheduledDate).split('/');
                    var yearNum: number = parseInt(strArray[0], 10);
                    var monthNum: number = parseInt(strArray[1], 10) - 1;
                    var dayNum: number = parseInt(strArray[2], 10);
                    var planDate = new Date(yearNum, monthNum, dayNum, 0, 0, 0);
                    console.log("plandate" + planDate);
                    var range = (planDate.getTime() - this.today.getTime()) / 1000 / 60 / 60 / 24;
                    var newPlanDate = new Date(new Date(selectedSession.scheduledDate).getTime()- range*1000*60*60*24);
                    if( newPlanDate.getTime() < new Date().getTime()){
                            range --;
                        }
                    this.dayRange = range;
            }
            else {
                this.dayRange = 90;
            }
        }
        this.validateForm = this._fb.group({
            days: [null, [Validators.required, Validators.max(this.dayRange), Validators.min(0), Validators.maxLength(2)]],
        });
        this.sessionItem = <any>[];
        this.selectedRows.forEach(selectRow => {
            this.sessionItem.push(selectRow.id);
        })
    }

    onConfirm(): void {
        if(this.sessionItem != []){
            this.batchDelayAndAheadExecute(this.sessionItem, this.days, this.isDelay);

        }
        else{
            this._modal.destroy(false);
        }
       
    }


    batchDelayAndAheadExecute(sessionItem: any, days: number, isDelay: boolean): void {
        try {
            if(this.allCompletedOrStopSession){
                this.msg.error(this.l("seleted sessions are completed or stop,these session can't be modify!"));
                this._modal.destroy(false);
            }

            this._beamsTreatmentScheduleServiceProxy.batchDateShiftSessions(sessionItem, days, isDelay).subscribe(
                (result: boolean) => {
                    if (result) {
                        this._modal.destroy(true);
                    }
                }
            )
        } catch (error) {
            alert(error);
        }
    }



}