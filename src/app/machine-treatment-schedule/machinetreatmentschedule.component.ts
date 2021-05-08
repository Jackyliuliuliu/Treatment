import { Component, Injector, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { TreatmentSessionDto, QueryAllSessionInput, EnumServiceProxy, TreatmentSessionStatus, TreatmentScheduleSessionDto, BeamsTreatmentScheduleServiceProxy, PermissionServiceProxy } from '@shared/service-proxies/service-proxies';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { MachinetreatmentScheduleServiceServiceProxy } from '@shared/service-proxies/service-proxies';
import { PagedListingComponentBase, PagedRequestDto } from '@shared/paged-listing-component-base';
import { finalize } from 'rxjs/operators';
import { QueryCondition } from '@app/machine-treatment-schedule/query-condition';
import { BatchDateShiftComponent } from '@app/treatment-schedule/batch-date-shift/batch-date-shift.component';
import { ScheduleService } from '@shared/schedule-service/schedule-service';
import { BatchDateChangeComponent } from '@app/treatment-schedule/batch-date-change/batch-date-change.component';
import { BatchTimeShiftComponent } from '@app/treatment-schedule/batch-time-shift/batch-time-shift.component';
import { PermissionType } from '@shared/Permission/PermissionType';
import { ScheduleDateChangeComponent } from '@app/treatment-schedule/schedule-date-change/schedule-date-change.component';
import { ScheduleTimeChangeComponent } from '@app/treatment-schedule/schedule-time-change/schedule-time-change.component';



@Component({
    templateUrl: './machinetreatmentschedule.component.html',
    styleUrls: ['./machinetreatmentschedule.component.less'],
})
export class MachineTreatmentScheduleComponent extends PagedListingComponentBase<TreatmentSessionDto> implements OnInit {

    listOfData: TreatmentSessionDto[] = new Array<TreatmentSessionDto>();
    queryCondition: QueryCondition = new QueryCondition();
    machinelist: string[] = [];
    sessionStatusList: any = [];

    tableHeight: any;



    
    selectedRowIndex = undefined;

    //checkbox
    isAllDisplayDataChecked = false;
    isIndeterminate = false;
    mapOfCheckedId: { [key: string]: boolean } = {};
    numberOfCheckedItems: number;

    advanceValue: number;
    delayValue: number;
    isShiftKeyDown: boolean;
    selectedItems: TreatmentSessionDto[] = [];
    selectedIdList: number[] = [];
    isDeleteEditable: boolean;
    isActiveEditable: boolean;
    isDatetimeEditable: boolean;

    @ViewChild('mTableView') elementView: ElementRef;
    @HostListener('window:mouseup', ['$event']) onMouseUp(event) {
        if (event.shiftKey) {
            this.isShiftKeyDown = true;
        }
    }

    constructor(
        injector: Injector,
        private _machineScheduleServiceProxy: MachinetreatmentScheduleServiceServiceProxy,
        private _activatedRouter: ActivatedRoute,
        private _msg: NzMessageService,
        private _nzModalService: NzModalService,
        private _enumServiceProxy: EnumServiceProxy,
        private _scheduleService: ScheduleService,
        private _beamsTreatmentScheduleServiceProxy: BeamsTreatmentScheduleServiceProxy,
        private _permissionServiceProxy: PermissionServiceProxy,
    ) {
        super(injector);
        abp.event.trigger('rvs.module.channged', this._activatedRouter)

        this.pageSize = 30;

        this._machineScheduleServiceProxy.getAllMachineNames().subscribe(
            (ret) => {
                this.machinelist = ret;
                if (this.machinelist.find(item => item === "All") === undefined) {
                    this.machinelist.push("All");
                    this.queryCondition.machineName = this.machinelist[this.machinelist.length - 1];
                }
            });

        this._enumServiceProxy.getMap("TreatmentSessionStatus").subscribe(
            (ret) => {
                for (var kv in ret) {
                    this.sessionStatusList.push({ id: ret[kv], name: kv })
                }
                if (this.sessionStatusList.find(item => item.name === "All") === undefined) {
                    this.sessionStatusList.push({ id: 4, name: "All" })
                }
                this.queryCondition.sessionStatus = this.sessionStatusList.find(item => item.name=== "All");
            }
        );
        this.checkPermission();
    }

    ngOnInit() {
        this.queryCondition.sessionDateRange[0] = new Date();
        this.refresh();

        this.getTableHeight();
        const self = this;
        window.addEventListener('resize', function () {
            self.getTableHeight();
        });
    }

    checkPermission(): void {
        this._permissionServiceProxy.isGranted(PermissionType.RVS_MachineSchedule_Editable).subscribe((ret: boolean) => {
            if (ret != null && ret !== undefined) {
                this.isDatetimeEditable = ret;
            } else {
                this.isDatetimeEditable = false;
            }
        });
        this._permissionServiceProxy.isGranted(PermissionType.RVS_MachineSchedule_Active).subscribe((ret: boolean) => {
            if (ret != null && ret !== undefined) {
                this.isActiveEditable = ret;
            } else {
                this.isActiveEditable = false;
            }
        });
        this._permissionServiceProxy.isGranted(PermissionType.RVS_MachineSchedule_Delete).subscribe((ret: boolean) => {
            if (ret != null && ret !== undefined) {
                this.isDeleteEditable = ret;
            } else {
                this.isDeleteEditable = false;
            }
        });
    }



    protected list(request: PagedRequestDto, pageNumber: number, finishedCallback: Function): void {
        let input = new QueryAllSessionInput();
        input.machineName = this.queryCondition.machineName;
        input.sessionStartDate = this.queryCondition.sessionDateRange[0];
        input.sessionEndDate = this.queryCondition.sessionDateRange[1];
        if (this.queryCondition.sessionStatus !== undefined) {
            let status = new TreatmentSessionStatus();
            status.id = this.queryCondition.sessionStatus.id;
            status.name = this.queryCondition.sessionStatus.name;
            input.sessionStatus = status;
        }

        input.patientName = this.queryCondition.patientName;
        input.patientId = this.queryCondition.patientId;
        input.sorting = this.getSort();
        input.maxResultCount = request.maxResultCount;
        input.skipCount = request.skipCount;

        this._machineScheduleServiceProxy.queryAllSessions(input)
            .pipe(finalize(() => {
                finishedCallback();
            })).subscribe(result => {
                this.listOfData = result.items;
                this.showPaging(result, pageNumber);
                this.refreshStatus(null);
            });
    }

    protected delete(entity: TreatmentSessionDto): void {
    }

    queryConditionChanged() {
        this.refresh();
    }

    queryConditionDelayChanged(){
        setTimeout(() => {
            this.refresh();
        }, 1000);
    }

    resetQueryCondition() {
        this.queryCondition = new QueryCondition();
        this.refresh();
    }

    getTableHeight(): void {
        this.tableHeight = String((this.elementView.nativeElement.offsetHeight - 130) + 'px');
    }

    dropdownVisibleChanged(visibale: boolean, i: number) {
        if (visibale === true) {
            this.selectedRowIndex = i;
        } else if (visibale === false) {
            this.selectedRowIndex = undefined;
        }
    }

    refreshStatus(id: number): void {
        try {
            console.log("[refreshStatus] start")
            this.isAllDisplayDataChecked = this.listOfData.every(item => this.mapOfCheckedId[item.id]);
            this.isIndeterminate =
                this.listOfData.some(item => this.mapOfCheckedId[item.id]) && !this.isAllDisplayDataChecked;
            this.numberOfCheckedItems = this.listOfData.filter(item => this.mapOfCheckedId[item.id]).length;
            this.selectedItems = this.getCurrentPageSelectedItems();
            if (this.isShiftKeyDown) {
                this.isShiftKeyDown = false;
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
        } catch (error) {
            console.log(error)
        }
    }

    //index2需要比index1大
    changeSelectedCheckStatus(index1: number, index2: number): void {
        if (index1 === null || index1 === undefined || index2 === null || index2 === undefined) {
            //this.isShiftKeyDown = false;
            return;
        }
        if (index1 >= index2) {
            //this.isShiftKeyDown = false;
            return;
        }
        for (var i = 0; i < this.listOfData.length; i++) {
            if (index1 < i && i < index2) {
                this.mapOfCheckedId[this.listOfData[i].id] = true;
                //this.isShiftKeyDown = false;
            }
        }
    }

    checkAll(value: boolean): void {
        this.listOfData.forEach(item => (this.mapOfCheckedId[item.id] = value));
        this.refreshStatus(null);
    }

    getCurrentPageSelectedItems() : TreatmentSessionDto[] {
        let items = this.listOfData.filter(item => this.mapOfCheckedId[item.id]);
        return items;
    }

    batchAdvance(): void {
        if (null == this.selectedItems || this.selectedItems.length === 0) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }

        let advanceModal = this._nzModalService.create({
            nzContent: BatchDateShiftComponent,
            nzMaskClosable: false,
            nzComponentParams: { selectedRows: this.selectedItems, isDelay: false, isFromMachineSchedule: true },
            nzWidth: 560,
            nzTitle:this.l('Shift Forward'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null,
        });

        this._scheduleService.modalName = this.l('Shift Forward');

        advanceModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {

                this.refresh()
            }
        })
    }

    batchDelay() {
        let items = this.getCurrentPageSelectedItems();
        if (null == items || items.length === 0) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }

        let delayModal = this._nzModalService.create({
            nzContent: BatchDateShiftComponent,
            nzMaskClosable: false,
            nzComponentParams: {selectedRows: this.selectedItems, isDelay: true, isFromMachineSchedule: true},
            nzWidth: 560,
            nzTitle:this.l('Shift Backward'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null,
        });

        this._scheduleService.modalName = 'Shift Backward';
        delayModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {

                this.refresh()

            }
        });
    }

    batchActive() {
        let items = this.getCurrentPageSelectedItems();
        if (null == items || items.length === 0) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }
        if (items.length === 1) {
            if (items[0].isActive) {
                this._msg.warning(this.l("selectedRow has been active."));
                return;
            }
        }
        this.changeActiveExcute(items, true);
    }

    batchInActive() {
        let items = this.getCurrentPageSelectedItems();
        if (null == items || items.length === 0) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }
        if (items.length === 1) {
            if (items[0].isActive === false) {
                this._msg.warning(this.l("selectedRow has been inactive."));
                return
            }
        }
        this.changeActiveExcute(items, false);
    }

    batchDelete() {
        let items = this.getCurrentPageSelectedItems();
        if (null == items || items.length === 0) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }
        items.forEach(item => {
            if (item.status.name == "Completed" || item.status.name == "Partly") {
                this._msg.warning(this.l("there are some session is completed or partly, they can't be delete!"));
            }
        });
        this.deleteExcute(items);
    }

    changeSessionDate() {
        let items = this.getCurrentPageSelectedItems();
        if (null == items || items.length === 0) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }

        let settingModal = this._nzModalService.create({
            nzContent: ScheduleDateChangeComponent,
            nzMaskClosable: false,
            nzComponentParams: { selectedRows: this.selectedItems },
            nzWidth: 560,
            nzTitle:this.l('Change Date'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null,
        });
        this._scheduleService.modalName = 'Change Date';

        settingModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                this.refresh();
            }
        })
    }

    changeSessionTime() {
        let items = this.getCurrentPageSelectedItems();
        if (null == items || items.length === 0) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }

        let timeShiftModal = this._nzModalService.create({
            nzContent: ScheduleTimeChangeComponent,
            nzMaskClosable: false,
            nzComponentParams: { selectedRows: this.selectedItems },
            nzWidth: 560,
            nzTitle:this.l('Change Time'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null,
        });

        this._scheduleService.modalName = 'Change Time';

        timeShiftModal.afterClose.subscribe((result:boolean) => {
            if (result == true) {
                this.refresh();
            }          
        })


    }

    singleChangeActive(item: TreatmentSessionDto) {
        if(!this.isActiveEditable){
            return;
        }
        let items: TreatmentSessionDto[] = [];
        items.push(item);

        this.changeActiveExcute(items, !item.isActive);
    }

    singleSessionActive(item: TreatmentSessionDto) {
        let items: TreatmentSessionDto[] = [];
        items.push(item);

        this.changeActiveExcute(items, true);
    }

    singleSessionInActive(item: TreatmentSessionDto) {
        let items: TreatmentSessionDto[] = [];
        items.push(item);

        this.changeActiveExcute(items, false);
    }

    singleFractionAdvance(item: TreatmentSessionDto) {
        //this.moveDaysExcute(items, this.advanceValue, true);
        // this.advanceValue = undefined;
        if (null == item || item === undefined) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }
        let items: TreatmentSessionDto[] = [];
        items.push(item);

        let advanceModal = this._nzModalService.create({
            nzContent: BatchDateShiftComponent,
            nzMaskClosable: false,
            nzComponentParams: { selectedRows: items, isDelay: false, isFromMachineSchedule: true },
            nzWidth: 560,
            nzTitle:this.l('Shift Forward'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null,
        });

        this._scheduleService.modalName = this.l('Shift Forward');

        advanceModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                this.refresh()
            }
        })
    }

    singleChangeSessionTime(item: TreatmentSessionDto) {
        if (null == item || item === undefined) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }
        var sessions: TreatmentSessionDto[] = [];
        sessions.push(item);
        let timeShiftModal = this._nzModalService.create({
            nzContent: ScheduleTimeChangeComponent,
            nzMaskClosable: false,
            nzComponentParams: { selectedRows: sessions},
            nzWidth: 560,
            nzTitle: this.l('Change Time'),
            nzWrapClassName: "vertical-center-modal",
            nzVisible: true,
            nzFooter: null,
        });
        this._scheduleService.modalName = 'Change Time';
        timeShiftModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                this.refresh();
            }
        })
    }

    singleChangeSessionDate(item: TreatmentSessionDto) {

        if (null == item || item === undefined) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }
        var sessions: TreatmentSessionDto[] = [];
        sessions.push(item);
        let settingModal = this._nzModalService.create({
            nzContent: ScheduleDateChangeComponent,
            nzMaskClosable: false,
            nzComponentParams: { selectedRows: sessions },
            nzWidth: 560,
            nzTitle: this.l('Change Date'),
            nzWrapClassName: "vertical-center-modal",
            nzVisible: true,
            nzFooter: null,
        });
        this._scheduleService.modalName = 'Change Date';

        settingModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                this.refresh();
            }
        })
    }



    singleFractionDelay(item : TreatmentSessionDto) {
        if (null == item || item === undefined) {
            this._msg.warning(this.l('selectedRows is null, please select valid data.'));
            return;
        }
        let items: TreatmentSessionDto[] = [];
        items.push(item);
        let delayModal = this._nzModalService.create({
            nzContent: BatchDateShiftComponent,
            nzMaskClosable: false,
            nzComponentParams: {selectedRows: items, isDelay: true, isFromMachineSchedule: true},
            nzWidth: 560,
            nzTitle:this.l('Shift Backward'),
            nzWrapClassName:"vertical-center-modal",
            nzVisible:true,
            nzFooter: null,
        });

        this._scheduleService.modalName = 'Shift Backward';
        delayModal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                this.refresh()
            }
        });
    }

    singleDelete(item: TreatmentSessionDto) {  
        if (!this.isDeleteEditable) {
            return;
        }    
        let items: TreatmentSessionDto[] = [];
        items.push(item);

        this.deleteExcute(items);
    }



    changeActiveExcute(items : TreatmentSessionDto[], value: boolean) {
        if (null == items) {
            return;
        }
        
        var dto = [];
        items.forEach(
            (item) => {
                if (item.isActive !== value) {

                    dto.push(item.id);
                }
            }
        )

        this._beamsTreatmentScheduleServiceProxy.bathActiveOrInactiveSessions(dto,value).subscribe(
            (ret: boolean) => {
                if(ret) {
                    this._msg.success(this.l('Action Success'));
                    this.refresh();
                } else {
                    this._msg.error(this.l("Action Failed"))
                } 
            }
        )
    }

    deleteExcute(items: TreatmentSessionDto[]) {
        abp.message.confirm(
            '',
            (isConfirmed: boolean) => {
                if (isConfirmed) {
                    let ids = [];
                    items.forEach((item) => {
                        if (item.status.name !== "Completed" && item.status.name !== "Partly") {
                            ids.push(item.id);
                        }
                    });

                    this._machineScheduleServiceProxy.deleteSessionsById(ids).subscribe(
                        (ret) => {
                            if (ret) {
                                this._msg.success(this.l("delete successfull"));
                                this.refresh();
                            } else {
                                this._msg.error(this.l("delete failed"));
                            }
                        });
                }
            });
    }
}
