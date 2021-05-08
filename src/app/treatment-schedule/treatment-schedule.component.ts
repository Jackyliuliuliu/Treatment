import { Component, OnInit, Injector, ViewChild, HostListener, OnDestroy} from "@angular/core";
import { FormGroup} from "@angular/forms";
import { NzModalService, NzMessageService, NzContentComponent} from "ng-zorro-antd";
import { STData} from "@delon/abc";
import { _HttpClient } from "@delon/theme";
import { UserAuthorizationComponent } from "./modal-user-authorization/modal-user-authorization.component";
import { BeamsTreatmentScheduleServiceProxy,TreatmentScheduleSessionDto, PatientServiceProxy, PatientDto, QueryBeamGroupSessionDto, BeamGroupServiceProxy, PermissionServiceProxy } from "@shared/service-proxies/service-proxies";
import { BatchDateChangeComponent } from "./batch-date-change/batch-date-change.component";
import { BatchDateShiftComponent } from "./batch-date-shift/batch-date-shift.component";
import { BatchTimeShiftComponent } from "./batch-time-shift/batch-time-shift.component";
import { ScheduleService } from '@shared/schedule-service/schedule-service';
import { ScheduleConverter } from "./treatment-schedule-converter";
import { ActivatedRoute } from "@angular/router";
import { TreatmentScheduleSettingComponent } from "./treatment-schedule-setting/treatment-schedule-setting.component";
import { CurrentPatientService } from "@shared/service-proxies/current-patient.service";
import { Subscription} from 'rxjs';
import { PagedListingComponentBase, PagedRequestDto} from "@shared/paged-listing-component-base";
import { finalize } from "rxjs/operators";
import { PermissionType } from "@shared/Permission/PermissionType";
import { ScheduleTimeChangeComponent } from "./schedule-time-change/schedule-time-change.component";
import { ScheduleDateChangeComponent } from "./schedule-date-change/schedule-date-change.component";


@Component({
    selector: "treatment-schedule-modal",
    templateUrl: "./treatment-schedule.component.html",
    styleUrls: ['./treatment-schedule.component.less'],
})
export class TreatmentScheduleComponent extends PagedListingComponentBase<TreatmentScheduleSessionDto> implements OnInit, OnDestroy {
    private deliveryGroups: any;
    private _patientDto: PatientDto = new PatientDto();
    validateForm: FormGroup;
    BeamGroupNodes: any[] = [];
    beamGroupId: number = null;
    selectedValue: any[] = [];
    _subscription: Subscription;
    selectedIndex: number = 0;
    selectedRowIndex = undefined;
    dropdownVisible = true;
    advanceValue: number = null;
    delayValue: number = null;
    numberOfChecked: number = 0;
    pageHeight = this.getPageHeight();
    isAllDisplayDataChecked = false;
    isIndeterminate = false;
    mapOfCheckedId: { [key: string]: boolean } = {};
    listOfData = [];
    currentSelectSessionAllActive:boolean;
    isShiftKeyDown :boolean;
    activedNode: any;
    selectedRows: STData[] = [];
    sizeOptions: number[];
    isDeleteEditable: boolean;
    isActiveEditable: boolean;
    isChangeTimeEditable: boolean;
    selectedIdList: number[] = [];

    @ViewChild('userAuthorizationModal') userAuthorizationModal: UserAuthorizationComponent;

    @HostListener('window:mouseup', ['$event']) onMouseUp(event) {
        if(event.shiftKey){
            this.isShiftKeyDown = true;
         }
    }

    constructor(
        injector: Injector,
        private _activatedRouter: ActivatedRoute,
        private _nzModalService: NzModalService,
        private _scheduleService: ScheduleService,
        public msg: NzMessageService,
        private _patientService: PatientServiceProxy,
        private _beamsTreatmentScheduleServiceProxy: BeamsTreatmentScheduleServiceProxy,
        private _currentPatientService: CurrentPatientService,
        private _beamGroupService: BeamGroupServiceProxy,
        private _permissionServiceProxy:PermissionServiceProxy) {
        super(injector);
        abp.event.trigger('rvs.module.channged', this._activatedRouter)
        this._subscription = this._currentPatientService.getCurrentPatient().subscribe(patient => this.getPatientInfo(patient));
        this.pageSize = 30;
        this.sizeOptions = [10,20,30];
        this.checkPermission();
       
    }

