import { Component, OnInit, Injector, Output, EventEmitter, Input } from '@angular/core';
import { NzModalService, NzMessageService } from 'ng-zorro-antd';
import { ConfirmWindowComponent } from '../confirmwindow/confirmwindow.component';
import { UserConfrimComponent } from '../userconfirm/userconfirm.component';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { AppComponentBase } from '@shared/app-component-base';
import { BeamsTreatmentRecordServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-deletebeamgroup',
    templateUrl: './deletebeamgroup.component.html',
    styleUrls: ['./deletebeamgroup.component.less'],
})


export class DeleteBeamGroupComponent extends AppComponentBase implements OnInit {
    @Input()
    selectNode: TreeNode;
    @Input()
    isDeletePermission: boolean;

    @Output()
    confirmaction = new EventEmitter<boolean>();
    
    constructor(
        injector: Injector,
        private _modalService: NzModalService,
        private _treatmentRecordService: BeamsTreatmentRecordServiceProxy) {
        super(injector);
    }

    ngOnInit() {
    }

    deleteClick(): void {
        if (!this.isDeletePermission) { 
            this.message.warn("没有权限");
            return; 
        }
        let modal = this._modalService.create({
            nzContent: ConfirmWindowComponent,
            nzMaskClosable: false,
            nzFooter: null,
            nzClosable: false,
            nzWidth: 0,
        });

        modal.afterClose.subscribe((result: boolean) => {
            if (result == true) {
                if (this.selectNode === null || this.selectNode === undefined || this.selectNode.id === null || this.selectNode.id === undefined) {
                    return;
                }
                if (this.selectNode.isApprove) {
                    this.message.warn(this.l("Approved beamGroup can not delete"));
                    return;
                }
                if (!this.selectNode.isCreateByTms) {
                    this.message.warn(this.l("Only beamGroup created by TMS are allowed to delete."));
                    return;
                }
                this._treatmentRecordService.isBeamGroupHasRecord(this.selectNode.id)
                    .pipe()
                    .subscribe((result: Boolean) => {
                        if (result) {
                            this.message.warn(this.l("this beamgroup has treatment records, can not be allowed to delete."));
                            return;
                        }
                        let userConfirmModal = this._modalService.create(
                            {
                                nzContent: UserConfrimComponent,
                                nzMaskClosable: false,
                                nzFooter: null,
                                nzClosable: false,
                                nzWidth: 0,
                            }
                        );
                        userConfirmModal.afterClose.subscribe((data: any) => {
                            if (data === null || data === undefined) { return; }
                            this.confirmaction.emit(data.isAvailable);
                        })
                    })
            }
        })
    }

}
