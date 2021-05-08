import { Component, OnInit, Input, Output, EventEmitter, ViewChild, Injector } from '@angular/core';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { BeamGroupDto,BeamServiceProxy,ControlPointDto, BeamGroupServiceProxy,PermissionServiceProxy, BeamDto, MachineOutput, RadiationType, TechniqueType, PresciprionOutput, ToleranceDto, ToleranceServiceProxy, BeamGroupStatusDto, SetupDto, PatientPosition, PatientSetupDto, BeamGroupImageDto, FixationDeviceImageDto } from '@shared/service-proxies/service-proxies';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { ReportPrint } from '@shared/report-print/report-print';
import { AppComponentBase } from '@shared/app-component-base';
import { UpdateBeamInfoService } from '@shared/service-proxies/update-beamInfo.service';
import { FormsModule, FormGroup, FormBuilder, Validators, FormControl, ValidationErrors, ReactiveFormsModule, Validator } from '@angular/forms';
import { PermissionType } from '@shared/Permission/PermissionType';
import { ControlPointInfo } from '@app/main/beamparameter/beamparameter.component';


@Component({
    selector: 'app-beambar',
    templateUrl: './beambar.component.html',
    styleUrls: ['./beambar.component.less'],
})

export class BeamBarComponent extends AppComponentBase implements OnInit {
    // isApproveBeamGroupVisible: boolean = false;
    // isUnApproveBeamGroupVisible: boolean = false;
    // excutetype: string;//todo 暂时用来区分当前执行的是approve还是unapprove

    @Input()
    isEditPermission: boolean;
    @Input()
    beamGroupNode: TreeNode;
    @Input()
    isBeamSelected: boolean;
    @Input()
    nodeId:string;
    @Input()
    beamGetBeamGroupID:number;
    @Input()
    patientID :number;
    @Input()
    beamGroupList: TreeNode[];
    @Output()
    public BeamGroupApproveChangeClickEvent = new EventEmitter<boolean>();
    @Output()
    public BeamGroupActiveChangeClickEvent = new EventEmitter<boolean>();
    @Output()
    public EditBeamGroup=new EventEmitter<boolean>();
    @Output()
    public EditOffset=new EventEmitter<boolean>();
    @Output()
    public EditBeamGroupPositionImaging=new EventEmitter<boolean>();
    @Output()
    public EditBeamGroupDeviceSequence=new EventEmitter<boolean>();
    @Output()
    public EditBeam=new EventEmitter<boolean>();
    @Output()
    public EditBeamImage=new EventEmitter<boolean>();
    @Output()
    public EditBEVConfirm=new EventEmitter<boolean>();

    
    isPrintPermission:boolean;
    isApprovePermission:boolean;
    isActivePermission:boolean;
    
    constructor(
        private fb: FormBuilder,
        injector: Injector,
        private _beamGroupService: BeamGroupServiceProxy,
        private _permissionServiceProxy: PermissionServiceProxy,
        private _beamService: BeamServiceProxy,
        private _updateBeamInfoService: UpdateBeamInfoService,
        private _message: NzMessageService,
        ) {
        super(injector);
    }

    ngOnInit() {
        
        this.checkPrintPermission();
        this.checkApprovePermission();
        this.checkActivePermission();
        
    }


    onEditBeamGroupConfirm(editStatus:boolean):void{
        this.EditBeamGroup.emit(editStatus);
    }

    onEditOffset(editStatus:boolean):void{
        this.EditOffset.emit(editStatus);
    }

    onEditBeamConfirm(editStatus:boolean):void{
        this.EditBeam.emit(editStatus);
    }

    onEditBeamImageConfirm(editStatus:boolean):void{
        this.EditBeamImage.emit(editStatus);
    }
    onEditBEVConfirm(editStatus:boolean):void{
        this.EditBEVConfirm.emit(editStatus);
    }

    checkPrintPermission(): void {
        this._permissionServiceProxy.isGranted(PermissionType.RVS_BeamDefinition_Print).subscribe((ret: boolean) => {
          if (ret != null && ret !== undefined) {
            this.isPrintPermission = ret;
          } else {
            this.isPrintPermission = true;
          }
        })
      }
    