    ngOnInit(): void {
        var self = this;
        this.isTableLoading = true;//界面加载数据时，显示加载状态
        window.addEventListener('resize', function () {
            self.pageHeight = self.getPageHeight();
        });

    }

    checkPermission(): void {
        this._permissionServiceProxy.isGranted(PermissionType.RVS_TreatmentSchedule_Editable).subscribe(
            result => {
                if (result) {
                    this.isChangeTimeEditable = true;
                }
                else {
                    this.isChangeTimeEditable = false;
                }
            }
        );
        this._permissionServiceProxy.isGranted(PermissionType.RVS_TreatmentSchedule_Active).subscribe(
            result => {
                if (result) {
                    this.isActiveEditable = true;
                }
                else {
                    this.isActiveEditable = false;
                }
            }
        );
        this._permissionServiceProxy.isGranted(PermissionType.RVS_TreatmentSchedule_Delete).subscribe(
            result => {
                if (result) {
                    this.isDeleteEditable = true;
                }
                else {
                    this.isDeleteEditable = false;
                }
            }
        );
    }

    protected list(request: PagedRequestDto, pageNumber: number, finishedCallback: Function): void {
        var input = new QueryBeamGroupSessionDto();
        input.beamGroupId = this.beamGroupId;
        input.sorting = this.getSort();
        input.maxResultCount = request.maxResultCount;
        input.skipCount = request.skipCount;
        this.listOfData = new Array<TreatmentScheduleSessionDto>();
        this._beamsTreatmentScheduleServiceProxy.querySessionsByBeamGroupId(input)
            .pipe(finalize(() => {
                finishedCallback();
            })).subscribe(result => {
                if(result != null && result.items != null){
                    this.listOfData = result.items;  
                    this.showPaging(result, pageNumber);
                    this.refreshStatus(null);
                }
            });
    }
    protected delete(entity: TreatmentScheduleSessionDto): void {
        throw new Error("Method not implemented.");
    }

    ngOnDestroy(): void {
        this._subscription.unsubscribe();
    }

    setActiveNode(data: any): void {
      this.activedNode = data.title;
    }

    checkAll(value: boolean): void {
        if(this.listOfData.length > 0){
            this.listOfData.forEach(item => (this.mapOfCheckedId[item.id] = value));
            this.refreshStatus(null);
            this.getSelectedRows();
        }
    }

    getSelectedRows(): void {
        this.clearSelectedRows();
        if(this.listOfData != null){
            this.listOfData.forEach(item => {
                if (this.mapOfCheckedId[item.id]) {
                    this.selectedRows.push(item);
                }
            });
        }
    }

    clearSelectedRows(): void {
        if(this.selectedRows != null){
            if (this.selectedRows.length != 0) {
                this.selectedRows = [];
            }
        }
       
    }

    dropdownVisibleChanged(visibale: boolean, i: number) {
        if (visibale === true) {
            this.selectedRowIndex = i;
        } else if (visibale === false) {
            this.selectedRowIndex = undefined;
        }
    }

