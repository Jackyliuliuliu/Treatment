import { Component, OnInit, Input, Output, EventEmitter, Injector, OnChanges } from '@angular/core';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { FormBuilder, Validators } from '@angular/forms';
import { BeamServiceProxy, BeamGroupServiceProxy, BeamGroupDto, UserIdentityServiceProxy, UserIdentityInput, PermissionServiceProxy } from '@shared/service-proxies/service-proxies';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { RefreshTree } from '../beamactions.component';
import { UserConfrimComponent } from '@app/main/userconfirm/userconfirm.component';
import { BeamActionServiceService } from '../beam-action-service.service';
import { AppComponentBase } from '@shared/app-component-base';
import { PermissionType } from '@shared/Permission/PermissionType';
import { BeamActionCompletedService } from '../beam-action-completed.service';

@Component({
  selector: 'app-deletebeam',
  templateUrl: './deletebeam.component.html',
  styleUrls: ['./deletebeam.component.less']
})
export class DeletebeamComponent extends AppComponentBase implements OnInit,OnChanges {


  constructor(private fb: FormBuilder,
    private _beamService: BeamServiceProxy,
    private _message: NzMessageService,
    private _beamGroupService: BeamGroupServiceProxy,
    private _modalService: NzModalService,
    private beamActionServiceService: BeamActionServiceService,
    private modalService: NzModalService,
    private userIdentityServiceProxy:UserIdentityServiceProxy,
    private _permissionServiceProxy: PermissionServiceProxy,
    private _beamActionCompletedService:BeamActionCompletedService,
    injector:Injector ){
    super(injector);
    
  }

  ngOnInit() {
    this._beamActionCompletedService.beamActionStart.subscribe(
      data => {
        this.BeamActionStart();
      }
    );

    this._beamActionCompletedService.beamActionCompleted.subscribe(
      data => {
        this.BeamActionCompleted();
      }
    );
  }

  @Input()
  beamGroupList: TreeNode[];

  @Input()
  selectedNode:TreeNode;
  
  @Output()
  public AfterActionToRefreshTree = new EventEmitter<RefreshTree>();

  @Input()
  isDeletePermission: boolean;

  beamGroupId:number;
  isVisible_deletebeam: boolean;
  isDisable_addbeam: boolean;
  isUserAvailable = true;

  
  form = this.fb.group({
    userName: [null,[Validators.required]],
    password: [null,[Validators.required]],
  })


  DeletebeamhandleCancel() {
    this.isVisible_deletebeam = false;
  }

  

  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
  
    if(!this.isDeletePermission
      ||this.beamGroupList == null 
      ||this.selectedNode == null
      || this.beamGroupList.length == 0)
    {
      this.isDisable_addbeam = true;
    }
    else
    {
      this.isDisable_addbeam = false;
    }
  }


  onDeleteBeamClick() {
    this.beamGroupId=this.GetDGId();
    this._beamGroupService.getBeamGroupInfoByIndex(this.beamGroupId).subscribe(
      (data: BeamGroupDto) => {
        if (data.isApproved) {
          this._message.warning(this.l('The approval status prohibits deleting the beam!'));
          return;
        }
        
        if (!data.isCreateByTms) {
          this.message.warn(this.l('Only the group created by TMS system can delete beam!'));
          return;
        }

        this.modalService.confirm({
          nzTitle: this.l("Are you sure to delete the beam?"),
          nzOnOk: () => {
            this.isVisible_deletebeam = true;
          },
        });
      }
    )

  }

  DeletebeamhandleOk()
  {
    var input = new UserIdentityInput();
    input.userName = this.form.controls.userName.value;
    input.password = this.form.controls.password.value;

    this.userIdentityServiceProxy.isUserAvailable(input).subscribe(
      data => 
      {
        if(data)
        {
          this.DeleteBeam();
        }
        else
        {
          this.isUserAvailable = false;
        }
      }
    )

  }


  DeleteBeam(): void {
    this._beamActionCompletedService.beamActionStart.emit();
    this.beamActionServiceService.DeleteBeamLoading.emit(null);
    this._beamService.deleteBeam(parseInt(this.selectedNode.id)).subscribe(
      data => {
        if (data) {
          this.isVisible_deletebeam = false;
          //删除之前需要记录，删除的beam之前的beamid，如果没有则是Groupid，确定需要选中哪一个
          var beamsCount = this.GetCountBeamsInDG(this.beamGroupId);
          if (beamsCount == -1) {
            this._message.error("error!");
          }
          else if (beamsCount == 1) {
            var refreshTree = new RefreshTree()
            refreshTree.beamid = null;
            refreshTree.dgid = this.GetDGId();
            refreshTree.beamacAionType = "delete"
            this.AfterActionToRefreshTree.emit(refreshTree);
          }
          else {
            //找到上一个beamid
            if (this.GetPreBeamID() == -1) {
              var refreshTree = new RefreshTree()
              refreshTree.beamid = null;
              refreshTree.dgid = this.GetDGId();
              refreshTree.beamacAionType = "delete"
              this.AfterActionToRefreshTree.emit(refreshTree);
            }
            else {
              var refreshTree = new RefreshTree()
              refreshTree.beamid = this.GetPreBeamID();
              refreshTree.dgid = null;
              refreshTree.beamacAionType = "delete"
              this.AfterActionToRefreshTree.emit(refreshTree);
            }
          }
        }
        else {
          this.message.warn("删除失败！")
        }
      },
    )
  }



  GetDGId(): number {
    var DGid: number;
    //根据唯一的主键id寻找beamgroup
    if (this.selectedNode.type.indexOf("BeamGroup") > -1)//这里trycatch只是为了跳出foreach，提高效率
    {
      DGid = parseInt(this.selectedNode.id);
    }
    else {
      try {
        this.beamGroupList.forEach(beamGroup => {
          try {
            beamGroup.children.forEach(beam => {
              if (beam.id == this.selectedNode.id) {
                DGid = parseInt(beamGroup.id);
                throw new Error('beamGroupid');
              }
            })
          } catch (e) {
            throw new Error('beamGroupid');
          }
        });
      } catch (error) {
      }
    }
    return DGid;
  }

  GetPreBeamID(): number {
    var preid = -1;
    try {
      this.beamGroupList.forEach(beamGroup => {
        try {
          beamGroup.children.forEach(beam => {
            if (beam.id != this.selectedNode.id) {
              preid = parseInt(beam.id);
            }
            else {
              throw new Error('get preid');
            }
          })
        } catch (e) {
          throw new Error('get preid');
        }
      });
    } catch (error) {
    }
    return preid;
  }


  GetCountBeamsInDG(dgid: number): number {
    var beamsCount = -1;
    try {
      this.beamGroupList.forEach(beamGroup => {
        if (dgid.toString() == beamGroup.id) {
          beamsCount = beamGroup.children.length;
          throw new Error('get beamsCount successfully');
        }
      });
    } catch (error) {
      return beamsCount;
    }
  }

  BeamActionStart()
  {
    this.isDisable_addbeam = true;
  }

  BeamActionCompleted()
  {
    this.isDisable_addbeam = false;
  }

}
