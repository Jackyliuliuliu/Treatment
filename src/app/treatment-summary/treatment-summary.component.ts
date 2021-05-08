import { Component, Injector, OnInit, ViewChild, ElementRef, PipeTransform, Pipe, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { BeamsTreatmentRecordServiceProxy, TreatmentSummaryDto, PatientServiceProxy, PatientDto, PermissionServiceProxy, ValueTupleOfStringAndBoolean } from '@shared/service-proxies/service-proxies';
import { ActivatedRoute } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd';
import { RecordPrintModalComponent } from '@app/treatment-summary/record-print-modal.component';
import { CurrentPatientService } from '@shared/service-proxies/current-patient.service';
import { Subscription } from 'rxjs';
import { CalculateHelper } from '@shared/helpers/CalculateHelper';
import { PermissionType } from '@shared/Permission/PermissionType';
import { SummarySettingComponent } from './summarySetting.component';

@Component({
    templateUrl: './treatment-summary.component.html',
    selector: 'app-treatment-summary',
    styleUrls: ['./treatment-summary.component.less'],
})
export class TreatmentSummaryComponent extends AppComponentBase implements OnInit, OnDestroy {

    constructor(
        injector: Injector,
        private _activatedRouter: ActivatedRoute,
        private _nzModalService: NzModalService,
        private _currentPatientService: CurrentPatientService,
        private _treatmentRecordService: BeamsTreatmentRecordServiceProxy,
        private _permissionServiceProxy: PermissionServiceProxy,
        private _patientService: PatientServiceProxy,
        ) {
        super(injector);
        abp.event.trigger('rvs.module.channged', this._activatedRouter)
        this.subscription = this._currentPatientService.getCurrentPatient().subscribe(
            patient => this.notifyComponent(patient));
        this.checkPermission();
    }

    notifyComponent(patient:any): void {
        if (patient != null) {
            this._patientService.get(patient.id).subscribe(
                data => { this._patientDto = data },
                err => console.error(err),
                () => {
                    if (this._currentPatientService.patientConsitencyCheck(this._patientDto) === false) {
                        // clear ui data & error message
                        this.message.error("[patientConsitencyCheck]: false!");
                    }else {
                        this.getRecordDataByPatientId(this._patientDto.id, this.hideGapChecked);
                    }
                }
            )
           
        }
    }

    @ViewChild('mTableView') elementView: ElementRef;

    private _patientDto: PatientDto = new PatientDto();

    sortValue: string = 'ascend';

    subscription: Subscription;

    treatmentSummaryDto: TreatmentSummaryDto;

    hideGapChecked: boolean = false;

    doseTrackChecked: boolean = false;

    expandStatus = [];

    selectedCell: any;

    tableHeight : any;

    dateList = [
        {
            key: 1,
            name: '',
            list: [],
        },

        {
            key: 2,
            name: this.l('Date'),
            list: [],
        },
    ];

    listOfMapData: any = [];

    mapOfExpandedData: { [key: string]: TreeNodeInterface[] } = {};

    recordTableColumns: ValueTupleOfStringAndBoolean[] = [];

    recordTableRowList = new Array<Array<string>>();

    doseTracking: DoseTrackingDto = new DoseTrackingDto();

    isDoseWarn:boolean;

    isPermission: boolean;

    isSetBtnEditable: boolean = true;

    ngOnInit(): void {
        //let patientId = this._activatedRouter.queryParams['_value']['vPId'];
        //this.getRecordDataByPatientId(patientId, false);

        this.getTableHeight();
        const self = this;
        window.addEventListener('resize', function () {
            self.getTableHeight();
          });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    checkPermission(): void {
        this._permissionServiceProxy.isGranted(PermissionType.RVS_TreatmentSummary_Print).subscribe(
            (ret: boolean) => {
                if (ret != null && ret !== undefined) {
                    this.isPermission = true;
                } else {
                    this.isPermission = false;
                }
            });

        this._permissionServiceProxy.isGranted(PermissionType.RVS_TreatmentSummary_Setting).subscribe(
            (ret: boolean) => {
                if (ret != null && ret !== undefined) {
                    this.isSetBtnEditable = true;
                } else {
                    this.isSetBtnEditable = false;
                }
            }
        );
    }

    getRecordDataByPatientId(patientId: any, hideGap: boolean) {
        let self = this;
        this._treatmentRecordService.getRecordCalendarData(patientId).subscribe(
            (ret: TreatmentSummaryDto) => {
                self.treatmentSummaryDto = ret;
                self.init(hideGap);
            }
        );
    }

    init(hideGap: boolean): void {
        this.clearCache();
        this.initDateList(hideGap);
        this.listOfMapData = this.initCalendarData(hideGap);
        this.listOfMapData.forEach(item => {
            this.mapOfExpandedData[item.key] = this.convertTreeToList(item);
        });
        this.clearRecordDetails();
        this.clearDoseTracking();
    }

    clearRecordDetails()
    {
        this.recordTableColumns = [];
        this.recordTableRowList = new Array<Array<string>>();
    }

    clearDoseTracking()
    {
        this.doseTracking.totalDose = null;
        this.doseTracking.dosePerFraction = null;
        this.doseTracking.doseToCurrentSession = null;
        this.doseTracking.dosePlannedToCurrentSession = null;
    }

    clearCache() : void {
        this.dateList = [
            {
                key: 1,
                name: '',
                list: [],
            },

            {
                key: 2,
                name: 'Date',
                list: [],
            },
        ];

        this.listOfMapData = [];
        this.mapOfExpandedData = {};
    }

    initDateList(hideGap: boolean): void {
        if (null == this.treatmentSummaryDto || null == this.treatmentSummaryDto.dateCloumnList) {
            return;
        }

        this.treatmentSummaryDto.dateCloumnList.forEach(
            (item) => {
                if (hideGap && item.isGap) {
                    //continue
                } else {
                    this.dateList[0].list.push(
                        {
                            num: 1,
                            value: item.weekStr
                        });
                    this.dateList[1].list.push(
                        {
                            num: item.number,
                            value: item.dateStr
                        });
                }
            });
    }

    initCalendarData(hideGap: boolean): any {
        if (null == this.treatmentSummaryDto || null == this.treatmentSummaryDto.beamGroupRowList) {
            return [];
        }

        let calendarData = [];

        let keyNumber = 1;
        this.treatmentSummaryDto.beamGroupRowList.forEach(
            (item) => {
                let beamgroup = {
                    key: keyNumber,
                    name: item.beamGroupName,
                    time: '2018/07/06',
                    list: [],
                    children: [],
                    expand: false,
                    fractionNumber:item.fractionNumber
                };

                let groupItem = this.expandStatus.find(expandItem => expandItem.name === beamgroup.name);
                if (null == groupItem)
                {
                    this.expandStatus.push({
                        name: beamgroup.name,
                        expand: beamgroup.expand 
                    });
                }
                else {
                    beamgroup.expand = groupItem.expand;
                }

                let groupRowList = [];

                item.oneDayGroupFractionList.forEach(
                    (oneDayGroupFractionItem) => {
                        if (oneDayGroupFractionItem.isGap &&
                            hideGap) {
                            //continue
                        }
                        else {
                            let groupRow = {
                                children: []
                            };

                            if (oneDayGroupFractionItem.groupCellList.length === 0) {
                                groupRow.children.push({
                                    checked: 0,
                                    status: 0,
                                    value: '',
                                    name: item.beamGroupName
                                });
                            } else {
                                oneDayGroupFractionItem.groupCellList.forEach(
                                    (groupcell) => {
                                        let group = {
                                            value: groupcell.fractionIndex,
                                            status: groupcell.status,
                                            checked: 0,
                                            count: groupcell.fractionIndex + '/' + groupcell.totalFractionIndex + ' Fxs',
                                            info: '',
                                            recordIdList: groupcell.relatedRecordList,
                                            totalDose: item.totalDose,
                                            dosePerFraction: item.dosePerFraction,
                                            totalDosePlannedToCurrent: item.dosePerFraction * groupcell.fractionIndex,
                                            totalMuPlannedToCurrent: item.totalMu * groupcell.fractionIndex,
                                            name: item.beamGroupName
                                        };
                                        groupRow.children.push(group);
                                    });
                            }

                            groupRowList.push(groupRow);
                        }
                    }
                );

                let beamRowList = [];

                item.oneDayGroupFractionList.forEach(
                    (oneDayGroupFractionItem) => {
                        oneDayGroupFractionItem.groupCellList.forEach(
                            (groupcell) => {
                                groupcell.beamCellList.forEach(
                                    (beamcell) => {
                                        let beamrow = beamRowList.find(
                                            (child) => child.name === beamcell.beamName);
                                        if (null == beamrow) {
                                            ++keyNumber;
                                            beamrow = {
                                                key: keyNumber,
                                                name: beamcell.beamName,
                                                list: []
                                            };
                                            beamRowList.push(beamrow);
                                        };
                                    }
                                )
                            });
                    }
                );

                beamRowList.forEach(
                    (beamrow) => {
                        item.oneDayGroupFractionList.forEach(
                            (oneDayGroupFractionItem) => {
                                if (oneDayGroupFractionItem.isGap &&
                                    hideGap) {
                                        //continue
                                }
                                else {
                                    let beamFraction = {
                                        children: []
                                    };

                                    if (oneDayGroupFractionItem.groupCellList.length === 0) {
                                        beamFraction.children.push(
                                            {
                                                value: '',
                                                status: 0,
                                                checked: 0
                                            });
                                    }
                                    else {
                                        oneDayGroupFractionItem.groupCellList.forEach(
                                            (groupcell) => {
                                                let cell = groupcell.beamCellList.find(
                                                    (child) => child.beamName == beamrow.name);
                                                if (null != cell) {
                                                    if (cell.status === 4) {
                                                        beamFraction.children.push(
                                                            {
                                                                value: '',
                                                                status: cell.status,
                                                                checked: 0,
                                                                recordIdList: groupcell.relatedRecordList,
                                                                mu: cell.deliveredMu,
                                                                msgType: 'override',
                                                                approver: 'admin',
                                                                date:'2019/11/22'
                                                            });
                                                    }
                                                    else {
                                                        beamFraction.children.push(
                                                            {
                                                                value: '',
                                                                status: cell.status,
                                                                checked: 0,
                                                                recordIdList: groupcell.relatedRecordList,
                                                                mu: cell.deliveredMu
                                                            });
                                                    } 
                                                }
                                                else {
                                                    beamFraction.children.push(
                                                        {
                                                            value: '',
                                                            status: 0,
                                                            checked: 0
                                                        }
                                                    )
                                                }
                                            }
                                        );
                                    }

                                    beamrow.list.push(beamFraction);
                                }
                            }
                        )
                    }
                );

                beamgroup.list = groupRowList;
                beamgroup.children = beamRowList;

                calendarData.push(beamgroup);

                ++keyNumber;
            });
        return calendarData;
    }

    chooseBeamGroup(data: any) {
        if (this.selectedCell != null) {
            this.selectedCell.checked = 0;
        }

        data.checked = 1;
        this.selectedCell = data;

        this.GenerateDoseTracking(data);

        this._treatmentRecordService.getRecordDetailsByBeamIds(data.recordIdList)
            .subscribe(
                (result) => {
                    this.clearRecordDetails();
                    this.recordTableColumns = result.availableColumnNames;
                    this.recordTableRowList = result.availableRowList;
                }
            );

        this.getTableHeight();
    }

    GenerateDoseTracking(data: any) {
        let currentMu = 0;
        let group = this.listOfMapData.find(item => item.name === data.name);
        if (null != group && null != group.list) {
            let groupDayIndex = -1;
            let dayItemIndex = -1;

            for(let i = 0; i < group.list.length; i ++) {
                let found = false;
                let groupDayColumn = group.list[i];
                for(let j = 0; j < groupDayColumn.children.length; j++) {
                    let groupColumn = groupDayColumn.children[j];
                    if (groupColumn.checked === 1) {
                        groupDayIndex = i;
                        dayItemIndex = j;
                        found = true;
                        break;
                    }
                }

                if (found === true) {
                    break;
                }
            }

            group.children.forEach((beamItem) => {
                for(let i = 0; i < groupDayIndex; i++) {
                    beamItem.list[i].children.forEach(
                        (cell) => {
                            if (null != cell.mu) {
                                currentMu = CalculateHelper.add(cell.mu, currentMu);
                            }
                        }
                    )
                }

                for(let i = 0; i <= dayItemIndex; i++) {
                    let mu = beamItem.list[groupDayIndex].children[i].mu
                    if (null != mu) {
                        currentMu = CalculateHelper.add(mu, currentMu);
                    }
                }
            });
        }

        let currentDose = currentMu / data.totalMuPlannedToCurrent * data.totalDosePlannedToCurrent;

        this.doseTracking.totalDose = data.totalDose.toFixed(1);
        this.doseTracking.dosePerFraction = data.dosePerFraction.toFixed(1);
        this.doseTracking.doseToCurrentSession = currentDose.toFixed(1);
        this.doseTracking.dosePlannedToCurrentSession = data.totalDosePlannedToCurrent.toFixed(1);
        this.isDoseWarn = this.isDoseWaring(); 
    }

    isDoseWaring():boolean
    {
        let dosePercent:number =  Math.abs(parseFloat(this.doseTracking.doseToCurrentSession) - parseFloat(this.doseTracking.dosePlannedToCurrentSession))/parseFloat(this.doseTracking.dosePlannedToCurrentSession)
        return parseFloat(dosePercent.toFixed(2)) > 0.03;
    }

    chooseBeam(data: any) {
        if (this.selectedCell != null) {
            this.selectedCell.checked = 0;
        }

        data.checked = 1;
        this.selectedCell = data;

        this._treatmentRecordService.getRecordDetailsByBeamIds(data.recordIdList)
            .subscribe((result) => {
                        this.clearRecordDetails();
                        this.recordTableColumns = result.availableColumnNames;
                        this.recordTableRowList = result.availableRowList;
                    });
    }

    hideGapChanged() {
        this.init(this.hideGapChecked);
    }

    printBtnClicked() {
        let beamGroupList = this.getBeamGroupList();
        let modal =
        this._nzModalService.create({
            nzContent: RecordPrintModalComponent,
            nzComponentParams: {
                beagroupList: beamGroupList
            },
            nzWidth: 560,
            nzMaskClosable: false,
            nzTitle: this.l('Select a BeamGroup for Print'),
            nzFooter: null
        });
        // modal.afterClose.subscribe((result: string) => {

        //     let print = new ReportPrint();
        //     print.DisplayPrintPreview(result, newWindow);
        // });
    }

    settingBtnClicked() {
        let modal = this._nzModalService.create(
            {
                nzContent: SummarySettingComponent,
                nzMaskClosable: false,
                nzTitle: "列设置",
                nzWidth: 1000,
                nzFooter: null
            });
        
        modal.afterClose.subscribe(
            () => {
                if (this.selectedCell == null || this.selectedCell == undefined) {
                    return;
                }

                var recordIds = this.selectedCell.recordIdList;
                this._treatmentRecordService.getRecordDetailsByBeamIds(recordIds)
                    .subscribe((result) => {
                        this.clearRecordDetails();
                        this.recordTableColumns = result.availableColumnNames;
                        this.recordTableRowList = result.availableRowList;
                    });
            }
        )
    }

    sort(sort: {key: string, value: string }) {
        if (this.selectedCell == null || this.selectedCell == undefined) {
            return;
        }

        if (this.sortValue === 'ascend') {
            this.sortValue = 'descend';
        } else if (this.sortValue === 'descend') {
            this.sortValue = 'ascend';
        }

        var recordIds = this.selectedCell.recordIdList;
        this._treatmentRecordService.getRecordDetailsByBeamIdsWithSort(recordIds,
            sort.key,
            this.sortValue)
            .subscribe((result) => {
                this.clearRecordDetails();
                this.recordTableColumns = result.availableColumnNames;
                this.recordTableRowList = result.availableRowList;
            });        
    }

    getBeamGroupList() : Array<{id:number, value:string}> {
        let ret = new Array<{id:number, value:string}>();
        if (null != this.treatmentSummaryDto &&
            null != this.treatmentSummaryDto.beamGroupRowList) {
                this.treatmentSummaryDto.beamGroupRowList.forEach((item) => {
                    let beamgroup = {
                        id: item.beamGroupId,
                        value: item.beamGroupName
                    }
                    ret.push(beamgroup);
                })
        }

        return ret;
    }

    getTableHeight(): void {
        console.log('高度', this.elementView.nativeElement.offsetHeight);
        this.tableHeight = String((this.elementView.nativeElement.offsetHeight - 90) + 'px');
      }

    collapse(array: TreeNodeInterface[], data: TreeNodeInterface, $event: boolean): void {
        if ($event === false) {
            if (data.children) {
                data.children.forEach(d => {
                    const target = array.find(a => a.key === d.key)!;
                    target.expand = false;
                    this.collapse(array, target, false);
                });
            } else {
                this.getTableHeight();
                return;
            }
        }

        let groupItem = this.expandStatus.find(item => item.name === data.name);
        if (null != groupItem)
        {
            groupItem.expand = $event;
        }
        this.getTableHeight();
    }

    visitNode(node: TreeNodeInterface, hashMap: { [key: string]: any }, array: TreeNodeInterface[]): void {
        if (!hashMap[node.key]) {
            hashMap[node.key] = true;
            array.push(node);
        }
    }

    convertTreeToList(root: any): TreeNodeInterface[] {
        const stack: any[] = [];
        const array: any[] = [];
        const hashMap = {};
        stack.push({ ...root, level: 0, expand: root.expand });

        while (stack.length !== 0) {
            const node = stack.pop();
            this.visitNode(node, hashMap, array);
            if (node.children) {
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push({ ...node.children[i], level: node.level + 1, expand: false, parent: node });
                }
            }
        }

        return array;
    }
}

export interface TreeNodeInterface {
    key: number;
    name: string;
    age: number;
    level: number;
    expand: boolean;
    address: string;
    children?: TreeNodeInterface[];
}

export class DoseTrackingDto {
    totalDose: string;
    dosePerFraction: string;
    doseToCurrentSession: string;
    dosePlannedToCurrentSession: string;
}


@Pipe({name: 'accuracy2'})
export class Accuracy2Pipe implements PipeTransform {
  transform(value: string): string {
      if(value != null &&  value != "")
      {
        return parseFloat(value).toFixed(2);
      }
   
  }
}

@Pipe({name: 'accuracy1'})
export class Accuracy1Pipe implements PipeTransform {
  transform(value: string): string {
    if(value != null &&  value != "")
    {
        return parseFloat(value).toFixed(1);
    }
  }
}