      checkApprovePermission(): void {
        this._permissionServiceProxy.isGranted(PermissionType.RVS_BeamDefinition_IsApprove).subscribe((ret: boolean) => {
          if (ret != null && ret !== undefined) {
            this.isApprovePermission = ret;
          } else {
            this.isApprovePermission = true;
          }
        })
      }
    
      checkActivePermission(): void {
        this._permissionServiceProxy.isGranted(PermissionType.RVS_BeamDefinition_IsActive).subscribe((ret: boolean) => {
          if (ret != null && ret !== undefined) {
            this.isActivePermission = ret;
          } else {
            this.isActivePermission = true;
          }
        })
      }
    
    activeBeamgroupClick(): void {
        console.log('Button active BeamGroup clicked!');
        if (this.beamGroupNode === null || this.beamGroupNode === undefined) { return }
        if (this.beamGroupNode.type.indexOf("BeamGroup") === -1) {
            this.message.info(this.l("please select beamgroup"));
            return;
        }
        if (this.beamGroupNode.isGroupActived) {
            this.message.warn(this.l("this beam group has been actived."))
            return;
        }
        if (this.beamGroupNode.type.indexOf("BeamGroup") > -1) {
            this.BeamGroupActiveChangeClickEvent.emit(true);
        }

      
    }

    unActiveBeamgroupClick(): void {
        console.log('Button unactive BeamGroup clicked!');
        if (this.beamGroupNode === null || this.beamGroupNode === undefined) { return }
        if (this.beamGroupNode.type.indexOf("BeamGroup") === -1) {
            this.message.info(this.l("please select beamgroup"));
            return;
        }
        if (!this.beamGroupNode.isGroupActived) {
            this.message.warn(this.l("this beam group has been unactived."));
            return;
        }
        if (this.beamGroupNode.type.indexOf("BeamGroup") > -1) {
            this.BeamGroupActiveChangeClickEvent.emit(false);
        }


    }

    approveBeamGroupClick(): void {
        console.log('Button approveBeamGroup clicked!');
        if (this.beamGroupNode === null || this.beamGroupNode === undefined) {
            this.message.warn(this.l("please select beamgroup"));
            return;
        }
        if (this.beamGroupNode.type.indexOf("BeamGroup") === -1) {
            this.message.info(this.l("please select beamgroup"));
            return;
        }
        if (this.beamGroupNode.isApprove) {
            this.message.warn(this.l("this beam group has been approved"));
            return;
        }
        if (!this.beamGroupNode.isGroupActived) {
            this.message.warn(this.l("unactive beamgroup can not approve"))
            return;
        }
        if (this.beamGroupNode.type.indexOf("BeamGroup") > -1) {
            this.BeamGroupApproveChangeClickEvent.emit(true);
        }
    }


    unApproveBeamGroupClick(): void {
        console.log('Button unapproveBeamGroup clicked!');
        if (this.beamGroupNode === null || this.beamGroupNode === undefined) {
            this.message.info(this.l('please select beamgroup'));
            return;
        }
        if (this.beamGroupNode.type.indexOf("BeamGroup") === -1) {
            this.message.info(this.l("please select beamgroup"));
            return;
        }
        if (!this.beamGroupNode.isApprove) {
            this.message.warn(this.l("this beamgroup has been unapproved."));
            return;
        }
        if (this.beamGroupNode.type.indexOf("BeamGroup") > -1) {
            this.BeamGroupApproveChangeClickEvent.emit(false);
        }
    }



    printClick(): void {
        let beamGroupId = this.getBeamGroupId();
        if (beamGroupId !== undefined) {
            const newWindow = window.open();
            this._beamGroupService.printBeamGroupReport(beamGroupId).subscribe(
                (result) => {
                    if (result === null || result === undefined) {
                        console.log("beamgroup printclick get data is null");
                        return;
                    }
                    console.log("beamgroup printclick send request start")
                    let print = new ReportPrint();
                    print.DisplayPrintPreview(result, newWindow);
                }
            )
        }
    }





    getBeamGroupId() : number {
        if (this.beamGroupNode === null || this.beamGroupNode === undefined) {
            return undefined;
        }
        if (this.beamGroupNode.type.indexOf("BeamGroup") > -1) {
            var beamGroupID = parseInt(this.beamGroupNode.id);
            return beamGroupID;
        }

        return undefined;
    }


}
