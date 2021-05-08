import { Component, OnInit, Input, Injector } from '@angular/core';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { BeamGroupServiceProxy} from '@shared/service-proxies/service-proxies';
import { NzModalService, NzMessageService } from 'ng-zorro-antd';
import { TreatmentScheduleSettingComponent } from '@app/treatment-schedule/treatment-schedule-setting/treatment-schedule-setting.component';
import { AppComponentBase } from '@shared/app-component-base';



@Component({
    selector: 'app-createtreatmentsession',
    templateUrl: './createtreatmentsession.component.html',
    styleUrls: ['./createtreatmentsession.component.less'],
})

export class CreateTreatmentSessionComponent extends AppComponentBase implements OnInit {
    @Input() 
    selectNode: TreeNode; 
    @Input()
    isEditPermission: boolean;

    constructor(
        injector: Injector,
        private _beamGroupService: BeamGroupServiceProxy,
        private _nzModalService: NzModalService,
        private nzmessage: NzMessageService) {
        super(injector);
    }

    ngOnInit() {
    }

    CreateSessionClicked() {
        if (!this.isEditPermission) {
            this.nzmessage.warning("没有权限") ;
            return; 
        }
        if (this.selectNode === null || this.selectNode === undefined) {
            console.log("[CreateSessionClicked]:selectNode is null or undefined");
            return;
        }
        let beamgroupId = parseInt(this.selectNode.id);
        if (beamgroupId === null || beamgroupId === undefined) {
            console.log("[CreateSessionClicked]:beamgroupId is null or undefined");
            return;
        }
        if (!this.selectNode.isApprove) {
            this.nzmessage.warning(this.l("Please approve beam group at first."));
            return;
        }
        if (!this.selectNode.isGroupActived) {
            this.nzmessage.warning(this.l("Please actve beam group at first."));
            return;
        }
        this._beamGroupService.getFractionNumberByBeamgroup(beamgroupId).subscribe(
            (ret) => {
                console.log(beamgroupId);
                let fractionNumber = ret;
                this._nzModalService.create({
                    nzContent: TreatmentScheduleSettingComponent,
                    nzMaskClosable: false,
                    nzComponentParams: {
                         beamgroupId: beamgroupId,
                         treatmentCure: fractionNumber,
                         moduleName:  "BeamDefinition"},
                    nzFooter: null,
                    nzWidth: 1000,
                    nzWrapClassName:"vertical-center-modal background-dose-modal",
                    nzVisible:true,
                    nzTitle:this.l("Create treatment schedule")
                });

            }
        )
    }
}