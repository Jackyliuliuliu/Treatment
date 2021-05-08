import { Component, OnInit, Output, EventEmitter, Input, ViewChild, Injector } from '@angular/core';
import { BeamGroupServiceProxy, PermissionServiceProxy,BeamServiceProxy,} from '@shared/service-proxies/service-proxies';
import { FormBuilder } from '@angular/forms';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { RefreshTree } from '../beamparameter/beamactions/beamactions.component';
import { AppComponentBase } from '@shared/app-component-base';
import { PermissionType } from '@shared/Permission/PermissionType';

@Component({
    selector: 'app-beamboard',
    templateUrl: './beamboard.component.html',
    styleUrls: ['./beamboard.component.less'],
})
export class BeamBoardComponent extends AppComponentBase implements OnInit {

    public isVisible_addbeam = false;

    @Input()
    beamGroupList: TreeNode[];
    @Input()
    patientId: number;
    @Input()
    selectedNode: TreeNode;
    @Input()
    isEditPermission: boolean;
    @Input()
    isDeletePermission:boolean;

    @Output()
    public AfterActionToRefreshTree = new EventEmitter<RefreshTree>();
    @Output()
    public AddedBeamGroup = new EventEmitter<string>();//用于向beamdefinition组件发送添加成功消息
    @Output()
    public Delete = new EventEmitter<boolean>();//用于向beamdefinition组件发送删除成功消息
    @Output()
    public Copy = new EventEmitter<any>();//用于向beamdefinition组件发送拷贝成功消息
    @Output()
    public ChangeBeamGroupActiveStatusEvent = new EventEmitter<boolean>();//用于向beamdefinition组件发送激活beamgroup的成功消息


    form = this.fb.group({
        beamName: [null,],
        ssd:[null,],
        beamDescription: [null,],
     })

    constructor(private _beamGroupService: BeamGroupServiceProxy,
        private fb: FormBuilder,
        private _beamService: BeamServiceProxy,
        private _permissionServiceProxy: PermissionServiceProxy,
        injector: Injector,
    ) {
        super(injector);
    }

    ngOnInit() { }

    onAddedBeamGroup(beamGroupId: string): void {
        this.AddedBeamGroup.emit(beamGroupId);
    }

    onDeleteConfirm(result: boolean): void {
        var isOkOrCancel = result;
        if (isOkOrCancel) {
            this.onDelete();
        }
    }


    //删除入口
    onDelete(): void {
        console.log('Button ok clicked!');
        try {
            if (this.selectedNode.type.indexOf("BeamGroup") > -1) {
                var beamGroupID = parseInt(this.selectedNode.id);
                this._beamGroupService.deleteBeamGroup(beamGroupID)
                    .pipe()
                    .subscribe((result: boolean) => {
                        if (result) {
                            this.Delete.emit(result);
                        }
                        else {
                            this.message.info(this.l("delete failed"));
                        }
                    })
            }
        }
        catch (error) {
            console.log(error);
        }

    }

    exportClick():void{
        // this.message.info("on work...");
    }

    onAddBeamClick() {
        this.form = this.fb.group({
            beamName: [null,],
            ssd: [null,],
            beamDescription: [null,],
        })
        this.isVisible_addbeam = true;
    }

    AfterActionToRefreshTreeTransfer(refreshTree:RefreshTree)
    {
      this.AfterActionToRefreshTree.emit(refreshTree)
    }

}



