import { Component, OnInit, ViewChild, OnDestroy, Injector } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd';
import { ActivatedRoute } from '@angular/router';
import { BeamGroupServiceProxy, BeamServiceProxy,BeamGroupOutput, BeamGroupDto, PatientDto, PatientServiceProxy, PermissionServiceProxy, BeamDto } from '@shared/service-proxies/service-proxies';
import { ITreeState, TreeComponent, IActionMapping, TREE_ACTIONS, KEYS } from 'angular-tree-component';
import { TreeNode, ITreeOptions } from 'angular-tree-component/dist/defs/api';
import { CurrentModuleService } from '@shared/service-proxies/current-module.service';
import { RefreshTree } from '../beamparameter/beamactions/beamactions.component';
import { Subscription } from 'rxjs'
import { CurrentPatientService } from '@shared/service-proxies/current-patient.service';
import { AppComponentBase } from '@shared/app-component-base';
import { BeamGroupComponent, BeamGroupResult } from '../beamgroup/beamgroup.component';
import { BeamparameterComponent } from '../beamparameter/beamparameter.component';
import { PermissionType } from '@shared/Permission/PermissionType';
import { BeamActionCompletedService } from '../beamparameter/beamactions/beam-action-completed.service';


//自定义tree-root的action
const actionMapping: IActionMapping = {
  keys: {
    [KEYS.UP]: (tree, node, $event) => {
      TREE_ACTIONS.PREVIOUS_NODE(tree, node, $event);
      tree.getFocusedNode().setIsActive(true);
    },
    [KEYS.DOWN]: (tree, node, $event) => {
      TREE_ACTIONS.NEXT_NODE(tree, node, $event);
      tree.getFocusedNode().setIsActive(true);
    }
  }
};


@Component({
  selector: 'app-beamdefinition',
  templateUrl: './beamdefinition.component.html',
  styleUrls: ['./beamdefinition.component.less'],
})

export class BeamDefinitionComponent extends AppComponentBase implements OnInit, OnDestroy {
  
  beamGroupTreeList: TreeNode[] = [];//beamggroup树绑定的新数据
  beamGoupTreeDtoList: BeamGroupOutput[] = [];
  state: ITreeState;//控制beamgrouptree的状态：选中，收/缩等

  patientId: number;
  nodeid: string;
  dgId: number;
  selectedNode: TreeNode;//delete 和copy公用接口，需要区分是beam还是beamgroup，nodeid不足以区分
  isBeamSelected: boolean;
  isNodeSelected: boolean;//用来判断是否选中节点（为后面增删改查标志位）
  // isApproveStatus:boolean;//传递批准状态，通知beamgroup刷新

  canAddBeam:boolean = false;
  canDeleteBeam:boolean = false;
  canCopyBeam:boolean= false;
  subscription: Subscription;
  isEditPermission:boolean;
  isDeletePermission:boolean;

  options: ITreeOptions = { actionMapping, idField: 'key' }

  private _patientDto: PatientDto = null;

  @ViewChild('treeCom')
  private treeCom: TreeComponent;
  @ViewChild('beamGroup')
  private beamGroup: BeamGroupComponent;
  @ViewChild('beamComponent')
  private beamComponent: BeamparameterComponent;

