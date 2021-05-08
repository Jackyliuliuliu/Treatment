import { Component, Injector, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NzModalRef, NzMessageService } from 'ng-zorro-antd';
import { BeamsTreatmentScheduleServiceProxy, TreatmentScheduleStrategyDto, BeamGroupServiceProxy, BeamGroupDto, PermissionServiceProxy } from '@shared/service-proxies/service-proxies';
import * as mom from 'moment';
import { Moment } from 'moment';
import { ScheduleService } from '@shared/schedule-service/schedule-service';
import * as moment from 'moment';
import { AppComponentBase } from '@shared/app-component-base';
import { PermissionType } from '@shared/Permission/PermissionType';

@Component({
    selector: "treatment-schedule-setting-modal",
    templateUrl: './treatment-schedule-setting.component.html',
    styles: [
        `
          form {
            max-width: 600px;
          }
        `
    ],
    styleUrls: ['./treatment-schedule-setting.component.less']
})
export class TreatmentScheduleSettingComponent extends AppComponentBase implements OnInit {

    @Input() beamgroupId: number;
    @Input() treatmentCure: number;
    @Input() moduleName: string;


    //previewSession
    isPreviewSessionViewVisible: boolean;
    isSpinning: boolean;//preview界面loading
    listOfSession: any[] = [];
    visible = false;
    modalName: string = null;
    listOfOption = [];
    totalNum: number;
    sessions = [];
    fractionDose: string;
    fractionNumber: string;
    totalDose: string;
    starttime = new Date();
    endtime = new Date();
    validateForm: FormGroup;
    TimesPerDay: number = 1;
    startTxTime: Date;
    durationTime: Date;
    startselectedValue: { label: string; value: string };
    endselectedValue: { label: string; value: string };
    updateScheduleStrategyRet: boolean = false;
    StartTxDate: Date = null;
    IsMondaySelected: boolean = true;
    IsTuesdaySelected: boolean = true;
    IsWednesdaySelected: boolean = true;
    IsThursdaySelected: boolean = true;
    IsFridaySelected: boolean = true;
    IsSaturdaySelected: boolean = true;
    IsSundaySelected: boolean = true;
    isFrequencyVisiable: boolean = false;
    defaultOpenValue = new Date(0, 0, 0, 0, 0, 0);
    defaultDuration = new Date(0, 0, 0, 6, 0, 0);
    warning: any;
    //scheduleStrategy: TreatmentScheduleStrategyDto = new TreatmentScheduleStrategyDto();
    isEditable:boolean = true;
    isReadOnly:boolean = false;


    constructor(
        injector: Injector,
        public router: Router,
        public activeRoute: ActivatedRoute,
        private fb: FormBuilder,
        private _modal: NzModalRef,
        private _scheduleService: BeamsTreatmentScheduleServiceProxy,
        private _beamGroupService: BeamGroupServiceProxy,
        private msg: NzMessageService,
        private _service: ScheduleService,
        private _permissionServiceProxy:PermissionServiceProxy
    ) {
        super(injector);
        this._permissionServiceProxy.isGranted(PermissionType.RVS_TreatmentSchedule_Editable).subscribe(
            result=>{
                if(result){
                    this.isEditable = true;
                    console.log("module is editable!");

                }
                else{
                    //no permission
                    this.isEditable = true;
                    console.log("module is uneditable!");

                }
            }
        );
    }

    updateStartTime(){
        if(this.startTxTime == null){
            this.startTxTime = new Date(0, 0, 0, 0, 0, 0);
        }
    }

    disabledDate = (date: Date): boolean => {
        let dateNow = new Date();
        let year = dateNow.getFullYear();
        let month = dateNow.getMonth();
        let day = dateNow.getDate();
        return date.getTime() < new Date(year, month, day).getTime();
    };


    ngOnInit(): void {
        this.modalName = this._service.modalName;
        this.visible = true;
        this.InitTimes();
        this.IsMondaySelected = true;
        this.IsTuesdaySelected = true;
        this.IsWednesdaySelected = true;
        this.IsThursdaySelected = true;
        this.IsFridaySelected = true;
        this.IsSaturdaySelected = false;
        this.IsSundaySelected = false;

        this.validateForm = this.fb.group({
            startTxDate: [],
            startTxTime: [],
            startselectedValue: 0,
            endselectedValue: 0,
            allChecked: [],
            checkOptionsOne: [],
            TimesPerDay: this.TimesPerDay,
            isAll: [],
            isWeekdayOnly: [],
        });
        this.durationTime = this.defaultDuration;
        this.startTxTime = this.defaultOpenValue;
        this._beamGroupService.getBeamGroupInfoByIndex(this.beamgroupId).subscribe(
            (beamGroupDto: BeamGroupDto) => {
                this.fractionDose = (beamGroupDto.totalDose / beamGroupDto.fractionNumber).toString() + "cGy";
                this.fractionNumber = beamGroupDto.fractionNumber.toString();
                this.totalDose = beamGroupDto.totalDose.toString() + "cGy";
            }
        );
        if (this.moduleName != 'BeamDefinition' && this.treatmentCure != 0) {
            this.getScheduleStrategy();
            this.warning = this.l("Warning: The treatment schedule will create session according to the new treatment rules. Please confirm whether it is modified or not.");
        }
    }



