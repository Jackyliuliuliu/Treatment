import { Component, OnInit, Input, Output, EventEmitter, Injector, OnChanges } from '@angular/core';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { BeamServiceProxy, AddBeamDto, BeamGroupDto, BeamGroupServiceProxy, PermissionServiceProxy } from '@shared/service-proxies/service-proxies';
import { NzMessageService } from 'ng-zorro-antd';
import { RefreshTree } from '../beamactions.component';
import { BeamActionServiceService } from '../beam-action-service.service';
import { AppComponentBase } from '@shared/app-component-base';
import { BeamActionCompletedService } from '../beam-action-completed.service';
import { PermissionType } from '@shared/Permission/PermissionType';
import { checkBackslash ,NumericalPrecisionOne} from '@shared/validator/formControlValidators';

@Component({
  selector: 'app-addbeam',
  templateUrl: './addbeam.component.html',
  styleUrls: ['./addbeam.component.less']
})
export class AddbeamComponent extends AppComponentBase implements OnInit, OnChanges{
  
  @Input()
  beamGroupList: TreeNode[];

  @Input()
  selectedNode:TreeNode;

  @Input()
  isEditPermission: boolean;
  
  
  @Output()
  public AfterActionToRefreshTree = new EventEmitter<RefreshTree>();

  isVisible_addbeam: boolean;
  isDisable_addbeam: boolean;
  beamGroupId:number;

  form = this.fb.group({
    beamName: [null,],
    ssd: [null,],
    beamDescription: [null,],
  })

  constructor(private fb: FormBuilder,
    private _beamService: BeamServiceProxy,
    private _message: NzMessageService,
    private _beamGroupService: BeamGroupServiceProxy,
    private beamActionServiceService: BeamActionServiceService,
    private _permissionServiceProxy: PermissionServiceProxy,
    private _beamActionCompletedService:BeamActionCompletedService,
    injector:Injector) {
    super(injector);
   
  }

  ngOnInit() {
    this.isVisible_addbeam = false;
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
      || this.beamGroupList == null 
      || this.selectedNode == null
      || this.beamGroupList.length == 0)
    {
      this.isDisable_addbeam = true;
    }
    else
    {
      this.isDisable_addbeam = false;
    }
  }

  onAddBeamClick() {
    //TODO 批准状态的获取后续看能否从组件中传递过来
    this.beamGroupId=this.GetDGId();
    this._beamGroupService.getBeamGroupInfoByIndex(this.beamGroupId).subscribe(
      (data: BeamGroupDto) => {
        if (data.isApproved) {
          this.message.warn(this.l('The approval status prohibits adding the beam!'));
          return;
        }
        if(!data.isCreateByTms)
        {
          this.message.warn(this.l('Only the group created by TMS system can add beam!'));
          return;
        }
        if(!data.isActive){
          this.message.warn("停用的射野组不能创建射野");
          return;
        }
        var defaultName = this.GetDefaultBeanName();
        this.form = this.fb.group({
          beamName: [defaultName, [Validators.required, Validators.maxLength(64), Validators.minLength(1),checkBackslash]],
          ssd: [null, [Validators.required, Validators.min(50), Validators.max(150), NumericalPrecisionOne]],
          beamDescription: [null, [Validators.maxLength(64), checkBackslash]],
        })
        this.isVisible_addbeam = true;
        
      }
    )
  }

  AddbeamhandleCancel() {
    this.isVisible_addbeam = false;
  }


  AddbeamhandleOk() {

    if(this.IsDuplicateName())
    {
      this._message.warning(this.l('The name of the beam is repeated!'));
      return ;
    }
    this._beamActionCompletedService.beamActionStart.emit();
    var addBeamDto: AddBeamDto = new AddBeamDto()
    addBeamDto.beamName = this.form.controls.beamName.value;
    addBeamDto.ssd = this.form.controls.ssd.value;
    addBeamDto.beamDescription = this.form.controls.beamDescription.value;
    addBeamDto.beamGroupId = this.beamGroupId;
    this._beamService.createBeam(addBeamDto).subscribe(
      data => {
        if(data == null)
        {

          this.message.error(this.l('Failed to create beam!'));
        }
        else
        {
          this.beamActionServiceService.AddBeamLoading.emit(null);
          this.isVisible_addbeam = false;
          //传给bd.ts data.id
          var refreshTree = new RefreshTree();
          refreshTree.beamid = data.id;
          refreshTree.dgid = this.beamGroupId;
          refreshTree.beamacAionType = "add";
          this.AfterActionToRefreshTree.emit(refreshTree);
        }
      }
    )
  }

 
  BeamActionStart()
  {
    this.isDisable_addbeam = true;
  }

  BeamActionCompleted()
  {
    this.isDisable_addbeam = false;
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
    return ret;
  }

}