  constructor(
    injector: Injector,
    private _activatedRouter: ActivatedRoute,
    private _beamGroupService: BeamGroupServiceProxy,
    private _beamService: BeamServiceProxy,
    private _currentModuleService: CurrentModuleService,
    private _currentPatientService: CurrentPatientService,
    private _patientService: PatientServiceProxy,
    private nzMessage: NzMessageService,
    private _permissionServiceProxy: PermissionServiceProxy,
    private _beamActionCompletedService:BeamActionCompletedService) {
    super(injector);
    abp.event.trigger('rvs.module.channged', this._activatedRouter);

    // 通过patientcard更新病人
    this.subscription = this._currentPatientService.getCurrentPatient().subscribe(patient => this.notifyPatientChanged(patient));
  }



  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.checkEditPermission();
    this.checkDeletePermission();
    this._currentModuleService.setCurrentModule("Beam Definition");
  }

  checkEditPermission(): void {
    this._permissionServiceProxy.isGranted(PermissionType.RVS_BeamDefinition_Editable).subscribe((ret: boolean) => {
      if (ret != null && ret !== undefined) {
        this.isEditPermission = ret;
      } else {
        this.isEditPermission = true;
      }
    })
  }

  checkDeletePermission(): void {
    this._permissionServiceProxy.isGranted(PermissionType.RVS_BeamDefinition_Delete).subscribe((ret: boolean) => {
      if (ret != null && ret !== undefined) {
        this.isDeletePermission = ret;
      } else {
        this.isDeletePermission = true;
      }
    })
  }
  
  getBeamGroupTreeInfo(patientId: number): void {
 
    try {
      if(patientId === null || patientId === undefined || Number.isNaN(patientId)){return}
      this._beamGroupService.getAllBeamGroupTreeByPatientId(patientId)
        .pipe()
        .subscribe((result: BeamGroupOutput[]) => {        
          if (result === null || result === undefined || result.length === 0) {
            this.nodeid = null;//如果beamGoupTreeDtoList为空，则通知相关的界面刷新，不然数据还保留是上一个beamgroup的数据
            this.beamGroupTreeList = [];
            return;
          }
          this.beamGoupTreeDtoList = result;
          var templist: TreeNode[] = [];
          for (let i = 0; i < this.beamGoupTreeDtoList.length; i++) {
            var beamGroup = this.beamGoupTreeDtoList[i];
            var groupNameForTree = this.nameLimitForTree(beamGroup.beamGroupName);
            var treeNode = {
              id: `${beamGroup.id}`,
              key:`${beamGroup.id}`+"G",//key 全球唯一
              name: groupNameForTree,
              type: "BeamGroup",
              isExpanded: true,
              isFocused: false,//如果不设为false，则会有多个选中项，会保留之前一项的选中状态
              isApprove: beamGroup.isApprove,  //ToDO,获取批准状态，用来控制已批准图标是否显示
              isGroupActived: beamGroup.isActive,
              // isCheck: beamGroup.isCheck,
              isCreateByTms: beamGroup.isCreateByTms,
              isMachineValid: beamGroup.isMachineValid,
              children: [],
            }
            if (beamGroup.beamList !== null && beamGroup.beamList !== undefined && beamGroup.beamList.length > 0) {
              for (let i = 0; i < beamGroup.beamList.length; i++) {
                var beam = beamGroup.beamList[i];
                var beamNameForTree=this.nameLimitForTree(beam.beamName);
                var nzTreeNodeChild = {
                  id: `${beam.id}`,
                  key:`${beam.id}`+"B",//key 全球唯一
                  name: beamNameForTree,
                  type: "Beam",
                  isFocused: false,
                }
                treeNode.children.push(nzTreeNodeChild);
              }
            }
            templist.push(treeNode);//界面不显示数据，所以先存放在templist
          }
          this.beamGroupTreeList = templist;
          if (this.beamGroupTreeList.length > 0) {
            if (this.nodeid === null || this.nodeid === undefined) {
              this.isBeamSelected = false;
              this.nodeid = this.beamGroupTreeList[0].id;
              const focusedNodeId = this.beamGroupTreeList[0].key;//设置默认选中项，并高亮显示
              this.state = {
                ...this.state,
                focusedNodeId
              };
              this.selectedNode = this.beamGroupTreeList[0];
              this.canAddBeam = true;
            }
          }
        })
    }
    catch (error) {
      console.log(error);
    }
  }

  //beamGroup点击事件
  onNodeActivateEvent(event: any) {
    if (event.node === null || event.node === undefined) { return; }
    if (event.node.data.type.indexOf("BeamGroup") > -1) {
      this.isBeamSelected = false;
      this.isNodeSelected = true;
      this.nodeid = event.node.data.id;
     
      this.selectedNode = event.node.data;

      //beam action permission
      this.canAddBeam = true;
      this.canDeleteBeam = false;
      this.canCopyBeam = false;

    } else {
      this.isBeamSelected = true;
      this.isNodeSelected = true;
      this.nodeid = event.node.data.id;//改变子组件的输入属性，并触发子组件的ngOnChanges钩子函数，进行初始化界面
      this.selectedNode = event.node.data;

      //beam action permission
      this.canAddBeam = true;
      this.canDeleteBeam = true;
      this.canCopyBeam = true;
    }

    this.dgId = this.GetDGId();//传给app-beamparameter组件
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
        this.beamGroupTreeList.forEach(beamGroup => {
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

  onAddedBeamGroup(newBeamGroupId: string): void {
    try {
      if (newBeamGroupId != null || newBeamGroupId != undefined) {
        this._beamGroupService.getBeamGroupInfoByIndex(parseInt(newBeamGroupId))
          .pipe()
          .subscribe((result: BeamGroupDto) => {
            var newbeamGroupDto = result;
            var groupNameForTree = this.nameLimitForTree(newbeamGroupDto.name);
            var treeNode = {
              id: `${newbeamGroupDto.id}`,
              key:`${newbeamGroupDto.id}`+"G",//key 全球唯一
              name: groupNameForTree,
              type: "BeamGroup",
              isApprove: newbeamGroupDto.isApproved,  //ToDO,获取批准状态，用来控制已批准图标是否显示
              isGroupActived: newbeamGroupDto.isActive,
              // isCheck: newbeamGroupDto.isCheck,
              isCreateByTms: newbeamGroupDto.isCreateByTms,
              isMachineValid: newbeamGroupDto.isMachineValide,
              children: [],
            };
            this.nodeid = newBeamGroupId;
            this.selectedNode = treeNode;
            this.beamGroupTreeList = [...this.beamGroupTreeList, treeNode];//// Just add node and replace nodes variable:
            const focusedNodeId = treeNode.key;//设置默认选中项，并高亮显示
            this.state = {
              ...this.state,
              focusedNodeId
            };
          })
        this.nzMessage.success(this.l("add beamgroup successfull!"));
      }
    }
    catch (error) {
      console.log(error)
    }
  }
  
  onEditBeamGroup(event:boolean):void{
   if(event){
    this.beamGroup.initBasicData(parseInt(this.nodeid));
    this._beamGroupService.getBeamGroupNameById(parseInt(this.nodeid))
        .pipe()
        .subscribe((name: string) => {
          if(name!=undefined && name!=null){
            //var tempTreeNode: TreeNode=null;
            var tempTreeNode=this.beamGroupTreeList.find(temp => temp.id==this.nodeid && temp.type=="BeamGroup");
            if(tempTreeNode !=undefined && tempTreeNode!=null){
              tempTreeNode.name=this.nameLimitForTree(name);
            }
            
          }
        })
    }
  }

  onEditOffset(event:boolean):void{
    if(event){
      this.beamGroup.updateOffset();
    }
  }
  onBeamGroupActiveChangeClickEventEvent(event: boolean): void {
    if (event === null || event === undefined) {
      return;
    }
    if (event) {
      this.beamGroup.activeBeamGroup();
    }
    if (!event) {
      this.beamGroup.unActiveBeamGroup();
    }
    // this.beamGroupTreeList.find(item => item.id === this.nodeid).isGroupActived = event;
  }

  onBeamGroupActiveChangeEvent(event: boolean) {
    this.beamGroupTreeList.find(item => item.id === this.nodeid).isGroupActived = event;
  }

  onBeamGroupApproveChangeClickEvent(event: boolean): void {
    if (event === null || event === undefined) {
      return;
    }
    if (event) {
      this.beamGroup.approveBeamGroup();
    }
    if (!event) {
      this.beamGroup.unapproveBeamGroup();     
    }
  }
  
  onBeamGroupApproveChangeEvent(event: BeamGroupResult): void {
    if (event === null || event === undefined) {
      return;
    }
    this.beamGroupTreeList.find(item => item.id === this.nodeid).isApprove = event.isApprove;//状态完成后通知树更新
    this.beamGroupTreeList.find(item => item.id === this.nodeid).isMachineValid = event.isMachineVliad;
  }

  onDelete(event: boolean): void {
    if (event) {
      var index = this.beamGroupTreeList.findIndex(item => item.id === this.nodeid);
      if (index > -1) {
        this.beamGroupTreeList.splice(index, 1);//通过id删除指定项
        this.treeCom.treeModel.update();//通知界面更新
        this.treeCom.treeModel.focusPreviousNode()
        this.nodeid = this.treeCom.treeModel.focusedNode.data.id;
        this.selectedNode=this.treeCom.treeModel.focusedNode.data;
        this.nzMessage.success(this.l("delete successfull"));
        this.isBeamSelected=false;
      }
    }
  }

  onCopy(event: any): void {
    if (event === null || event === undefined) {
      console.log("[onCopy]: event is null")
    }
    if (event.type.indexOf("BeamGroup") > -1) {
      //接口未返回正确的id
      this.nodeid = event.id;
      this.getBeamGroupTreeInfo(this.patientId);
    }
  }

  onEditBeam(event:boolean):void
  {
    if(event)
    {
      this.beamComponent.refreshBeamBasic(this.nodeid);
      this._beamService.getBeamNameByIndex(parseInt(this.nodeid))
          .pipe()
          .subscribe((name: string) => {
            var tempTreeNode=this.beamGroupTreeList.find(temp => temp.id==this.dgId && temp.type=="BeamGroup");
            if(tempTreeNode !=null && tempTreeNode.children!=null && tempTreeNode.children.length>0){
               var beamList=tempTreeNode.children;
               var beamNode=beamList.find(temp => temp.id==this.nodeid && temp.type=="Beam");
               if(beamNode!=null){
                beamNode.name=this.nameLimitForTree(name);
               }
            }
          })
    }
  }

  onEditBEV(event:boolean):void{
    if(event){
      this.beamComponent.updateBEV();
    }
  }

  onEditBeamImage(event:boolean):void
  {
    if(event)
    {
      this.beamComponent.updateBeamImage();
    }
  }

  onEditBeamGroupPositionImaging(event:boolean){

    if(event)
    {
      this.beamGroup.updatePositionImaging();
    }
  }

  onEditBeamGroupDeviceSequence(event:boolean){
    if(event)
    {
      this.beamGroup.updateDeviceSequence();
    }
  }

  AfterActionToRefreshTree(refreshTree:RefreshTree)
  {
    var expandbeamGroup:TreeNode;
    var beamGroups = [];
    this._beamGroupService.getAllBeamGroupTreeByPatientId(this.patientId)
    .subscribe(
      data => {
        if (data != null) {
          data.forEach(beamGroup => {
            if((refreshTree.dgid != null)&&(refreshTree.dgid == beamGroup.id))
            {
              var group: TreeNode = { name: this.nameLimitForTree(beamGroup.beamGroupName), id: beamGroup.id.toString(), type: "BeamGroup", isApprove: beamGroup.isApprove, isGroupActived: beamGroup.isActive,isCreateByTms: beamGroup.isCreateByTms, isMachineValid: beamGroup.isMachineValid, key: beamGroup.id.toString() + "G"};
              this.selectedNode = group;
            }
            else
            {
              var group: TreeNode = { name: this.nameLimitForTree(beamGroup.beamGroupName), id: beamGroup.id.toString(), type: "BeamGroup", isApprove: beamGroup.isApprove, isGroupActived: beamGroup.isActive, isCreateByTms: beamGroup.isCreateByTms, isMachineValid: beamGroup.isMachineValid, key: beamGroup.id.toString() + "G"};
            }
        
            group.children = [];
            beamGroup.beamList.forEach(element => {
              if((refreshTree.beamid!= null) &&(refreshTree.beamid == element.id))
              {
                var beam: TreeNode = { name: this.nameLimitForTree(element.beamName), id: element.id.toString(), type: "Beam",key:element.id.toString()+"B"}
                this.selectedNode = beam;
                expandbeamGroup = group;
                group.isExpanded=true;
              }
              else{
                var beam: TreeNode = { name: this.nameLimitForTree(element.beamName), id: element.id.toString(), type: "Beam",key:element.id.toString()+"B"}
              }
              group.children.push(beam);
            });
            beamGroups.push(group);
          });
        }
        this.beamGroupTreeList = beamGroups;
        this.state = {
          ...this.state,
          expandedNodeIds:{
            [expandbeamGroup.key]: true
          },
          focusedNodeId:this.selectedNode.key,
        }
        if(refreshTree.beamid != null)
        {
          this.isBeamSelected = true;
          this.nodeid = refreshTree.beamid.toString();
          this.dgId = this.GetDGId();
          expandbeamGroup.isExpanded=true;
        }
        else
        {
          this.isBeamSelected = false;
          this.nodeid = refreshTree.dgid.toString();
        }
        if(refreshTree.beamacAionType!=null)
        {
          switch (refreshTree.beamacAionType) {
            case "add"://Beam+
           this.nzMessage.success(this.l("add beam successfully"))
              break;
            case "delete"://Delete
            this.nzMessage.success(this.l("delete beam successfully!"))
            break;
            case "copy"://copy
            this.nzMessage.success(this.l("copy beam successfully!"))
              break;
          }
        }
        this._beamActionCompletedService.beamActionCompleted.emit();
        //刷新结束enable beam中所有的按钮
      },
    )
  }
  
  //基础汉字的unicode编码范围为4E00-9FA5,界面中的Tree长度(有bug未考虑中文末尾的处理 后续完善)
  nameLimitForTree(name:string)
  {
    if(name == null)
    {
      return;
    }
    var width = 0;
    for (let index = 0; index < name.length; index++) {
      if(19968<name.charCodeAt(index) && name.charCodeAt(index)<40869)
      {
        width = width+2;
      }
      else
      {
        width = width+1;
      }
      
      if(width > 15)
      {
        return name.substring(0,index)+"...";
      }
    }
    return name;
  }

  notifyPatientChanged(patient: PatientDto) {
    if (patient === null || patient === undefined) {
      return;
    }
    this._patientService.get(patient.id).subscribe(
      data => { this._patientDto = data },
      err => console.error(err),
      () => {
          if (this._currentPatientService.patientConsitencyCheck(this._patientDto) === false) {
              // clear ui data & error message
              this.nzMessage.error("[patientConsitencyCheck]: false!");
          }else {
            this.nodeid = null;
            this.selectedNode = null;
            this.patientId = this._patientDto.id;
            this.getBeamGroupTreeInfo(patient.id);//通过patientcard更新病人
          }
      }
    )
  }

}