    previewData(): void {
        this.router.navigateByUrl('/app/machine-treatment-schedule');
    }

    submitForm(): void {
        console.log(this.validateForm.value);
        const input = {
            'startTxDate': this.StartTxDate,
            'startTxTime': this.startTxTime,
            'TimesPerDay': this.TimesPerDay,
            'beamgroupId': this.beamgroupId,
            'IsMondaySelected': this.IsMondaySelected,
            'IsTuesdaySelected': this.IsTuesdaySelected,
            'IsWednesdaySelected': this.IsWednesdaySelected,
            'IsThursdaySelected': this.IsThursdaySelected,
            'IsFridaySelected': this.IsFridaySelected,
            'IsSaturdaySelected': this.IsSaturdaySelected,
            'IsSundaySelected': this.IsSundaySelected,
            'TreatmentCure': this.treatmentCure,
            'ModuleName': this.moduleName
        };
        if ((input.startTxDate == null)||(
            input.IsMondaySelected == false && input.IsTuesdaySelected == false && input.IsWednesdaySelected == false &&
            input.IsThursdaySelected == false && input.IsThursdaySelected == false && input.IsFridaySelected == false &&
            input.IsSaturdaySelected == false && input.IsSundaySelected == false
        )) {
            this.msg.warning(this.l("Unable to create session,Please confirm the start date and treatment rules have been filled!"));
            return;
        }
        else {
            if ((input.ModuleName == 'BeamDefinition' && input.TreatmentCure != 0)) {

                this._scheduleService.generateSession(this.inputConverter(input)).subscribe(
                    data => { this.updateScheduleStrategyRet = data; },
                    err => console.error(err),
                    () => {
                        if (this.updateScheduleStrategyRet) {
                            this.close();
                            this.msg.success(this.l('create session Success'));
                        }
                    }
                )

            }

            else {
                this._scheduleService.updateTreatmentSessionOfDG(this.inputConverter(input)).subscribe(
                    data => { this.updateScheduleStrategyRet = data; },
                    err => console.error(err),
                    () => {
                        if (this.updateScheduleStrategyRet) {
                            this.close();
                            this.msg.success(this.l('Action Success'));
                        }
                    }
                );
            }

        }

    }

    timeConverter(startDate: Moment, time: Date): Date {
        if (startDate == null || time == null) {
            return null;
        }
        var strDate: Date = new Date(startDate.toString());
        var yearNum: number = strDate.getFullYear();
        var monthNum: number = strDate.getMonth();
        var dayNum: number = strDate.getDate() + 1;
        var hourNum: number = time.getHours() - 16;
        var minuteNum: number = time.getMinutes();
        var secondsNum: number = time.getSeconds();
        var date: Date = new Date(yearNum, monthNum, dayNum, hourNum, minuteNum, secondsNum);
        return date;
    }

    interverConverter(time: Date): Date {
        if (time == null) {
            return null;
        }
        var strDate: Date = new Date();
        var yearNum: number = strDate.getFullYear();
        var monthNum: number = strDate.getMonth();
        var dayNum: number = strDate.getDate() + 1;
        var hourNum: number = time.getHours() - 16;
        var minuteNum: number = time.getMinutes();
        var secondsNum: number = time.getSeconds();
        var date: Date = new Date(yearNum, monthNum, dayNum, hourNum, minuteNum, secondsNum);
        return date;
    }

    startDateConverter(startDate: Date): Date {
        var year: number = startDate.getFullYear();
        var month: number = startDate.getMonth();
        var day: number = startDate.getDate() + 1;
        var date: Date = new Date(year, month, day, -16, 0, 0);
        return date;
    }

    stragetyDateConverter(startDate: Moment): Date {
        var hour = startDate.hours();
        var minute = startDate.minutes();
        var second = startDate.seconds();
        var ret = new Date(0, 0, 0, hour, minute, second);
        return ret;
    }


    isFrequencyChanged($event) {
        if (this.TimesPerDay > 1) {
            this.isFrequencyVisiable = true;
        }
        else {
            this.isFrequencyVisiable = false;
        }
    }

