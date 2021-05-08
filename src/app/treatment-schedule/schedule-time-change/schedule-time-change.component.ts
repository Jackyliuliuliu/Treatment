import { Component, OnInit, Output, EventEmitter, Input, ViewChild, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { NzModalRef, NzMessageService } from 'ng-zorro-antd';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ScheduleConverter } from '../treatment-schedule-converter';
import { BeamsTreatmentScheduleServiceProxy } from '@shared/service-proxies/service-proxies';
import * as mom from 'moment';

@Component({
    selector: 'app-schedule-time-change',
    templateUrl: './schedule-time-change.component.html',
})


export class ScheduleTimeChangeComponent extends AppComponentBase implements OnInit {
    scheduleTimeForm: FormGroup;
    singleSessionTime: Date;
    multiSessionTime: any;
    today: Date;
    radioValue: any;
    isAll: boolean;
    errmessage: string;
    needChangeItems: any[] = [];
    isDisabled: boolean;


    @Input() selectedRows: any;
    //@Input() isFromMachineSchedule: boolean;//用于区分是哪个模块发出的请求，true表示来自machinetreatmentschedule模块

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private _modal: NzModalRef,
        private _beamsTreatmentScheduleServiceProxy: BeamsTreatmentScheduleServiceProxy,
        public msg: NzMessageService,
    ) {
        super(injector);
        this.today = new Date();
        
    }

    ngOnInit() {
        this.initScheduleTimeForm();
        this.checkSessions();

    }

    checkSessions(): void {
        if (this.selectedRows === null && this.selectedRows === undefined) {
            console.error("[checkSessions]:selectedRows is null ");
            return;
        }
        if (this.selectedRows.length > 1) {
            this.radioValue = "Multi";
        }
        else {
            this.radioValue = "Single";
        }
        this.selectedRows.forEach(selectRow => {
            //停用或是完成的session不准修改时间和日期
            if (selectRow.status.id === 0 ||selectRow.status.id === 2) {
                this.errmessage = this.l("there are some sessions are completed,this action will not change completed session's date!");
                this.isDisabled = true;
                return;
            }
            if (selectRow.status.id === 1 || selectRow.status.id === 3) {
                this.needChangeItems.push(selectRow.id);
            }
        });

    }


    disabledHours(): number[] {
        var dateNow = new Date();
        var hour = dateNow.getHours();
        var temp = [];
        for (var i = 0; i < hour; i++) {
            temp.push(i);
        }
        return temp;
    }

    disabledMinutes(hour: number): number[] {
        var dateNow = new Date();
        var minute = dateNow.getMinutes();
        var temp = [];
        for (var i = 0; i < minute; i++) {
            temp.push(i);
        }
        return temp;
    }

    
    disabledSeconds(hour: number): number[] {
        var dateNow = new Date();
        var second = dateNow.getSeconds();
        var temp = [];
        for (var i = 0; i < second; i++) {
            temp.push(i);
        }
        return temp;
    }

    initScheduleTimeForm() {
        this.scheduleTimeForm = this.fb.group({
            singleRadioControl:[null,null],
            singleChangeRadioControl: [null, null],
            singleSessionTimeControl: [null, null],
            multiSessionsTimeControl: [null, null],
            multiChangeRadioControl: [null, null],
            isAllControl: [null, null],


        })
    }

    close(): void {
        this._modal.destroy(false);
    }

    onConfirm(): void {
        this._beamsTreatmentScheduleServiceProxy.batchTimeShiftSession(this.needChangeItems, mom(this.singleSessionTime), this.isAll).subscribe((result: boolean) => {
            if (result) {
                this._modal.destroy(true);
            }
        });
    }
}