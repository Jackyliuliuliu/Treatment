import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { NzModalRef } from 'ng-zorro-antd';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ScheduleConverter } from '../treatment-schedule-converter';
import { BeamsTreatmentScheduleServiceProxy } from '@shared/service-proxies/service-proxies';
import * as mom from 'moment';


@Component({
    selector: 'app-schedule-date-change',
    templateUrl: './schedule-date-change.component.html',
})


export class ScheduleDateChangeComponent extends AppComponentBase implements OnInit {
    
    scheduleDateForm: FormGroup;
    dateRadioValue: any;
    singleSessionDate: Date;
    isAll: boolean;
    multiSessionDate: Date;
    errmessage: string;
    needChangeItems: any[] = [];
    isDisabled: boolean;


    @Input() selectedRows: any;
    //@Input() isFromMachineSchedule: boolean;//用于区分是哪个模块发出的请求，true表示来自machinetreatmentschedule模块

    disabledDate = (date: Date): boolean => {
        let dateNow = new Date();
        let year = dateNow.getFullYear();
        let month = dateNow.getMonth();
        let day = dateNow.getDate();
        return date.getTime() < new Date(year, month, day).getTime();
    };

    constructor(
        injector: Injector,
        private _modal: NzModalRef,
        private fb: FormBuilder,
        private _beamsTreatmentScheduleServiceProxy: BeamsTreatmentScheduleServiceProxy,
    ) {
        super(injector);


    }

    ngOnInit() {
        this.initScheduleDateForm();
        this.checkSessions();
    }

    checkSessions(): void {
        if (this.selectedRows === null && this.selectedRows === undefined) {
            console.error("[checkSessions]:selectedRows is null ");
            return;
        }
        if (this.selectedRows.length > 1) {
            this.dateRadioValue = "Multi";
        }
        else {
            this.dateRadioValue = "Single";
        }
        this.selectedRows.forEach(selectRow => {
            //停用或是完成的session不准修改时间和日期
            if (selectRow.status.id === 0 || selectRow.status.id === 2) {
                this.errmessage = this.l("there are some sessions are completed,this action will not change completed session's date!");
                this.isDisabled = true;
                return;
            }
            if (selectRow.status.id === 1 || selectRow.status.id === 3) {
                this.needChangeItems.push(selectRow.id);
            }
        });
    }

    initScheduleDateForm() {
        this.scheduleDateForm = this.fb.group({
            singleRadioControl: [null, null],
            singleDateChangeRadioControl: [null, null],
            singleSessionDateControl: [null, null],
            isAllControl: [null, null],
            multiDateChangeRadioControl: [null, null],
            multiSessionDateControl: [null, null],
        })
    }

    onConfirm() {
        this._beamsTreatmentScheduleServiceProxy.batchDateChangeSessions(this.needChangeItems, mom(this.singleSessionDate), this.isAll).subscribe(
            (result: boolean) => {
                if (result) {
                    this._modal.destroy(true);
                }
            }
        )
    }


    close(): void {
        this._modal.destroy(false);
    }

}