    refreshStatus(id:number): void {
        this.getSelectedRows();
        if (this.listOfData.length > 0) {
            this.isAllDisplayDataChecked = this.listOfData.every(item => this.mapOfCheckedId[item.id]);
        }
        else{
            this.isAllDisplayDataChecked = false;
        }
        this.isIndeterminate =
            this.listOfData.some(item => this.mapOfCheckedId[item.id]) && !this.isAllDisplayDataChecked;
        this.numberOfChecked = this.listOfData.filter(item => this.mapOfCheckedId[item.id]).length;
        if(this.selectedRows.length>0){
            var isActive =  this.selectedRows[0].isActive;
            var isSameStatus = true;
            for (let index = 0; index < this.selectedRows.length; index++) {
                var selectedRow = this.selectedRows[index];
                if( selectedRow.isActive!= isActive){
                    isSameStatus = false;
                    break;
                }
            }
            if(isSameStatus){
                if(this.selectedRows[0].isActive == true){
                    this.currentSelectSessionAllActive = true;
                }
                else{
                    this.currentSelectSessionAllActive = false;
                }
            }
        }
        if(this.isShiftKeyDown){
            if (id !== null || id !== undefined) {
                this.selectedIdList.push(id);
                if (this.selectedIdList != null && this.selectedIdList.length == 2) {
                    var index1 = this.listOfData.findIndex(item => item.id === this.selectedIdList[0]);
                    var index2 = this.listOfData.findIndex(item => item.id === this.selectedIdList[1]);
                    this.selectedIdList = [];
                    if (index1 < index2) {
                        this.changeSelectedCheckStatus(index1, index2);
                    } else {
                        this.changeSelectedCheckStatus(index2, index1);
                    }
                }
            }
 
        }
       
    }

        //index2需要比index1大
        changeSelectedCheckStatus(index1: number, index2: number): void {
            if (index1 === null || index1 === undefined || index2 === null || index2 === undefined) {
                this.isShiftKeyDown = false;
                return;
            }
            if (index1 >= index2) {
                this.isShiftKeyDown = false;
                return;
            }
            for (var i = 0; i < this.listOfData.length; i++) {
                if (index1 < i && i < index2) {
                    this.mapOfCheckedId[this.listOfData[i].id] = true;
                    this.isShiftKeyDown = false;
                }
            }
        }


    getPatientInfo(patientInfo: any): void {
        if (patientInfo === null) {
            return;
        }
        this.getPatientInformation(patientInfo.id);
    }

    getPatientInformation(patientId: number): void {
        if (patientId == null || patientId == NaN) {
            this.msg.error("patientId is null!",{nzDuration: 2000});
            return null;
        }

        this._patientService.get(patientId).subscribe(
            data => { this._patientDto = data },
            err => console.error(err),
            () => {
                if (this._currentPatientService.patientConsitencyCheck(this._patientDto) === false) {
                }else {
                    this.GetNewPaitentAll(patientId);
                }
            }
        )
    }

    private GetNewPaitentAll(patientId:any): void {
        try {
            this._beamsTreatmentScheduleServiceProxy.getDeliveryGroupsByPatient(patientId).subscribe(
                data => { this.deliveryGroups = data },
                err => console.error(err),
                () => {
                    if (this.deliveryGroups != null) {
                        this.GetDeliveryGroups();
                    }
                }
            )
        } catch (error) {
            alert(error);
        }
    }

