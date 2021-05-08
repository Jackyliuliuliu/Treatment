import { Component, OnInit, Input, Output, EventEmitter, Injector, OnChanges } from '@angular/core';
import { BeamOutput, BeamServiceProxy, CopyBeamDto, BeamGroupServiceProxy, BeamGroupDto, PermissionServiceProxy } from '@shared/service-proxies/service-proxies';
import { NzMessageService } from 'ng-zorro-antd';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { RefreshTree } from '../beamactions.component';
import { Validators, FormBuilder, FormControl } from '@angular/forms';
import { BeamActionServiceService } from '../beam-action-service.service';
import { AppComponentBase } from '@shared/app-component-base';
import { PermissionType } from '@shared/Permission/PermissionType';
import { BeamActionCompletedService } from '../beam-action-completed.service';
import { checkBackslash} from '@shared/validator/formControlValidators';

@Component({
  selector: 'app-copybeam',
  templateUrl: './copybeam.component.html',
  styleUrls: ['./copybeam.component.less']
})
export class CopybeamComponent extends AppComponentBase implements OnInit ,OnChanges{
  
  isDisable_addbeam: boolean;
  isVisible_copybeam:boolean;

  form = this.fb.group({
    beamName: [null,[Validators.required , Validators.maxLength(64) , Validators.minLength(1) ]],
  })
  
  @Input()
  beamGroupList: TreeNode[];

  @Input()
  selectedNode:TreeNode;
  
  @Output()
  public AfterActionToRefreshTree = new EventEmitter<RefreshTree>();

  @Output()
  public CopyBeamLoading = new EventEmitter<null>();

  @Input()
  isEditPermission: boolean;

  beamGroupId:number;

  constructor(  
    private beamService: BeamServiceProxy,
    private fb: FormBuilder,
    private _message: NzMessageService,
    private _beamGroupService: BeamGroupServiceProxy,
    private beamActionServiceService: BeamActionServiceService,
    private _permissionServiceProxy: PermissionServiceProxy,
    private _beamActionCompletedService:BeamActionCompletedService,
    injector:Injector) {
        super(injector);
       
    }
  ngOnInit() {
    this.isVisible_copybeam = false;
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



  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
   
    if(!this.isEditPermission
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

  CopyBeamClick()
  {
    this.beamGroupId=this.GetDGId();
    //TODO 批准状态的获取后续看能否从组件中传递过来，不浪费资源
    this._beamGroupService.getBeamGroupInfoByIndex(this.beamGroupId).subscribe(
      (data: BeamGroupDto) => {
        if (data.isApproved) {
          this.message.warn("批准状态禁止复制!");
          return;
        }
        if(!data.isCreateByTms)
        {
          this.message.warn("只有TMS系统创建的射野可以复制!");
          return;
        }
        var defaultName = this.GetDefaultBeanName();
        this.form = this.fb.group({
          beamName: [defaultName,[Validators.maxLength(64),Validators.minLength(1),Validators.required , checkBackslash ]],
        })
        this.isVisible_copybeam = true;
      }
    )
  }

  CopybeamhandleCancel()
  {
    this.isVisible_copybeam = false;
  }

  CopybeamhandleOk()
  {
    if(this.IsDuplicateName())
    {
      this._message.warning("the beamname is duplicate");
      return ;
    }
    this._beamActionCompletedService.beamActionStart.emit();
    var input = new CopyBeamDto();
    input.copyBeamId = parseInt(this.selectedNode.id);
    input.beamName = this.form.controls.beamName.value;
    this.isVisible_copybeam = false;
    this.beamActionServiceService.CopyBeamLoading.emit(null);
    this.beamService.copyBeam(input).subscribe(
      (data:BeamOutput)=>{

        if(data== null)
        {
          this.message.error("复制射野失败!");
        }
        else
        {
          var refreshTree = new RefreshTree();
          refreshTree.beamid =data.id;
          refreshTree.dgid = this.beamGroupId;
          refreshTree.beamacAionType = "copy"
          this.AfterActionToRefreshTree.emit(refreshTree);
        }
      }
    ) 
  }

  GetDefaultBeanName():string
  {
    var length;
    try {
      this.beamGroupList.forEach(beamGroup => {
        if(beamGroup.id == this.beamGroupId)
        {
          length = beamGroup.children.length+1;
          throw new Error('find currentBeamGroup');//这里trycatch只是为了跳出foreach
        }
      });
    } catch (error) {}
    return "TB"+length;
  }


  GetDGId(): number {
    var DGid: number;
    //根据唯一的主键id寻找beamgroup
    if (this.selectedNode.type.indexOf("BeamGroup") > -1)//这里trycatch只是为了跳出foreach
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


  IsDuplicateName():boolean
  {
    var ret = false;
    var beams:TreeNode[] = [];
    try {
      this.beamGroupList.forEach(beamGroup => {
        if(beamGroup.id == this.beamGroupId)
        {
          beams = beamGroup.children;
          throw new Error('find children');//这里trycatch只是为了跳出foreach
        }
      });
    } catch (error) {}
    try {
      beams.forEach(beam =>
        {
          if(beam.name == this.form.controls.beamName.value)
          {
            ret = true;
            throw new Error('find duplicateName');//这里trycatch只是为了跳出foreach
          }
        })
    } catch (error) {}
    return ret
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