    inputConverter(input: any): any {
        var scheduleStrategyDto = new TreatmentScheduleStrategyDto();
        scheduleStrategyDto.beamGroupId = input.beamgroupId;
        scheduleStrategyDto.startDate = mom(this.startDateConverter(input.startTxDate));
        scheduleStrategyDto.planStartTime = mom(this.timeConverter(scheduleStrategyDto.startDate, input.startTxTime));
        scheduleStrategyDto.timePerDay = input.TimesPerDay;
        scheduleStrategyDto.treatmentInHoliday = input.IsHolidayCure;
        scheduleStrategyDto.treatmentInMonday = input.IsMondaySelected;
        scheduleStrategyDto.treatmentInTuesDay = input.IsTuesdaySelected;
        scheduleStrategyDto.treatmentInWednesday = input.IsWednesdaySelected;
        scheduleStrategyDto.treatmentThurday = input.IsThursdaySelected;
        scheduleStrategyDto.treatmentFriday = input.IsFridaySelected;
        scheduleStrategyDto.treatmentSaturday = input.IsSaturdaySelected;
        scheduleStrategyDto.treatmentSunday = input.IsSundaySelected;
        scheduleStrategyDto.treatmentCure = input.TreatmentCure;
        scheduleStrategyDto.intervalhour = mom(this.interverConverter(this.durationTime));
        scheduleStrategyDto.moduleName = input.ModuleName;
        return scheduleStrategyDto;
    }

    resetForm(e: MouseEvent): void {
        e.preventDefault();
        this.validateForm.reset();
        for (const key in this.validateForm.controls) {
            this.validateForm.controls[key].markAsPristine();
            this.validateForm.controls[key].updateValueAndValidity();
        }
    }

    close(): void {
        this._modal.destroy();
    }

    onConfirm(): void {
        this.submitForm();
    }

    private InitTimes() {
        const times_Children = [];
        for (let i = 1; i < 4; ++i) {
            times_Children.push({ label: i, value: i });
        }
        this.listOfOption = times_Children;
    }

    getScheduleStrategy(): TreatmentScheduleStrategyDto {

        try {

            this._scheduleService.getScheduleStrategyByDG(this.beamgroupId).subscribe(
                // data => { this.scheduleStrategy = data },
                // err => console.error(err),
                (result:TreatmentScheduleStrategyDto) => {
                    if (result === null || result === undefined) { return }
                    this._service.IsSuccessModifySchedule = true;
                    this.IsMondaySelected = result.treatmentInMonday;
                    this.IsTuesdaySelected = result.treatmentInTuesDay;
                    this.IsWednesdaySelected = result.treatmentInWednesday;
                    this.IsThursdaySelected = result.treatmentThurday;
                    this.IsFridaySelected = result.treatmentFriday;
                    this.IsSaturdaySelected = result.treatmentSaturday;
                    this.IsSundaySelected = result.treatmentSunday;
                    this.startTxTime = this.stragetyDateConverter(result.planStartTime);
                    this.StartTxDate = new Date(moment(result.startDate).format('YYYY/MM/DD'));
                    this.TimesPerDay = result.timePerDay;
                    this.durationTime = result.intervalhour != null ? new Date(moment(result.intervalhour).format('YYYY/MM/DD HH:mm:ss')) : null;
                }
            );
        } catch (error) {
            this.msg.error(error);
            return null;
        }
    }


    isWeekdayOnlyChanged(): void {
        this.IsMondaySelected = true;
        this.IsTuesdaySelected = true;
        this.IsWednesdaySelected = true;
        this.IsThursdaySelected = true;
        this.IsFridaySelected = true;
        this.IsSaturdaySelected = false;
        this.IsSundaySelected = false;
    }

    previewSessionsViewCancel(): void {
        this.closePreviewSessionsView();
    }

    previewSessionViewOk(): void {
        this.closePreviewSessionsView();
    }

    closePreviewSessionsView(): void {
        this.isPreviewSessionViewVisible = false;
        this.isSpinning = false;
        this.listOfSession = [];
    }

    previewClick() {
        this.isPreviewSessionViewVisible = true;
        this.getSessions();
    }

    getSessions(): void {
        try {
            this._scheduleService.getSessionsByBeamGroupId(this.beamgroupId).subscribe(
                data => { this.sessions = data },
                err => console.error(err),
                () => {
                    if (this.sessions != null) {
                        this.sessions.forEach(session => {
                            this.listOfSession.push({
                                FractionNumber: session.fractionNumber,
                                ScheduleDate: session.scheduledDate, 
                                ScheduleTime: session.scheduledDate
                            })
                        })
                    }
                    this.totalNum = this.listOfSession.length;
                    this.isSpinning = true;
                }
            );
        }
        catch (error) {
            this.msg.error(error);
            return null;
        }
    }
}