       //批量提前日期
       batchAdvance(): void {
        if (this.selectedRows.length === 0) {
            this.msg.warning(this.l('selectedRows is null, please select valid data.'));
            return null;
        }
        let advanceModal = this._nzModalService.create({
            nzContent: BatchDateShiftComponent,
            nzMaskClosable: false,
            nzComponentParams: {selectedRows:this.selectedRows,isDelay:false},
            nzWidth: 560,
            nzTitle:this.l('Shift Forward'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null
        });

        this._scheduleService.modalName = this.l('Shift Forward');

        advanceModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                if (result == true) {
                    this.msg.success(this.l('Action Success'));
                    this.refresh();
                }
            }
        })
    }

    //批量延后日期
    batchDelay(): void {
        if (this.selectedRows.length === 0) {
            this.msg.warning(this.l('selectedRows is null, please select valid data.'));
            return null;
        }
        let delayModal = this._nzModalService.create({
            nzContent: BatchDateShiftComponent,
            nzMaskClosable: false,
            nzComponentParams: {selectedRows:this.selectedRows,isDelay:true},
            nzWidth: 560,
            nzTitle:this.l('Shift Backward'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null
        });

        this._scheduleService.modalName = this.l('Shift Backward');

        delayModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                this.msg.success(this.l('Action Success'));
                this.refresh();
            }
        })
    }

    //批量停用
    batchInActivate(): void {
        if (this.selectedRows.length === 0) {
            this.msg.warning(this.l('selectedRows is null, please select valid data.'));
            return null;
        }
        this._scheduleService.treatmentStatus = 'InActive';
        this.showModalUserAuthorization(this.selectedRows, 'InActive', true);
    }

    //批量激活
    batchActivate(): void {
        if (this.selectedRows.length === 0) {
            this.msg.warning(this.l('selectedRows is null, please select valid data.'));
            return null;
        }
        this._scheduleService.treatmentStatus = 'Active';
        this.showModalUserAuthorization(this.selectedRows, 'Active', true);
    }

    //批量删除
    batchDelete(): void {
        if (this.selectedRows.length === 0) {
            this.msg.warning(this.l('selectedRows is null, please select valid data.'));
            return null;
        }
        var tip = this.l('Warning')+":"+ this.l('ConfirmDeleteSession');
        var otherTip = "";
        var isHasTreatmentSession = false;
        this.selectedRows.forEach(item => {
            if(item.status.name == 'Completed' || item.status.name == 'Partly'){
                isHasTreatmentSession = true;
                otherTip = this.l("there are some session is completed or partly, they can't be delete!");
            }
        });
        if(isHasTreatmentSession){
            tip = tip + otherTip;
        }
        this.showModalUserAuthorizationByDelete(this.selectedRows, true, tip);
    }

    //批量删除实际调用统一处理
    batchDeleteExecute(item: any): void {
        try {
            var result = false;
            var sessionItem = new Array<TreatmentScheduleSessionDto>();
            sessionItem = [];
            item.forEach(selectRow => {
                var session = new TreatmentScheduleSessionDto();
                if(selectRow.status.name == 'Stop' ||selectRow.status.name == 'UnCompleted'){
                    session.id = selectRow.id;
                    sessionItem.push(session);
                }
            });
            this._beamsTreatmentScheduleServiceProxy.delete(sessionItem).subscribe(
                data => { result = data; },
                err => console.error(err),
                () => {
                    if (result) {
                        this.msg.success(this.l('delete successfull'));
                        this.refresh();
                        this.refreshStatus(null);
                        this.selectedRowIndex = undefined;
                    }
                }
            )
        } catch (error) {
            alert(error);
        }
    }
 
    //批量修改时间
    batchTimeShifting(): void {

        if (this.selectedRows.length === 0) {
            this.msg.warning(this.l('selectedRows is null, please select valid data.'));
            return null;
        }
        let timeShiftModal = this._nzModalService.create({
            nzContent: ScheduleTimeChangeComponent,
            nzMaskClosable: false,
            nzComponentParams: {selectedRows:this.selectedRows},
            nzWidth: 560,
            nzTitle:this.l('Change Time'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter:null
        });

        this._scheduleService.modalName = this.l('Change Time');

        timeShiftModal.afterClose.subscribe((result:boolean) => {
            if(result == true){
                this.refresh();
                this.msg.success(this.l('Action Success'));
            }
        })
    }

    //批量更改日期
    batchSettingDate(): void {
        if (this.selectedRows.length === 0) {
            this.msg.warning(this.l('selectedRows is null, please select valid data.'));
            return null;
        }
        let settingModal = this._nzModalService.create({
            nzContent: ScheduleDateChangeComponent,
            nzMaskClosable: false,
            nzComponentParams: {selectedRows:this.selectedRows},
            nzTitle:this.l('Change Date'),
            nzWidth: 560,
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null
        });

        this._scheduleService.modalName = this.l('Change Date');

        //关闭弹窗后得到批量设置的日期
        settingModal.afterClose.subscribe((result : boolean) => {
            if(result == true)
            {
                this.refresh();
                this.msg.success('Action Success');
                this.selectedRowIndex = undefined;
            }
        })
    }

    showModalUserAuthorization(item: any, modalTitle: string, isBatch: boolean): void {
        if (!this.isActiveEditable) {
            return;
        }
        if (item.length === 0) {
            this.msg.error(this.l('selectedRows is null, please select valid data.'));
            return null;
        }
        if(item.isActive == true && modalTitle=="Active"){
            this.msg.error(this.l("this session has alreadly active, can't be active agian!"));
            
            return;
        }
        if(item.isActive == false && modalTitle=="InActive"){
            this.msg.error(this.l("this session has alreadly stop, can't be stop agian!"));
            return;
        }
        if(isBatch == false){
            if(item.status.name == 'Completed'){
                this.msg.error(this.l("this session is completed,it can't be modify"));
                return;
            }
        }
        var tip = "";
        var statusWaring = "";
        var completedstatusWarining = "";
        if(isBatch == false){
            if(item.status.name == 'Completed'){
                this.msg.error(this.l("this session is completed,it can't be modify"));
                return;
            }
        }
        else{
            if(modalTitle == "InActive"){
                var hasInactive = false;
                var hasCompleted = false;
                item.forEach( selectRow => {
                    if(selectRow.isActive == false ){
                       hasInactive = true;
                    }
                    if(selectRow.status.name == 'Completed'){
                        hasCompleted = true;
                    }
                });
                if(hasInactive){
                    statusWaring = this.l("There are some sessions is inActive,Acitve sessions will be inactive!");
                }
                if(hasCompleted){
                    completedstatusWarining = this.l("There are some sessions is Completed,these sessions can't be modify!");
                }
            }
            else{
                var hasActive = false;
                item.forEach( selectRow => {
                    if(selectRow.isActive == true ){
                       hasActive = true;
                    }
                    if(selectRow.status.name == 'Completed'){
                        hasCompleted = true;
                    }
                });
                if(hasActive){
                    statusWaring = this.l("There are some sessions is Active,Inactive sessions will be active!");
                }
                if(hasCompleted){
                    completedstatusWarining = this.l("There are some sessions is Completed,these sessions can't be modify!");
                }
            }
        }

        if(modalTitle == "InActive"){
            tip = this.l("The session is uncompleted,please confirm if stop the session?");
        }
        let userAuthorizationModal = this._nzModalService.create({
            nzContent: UserAuthorizationComponent,
            nzMaskClosable: false,
            nzComponentParams: { tip:tip, statusWarining:statusWaring, completedstatusWarining: completedstatusWarining},
            nzWidth: 560,
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzTitle:this.l(modalTitle),
            nzFooter: null
        })

        this._scheduleService.modalName = this.l(modalTitle);
        userAuthorizationModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                    this.batchScheduleActiveAndInActive(item, modalTitle,isBatch);
                    this.selectedRowIndex = undefined;
            }

        })
    }

    showModalUserAuthorizationByDelete(item: any, isBatch: boolean,tip:string): void {
        if (item.length === 0) {
            this.msg.error(this.l('selectedRows is null, please select valid data.'));
            return null;
        }
        let userAuthorizationModal = this._nzModalService.create({
            nzContent: UserAuthorizationComponent,
            nzMaskClosable: false,
            nzComponentParams: {
                tip:tip,
            },
            nzWidth: 560,
            nzTitle:this.l('Delete'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null
        })

        this._scheduleService.modalName = this.l('Delete');
        userAuthorizationModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                if (isBatch) {
                    this.batchDeleteExecute(item);
                }
                else {
                    if(item.status.name == 'Completed'){
                        this.msg.error(this.l("this session is completed,it can't be modify"));
                        return;
                    }
                    if(item.status.name == 'Partly'){
                        this.msg.error(this.l("this session is partly,it can't be modify!"));
                        return;
                    }
                    this.singleScheduleDelete(item);
                }
            }
        })
    }


    singleScheduleDelete(item: any): void {
        try {
            var result = false;
            var sessionItem = new Array<TreatmentScheduleSessionDto>();
            if (item != null) {
                var session = new TreatmentScheduleSessionDto();
                session.id = item.id;
                sessionItem.push(session);
            }
            this._beamsTreatmentScheduleServiceProxy.delete(sessionItem).subscribe(
                data => { result = data; },
                err => console.error(err),
                () => {
                    if (result) {
                        this.msg.success(this.l('delete successfull'));
                        this.refresh();
                    }
                }
            )
        } catch (error) {
            alert(error);
        }
    }

    singleSessionDelete(item: any): void {
        if(!this.isDeleteEditable){
            return;
        }
        if(item == null)
        {
            this.msg.error(this.l('this item is null.'));
            return null;
        }
        if(item.status.name == 'Completed'){
            this.msg.error(this.l("this session is completed,it can't be modify"));
            return;
        }
        if(item.status.name == 'Partly'){
            this.msg.error(this.l("this session is partly,it can't be modify"));
            return;
        }
        if(item.status.name == 'UnCompleted'|| item.status.name == 'Stop'){
            var tip =this.l('Warning') + ":"+this.l("ConfirmDeleteSession");
        }
        this.showModalUserAuthorizationByDelete(item, false,tip);
    }

    singleChangeSessionTime(selectRow: any): void {
        if (selectRow === null || selectRow === undefined) {
            this.msg.warning(this.l('selectedRows is null, please select valid data.'));
            return null;
        }

        var sessions: STData[] = [];
        sessions.push(selectRow);
        let timeShiftModal = this._nzModalService.create({
            nzContent: ScheduleTimeChangeComponent,
            nzMaskClosable: false,
            nzComponentParams: { selectedRows: sessions },
            nzWidth: 560,
            nzTitle: this.l('Change Time'),
            nzWrapClassName: "vertical-center-modal",
            nzVisible: true,
            nzFooter: null
        });

        this._scheduleService.modalName = this.l('Change Time');

        timeShiftModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                this.refresh();
                this.msg.success(this.l('Action Success'));
            }
        })
    }

    singleChangeSessionDate(selectRow: any): void {
        if (selectRow === null || selectRow === undefined) {
            this.msg.warning(this.l('selectedRows is null, please select valid data.'));
            return null;
        }

        var sessions: STData[] = [];
        sessions.push(selectRow);
        let settingModal = this._nzModalService.create({
            nzContent: ScheduleDateChangeComponent,
            nzMaskClosable: false,
            nzComponentParams: { selectedRows: sessions },
            nzTitle:this.l('Change Date'),
            nzWidth: 560,
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null
        });

        this._scheduleService.modalName = this.l('Change Date');

        //关闭弹窗后得到批量设置的日期
        settingModal.afterClose.subscribe((result : boolean) => {
            if(result == true)
            {
                this.refresh();
                this.msg.success('Action Success');
                this.selectedRowIndex = undefined;
            }
        })

    }

    singleDelayAndAheadExecute(selectRow: any,actionStatus: string): void {
        try {
            var isDelay = false;
            var sessionItem = new Array<number>();
            if (selectRow != null) {
                var session = new TreatmentScheduleSessionDto();
                session.id = selectRow.id;
                if(selectRow.status.name == 'Completed'){
                    this.msg.error(this.l("this session is completed,it can't be modify"));
                    return;
                }
                if(selectRow.status.name == 'Stop'){
                    this.msg.error(this.l("this session is stop,it can't be modify"));
                    return;
                }
                sessionItem.push(session.id);
            }
            switch(actionStatus)
            {
                case 'Delay': 
                    isDelay = true;
                break;

                case 'Ahead':
                    isDelay = false;
            }
            if(isDelay){
                this.batchDelay();
            }
            else{
                this.batchAdvance();
            }
        } catch (error) {
            alert(error);
        }
    }

    batchScheduleActiveAndInActive(item: any, strStatus: string,isBatch:boolean): void {
        try {
            var sessionItem = new Array<number>();
            var isActive = true;
            if (item != null) {
                if (strStatus == 'Active') {
                    isActive = true;
                }
                else {
                    isActive = false;
                }
                if(isBatch){
                    item.forEach( selectRow => {
                        if(this.l(selectRow.status.name) != this.l('Completed')){
                            sessionItem.push(selectRow.id);
                        }
                    });
                }
                else{
                    sessionItem.push(item.id);
                }

            }
            this._beamsTreatmentScheduleServiceProxy.bathActiveOrInactiveSessions(sessionItem, isActive).subscribe(
                (result: boolean) => {
                    if (result) {
                        this.msg.success(this.l('Action Success'));
                         this.refresh();
                    }
                }
            )
        } catch (error) {
            alert(error);
        }
    }

    private GetDeliveryGroups(): void {
        const children = [];
        this.deliveryGroups.forEach(deliveryGroup => {
            children.push(
                {
                    title: ScheduleConverter.convertNullBeamGroupName(deliveryGroup.beamGroup),
                    uid: deliveryGroup.uid,
                    machineName: deliveryGroup.machineName,
                    beamGroup: deliveryGroup.beamGroup,
                    beams: deliveryGroup.beams,
                    planDescription: deliveryGroup.planDescription,
                    id: deliveryGroup.id,
                    isLeaf: true
                });
        })
        this.BeamGroupNodes = children;
        if(this.BeamGroupNodes.length > 0){
            this.selectedValue = this.BeamGroupNodes[0];
            this.isHideClass(this.selectedIndex);
            this.beamGroupId = this.BeamGroupNodes[this.selectedIndex].uid;
            this.activedNode = this.BeamGroupNodes[0].title
            this.refresh();
        }
        else{
            this.listOfData = [];
            this.isTableLoading = false;//当没有符合条件的beamgroup时，使加载数据状态消失
        }

    }

    onCancel(): void {
    }

    modifySchedule(): void {

        if (this.beamGroupId == null) {
            return null;
        }
        if(this.listOfData.length == 0){
            this._beamGroupService.getFractionNumberByBeamgroup(this.beamGroupId).subscribe(
                (ret) => {
                    console.log(this.beamGroupId);
                    let fractionNumber = ret;
                    let modifyScheduleModal=this._nzModalService.create({
                        nzContent: TreatmentScheduleSettingComponent,
                        nzComponentParams: {
                             beamgroupId: this.beamGroupId,
                             treatmentCure: fractionNumber,
                             moduleName:  "BeamDefinition"},
                        nzWidth: 1000,
                        nzFooter: null,
                        nzWrapClassName:"vertical-center-modal background-dose-modal",
                        nzMaskClosable:false,
                        nzVisible:true,
                        nzTitle:"BeamDefinition"
                    });
                    modifyScheduleModal.afterClose.subscribe(() => {
                        if (this.beamGroupId == null) {
                            return null;
                        }
                        this.refresh();
                    })
                }
            )


        }
        else{
            let modifyScheduleModal = this._nzModalService.create({
                nzContent: TreatmentScheduleSettingComponent,
                nzComponentParams: { beamgroupId: this.beamGroupId },
                nzWidth: 1000,
                nzFooter: null,
                nzWrapClassName:"vertical-center-modal background-dose-modal",
                nzMaskClosable:false,
                nzVisible:true,
                nzTitle:this.l('Treatment Schedule Setting')
            });
    
            this._scheduleService.modalName = this.l('Treatment Schedule Setting');;
    
            modifyScheduleModal.afterClose.subscribe(() => {
                if (this.beamGroupId == null) {
                    this.msg.error("[modifySchedule]: beamGroupUid is null.");
                    return null;
                }
                this.refresh();
            })
        }


    }

    isHideClass(index: number) {

        if (index === this.selectedIndex) {
            return 'selected';
        }
    }

    beamGroupNameChange(index: number): void {
        this.selectedIndex = index;
        const value = this.BeamGroupNodes[index];
        if (value == null || value.uid == null) {
            return null;
        }
        var beamGroupId = value.uid;
        this.beamGroupId = beamGroupId;
        this.refreshStatus(null);
        this.refresh()
    }

    getPageHeight(): any {
        return window.innerHeight - 280 + "px";
    }
}


