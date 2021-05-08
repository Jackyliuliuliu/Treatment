import { Component, OnInit, Injector, Output, EventEmitter, Input } from "@angular/core";
import { AppComponentBase } from "@shared/app-component-base";
import { NzModalRef, NzMessageService } from "ng-zorro-antd";
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, Observer } from 'rxjs';
import { ScheduleService } from "@shared/schedule-service/schedule-service";
import { TreatmentScheduleSessionDto, BeamsTreatmentScheduleServiceProxy } from "@shared/service-proxies/service-proxies";
import { ScheduleConverter } from "../treatment-schedule-converter";
import * as mom from 'moment';
import { runInThisContext } from "vm";

@Component({
    selector: "batch-time-shift-modal",
    templateUrl: "./batch-time-shift.component.html"
})

export class BatchTimeShiftComponent extends AppComponentBase implements OnInit{
    validateForm: FormGroup;
    visible = false;
    modalName: string = null;
    optionList:[{},{}];
    OperatorAction:string;
    hours:number;
    minutes:number;
    isDelay:boolean;
    delayAhead:any;
    isCompleted:boolean;
    sessionItem:any;
    activeStatusWarning:string;
    completedStatusWarning:string;
    allCompletedOrStopSession:boolean;
    today: Date;
    rangeTime:Date;

    @Input() selectedRows: any;
    @Input() isFromMachineSchedule: boolean;//用于区分是哪个模块发出的请求，true表示来自machinetreatmentschedule模块。
    @Output() unitCreated: EventEmitter<any> = new EventEmitter<any>();

    ngOnInit(): void {
        this.modalName = this._scheduleService.modalName;
        this.visible = true;
        this.initValidateForm();
        this.optionList = [{ label: this.l('Delay'), value: 'Delay'}, { label: this.l('Ahead'), value: 'Ahead'}];
        this.isCompleted = false;
        this.sessionItem = <any>[];
        this.activeStatusWarning = "";
        this.completedStatusWarning = "";
        this.allCompletedOrStopSession = true;

        if (this.selectedRows != null) {
            this.selectedRows.forEach(selectRow => {
                var session = new TreatmentScheduleSessionDto();
                session.id = selectRow.id;
                session.status = selectRow.status;
                session.isActive = selectRow.isActive;
                session.scheduledDate = selectRow.scheduledDate;
                if(session.status.id == 1 || session.status.id == 3 ){
                    this.allCompletedOrStopSession = false;
                    if(session.isActive){
                        this.sessionItem.push(session.id);
                    }
                    else{
                        this.activeStatusWarning = this.l("there are some session is stop, this action will change activce session's time!");
                    }
                }
                if(session.status.id == 0){
                    this.completedStatusWarning = this.l("there are some sessions is completed,this action will not change completed session's time!");
                }

            });
            if(this.allCompletedOrStopSession){
                this.completedStatusWarning = this.l("seleted sessions are completed or stop,these session can't be modify!");
            }
        }
    }

    constructor(injector: Injector,
        private _fb: FormBuilder,
        private _scheduleService: ScheduleService,
        private _modal: NzModalRef,
        private _beamsTreatmentScheduleServiceProxy: BeamsTreatmentScheduleServiceProxy,
        public msg: NzMessageService){
        super(injector);
        this.today = new Date();
    }

    close(): void {
        this._modal.destroy(false);
    }

    onConfirm(): void {
        if(this.delayAhead == 'Delay'){
           this.isDelay = true;
        }
        else{
            this.isDelay = false;
                if(this.selectedRows != null){
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
                        var scheduleTimeArray:string[]= ScheduleConverter.getScheduledTime(selectedSession.scheduledDate).split(':');
                        var yearNum: number = parseInt(strArray[0], 10);
                        var monthNum: number = parseInt(strArray[1], 10) - 1;
                        var dayNum: number = parseInt(strArray[2], 10);
                        var hourNum: number = parseInt(scheduleTimeArray[0],10);
                        var minuteNum: number = parseInt(scheduleTimeArray[1], 10);
                        var planDate = new Date(yearNum, monthNum, dayNum, hourNum, minuteNum, 0);
                        this.rangeTime = new Date((planDate.getTime() - this.today.getTime())) ;
                        var rangeMinutes = (planDate.getTime() - this.today.getTime())/1000/60;
                        var rangeHour:number = Math.floor(rangeMinutes/60);
                        var remainMinute = Math.floor(rangeMinutes) - rangeHour * 60;
                }
            if(rangeHour < this.hours){
                if(rangeHour >= 0){
                    this.msg.error(this.l("The max ahead time is:")+ rangeHour+this.l("Hour") + remainMinute + this.l("Minutes"));
                }
                else{
                    this.msg.error(this.l("can't move session earlier than current time!"));
                }
                return;
            }
            if((rangeHour == this.hours )&&( remainMinute < this.minutes)){
                if(remainMinute >= 0){
                    this.msg.error(this.l("The max ahead time is:")+ rangeHour+this.l("Hour") + remainMinute + this.l("Minutes"));
                }
                else{
                    this.msg.error(this.l("can't move session earlier than current time!"));
                }
                
                return;
            }
        }
        this.batchTimeShiftingExecute(this.selectedRows,this.hours,this.minutes,this.isDelay);
        
    }

    private initValidateForm() {
        this.validateForm = this._fb.group({
            hours: [null, [Validators.max(23),Validators.min(0),Validators.maxLength(2)]],
            minutes: [null, [Validators.max(59),Validators.min(0),Validators.maxLength(2)]],
            delayAhead: [null],
        });

    }

    batchTimeShiftingExecute(selectRows: any, hours: number, minutes: number, isDelay: boolean): void {
        try {
            if (this.isFromMachineSchedule) {
                this.machineBatchShift(selectRows, hours, minutes, isDelay);
            }
            else {
                if (this.hours == null || this.minutes == null) {
                    this.msg.error('hour or min is null');
                    return null;
                }
                if(this.allCompletedOrStopSession){
                    this.msg.error(this.l("seleted sessions are completed or stop,these session can't be modify!"));
                    this._modal.destroy(false);
                }
                this._beamsTreatmentScheduleServiceProxy.batchTimeShiftingSessions(this.sessionItem, hours, minutes, isDelay).subscribe(
                    (result: boolean) => {
                        if (result) {
                            this._modal.destroy(true);
                        }
                    })
            }
        } catch (error) {
            alert(error);
        }
    }

    machineBatchShift(selectRows: any, hours: number, minutes: number, isDelay: boolean): void {
        var sessionUids = [];
        if (selectRows != null) {
            selectRows.forEach(selectRow => {
                var sessionUid = selectRow.id
                sessionUids.push(sessionUid);
            })
        }
        if (this.hours == null || this.minutes == null) {
            this.msg.error('hour or min is null');
            return null;
        }
        this._beamsTreatmentScheduleServiceProxy.batchTimeShiftingSessions(sessionUids, hours, minutes, isDelay).subscribe(
            (result: boolean) => {
                if (result) {
                    this._modal.destroy(true);
                }
            }
        )
    } 

    


}