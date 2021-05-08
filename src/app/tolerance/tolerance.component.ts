import { Component, OnInit, OnDestroy, Injector,} from '@angular/core';
import { NzTreeNodeOptions, NzFormatEmitEvent, NzMonthPickerComponent, NzMessageService } from 'ng-zorro-antd';
import { ToleranceServiceProxy, ToleranceTreeDto, ToleranceDto, EnumServiceProxy,} from '@shared/service-proxies/service-proxies';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd';
import { isFulfilled } from 'q';
import { AppComponentBase } from '@shared/app-component-base';

/************************************ReadME*************************************/
/*编码以单用户操作会上锁为场景；如果场景是多用户同时操作tolerance列表，则设计就有问题，主要体现在add tolerance操作上
/************************************ReadME*************************************/

@Component({

  selector: 'app-tolerance',
  templateUrl: './tolerance.component.html',
  styleUrls: ['./tolerance.component.less']
})
export class ToleranceComponent extends AppComponentBase implements OnInit,OnDestroy{
  
  ngOnDestroy(): void {
      //这里有个bug:无法处理正在创建Tolerance时，切换其他的页面的提示！！！
      //先判断form的状态是否为pristine，然后如果需要保存，在保存阶段会去判断form的状态是否为valid
      if (this.form.dirty) {
        this.modalService.confirm({
          nzTitle: '保存当前页面的修改？',
          nzOnOk: () => {
            this.UpdateToleracne();
          },
        });
      }
  }

  nodes: NzTreeNodeOptions[] = [];  
  selectedTolerenceId: number;
  form: FormGroup;
  techniques:any = [];
  activedNode: any;
  IsAddingTolerance:boolean;
  ClickOtherNode:boolean;
  haveToleracne:boolean;

  constructor(
    private _toleranceService: ToleranceServiceProxy,
    private fb: FormBuilder,
    private enumService:EnumServiceProxy,
    private modalService: NzModalService,
    private messageTolerance: NzMessageService,
    injector: Injector ) {
    super(injector);
  }

  ngOnInit() {
    //校验需同步，this._toleranceService.getTolerance()
    this.form = this.fb.group({
      toleranceTableLabel: [null,[Validators.required,Validators.minLength(1),Validators.maxLength(64)]],
      technique: [null,[Validators.required,]],
      gantryAngle: [null,[Validators.required,this.onlyFloatCheck1,Validators.min(0),Validators.max(360)]],
      beamLimitingDeviceAngle: [null,[Validators.required,this.onlyFloatCheck1,Validators.min(0),Validators.max(2)]],
      patientSupportAngle: [null,[Validators.required,this.onlyFloatCheck1,Validators.min(0),Validators.max(180)]],
      tableVRT: [null,[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(100)]],
      tableLAT: [null,[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(100)]],
      tableLNG: [null,[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(100)]],
      beamLimitingDevicePosition_X: [null,[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
      beamLimitingDevicePosition_Y: [null,[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
      beamLimitingDevicePosition_ASYMX: [null,[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
      beamLimitingDevicePosition_ASYMY: [null,[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
      beamLimitingDevicePosition_MLCX: [null,[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
      beamLimitingDevicePosition_MLCY: [null,[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
    })

    this.enumService.getMap("TechniqueType").subscribe(
      data=>
      {
        for(let k in data)
        {
          this.techniques.push(
            {
              label:k,
              value:data[k],
            }
          )
        }
        this.RefreshTolerance(null);//在初始化，默认选中第一个id
      }
    )
  }

  ToleranceTreeNodeClick(event: NzFormatEmitEvent, data: string) {
    //Tolerance的添加操作是否正常进行？
    if (this.IsAddingTolerance) {
      this.modalService.confirm({
        nzTitle: '当前操作会终止容错表的添加，是否继续？',
        nzOnOk: () => {
          this.IsAddingTolerance = false;
          this.ToleranceTreeNodeClickAction(data);
          this.RefreshTolerance(this.selectedTolerenceId);
        },
        nzOnCancel: () => {
          //nothing
        },
      });
    }
    else {
      //先判断form的状态是否为pristine，然后如果需要保存，在保存阶段会去判断form的状态是否为valid
      if (this.form.dirty) {
        this.modalService.confirm({
          nzTitle: '保存当前页面的修改？',
          nzOnOk: () => {
            this.UpdateToleracne();
            this.ToleranceTreeNodeClickAction(data);
          },
          nzOnCancel: () => {
            this.ToleranceTreeNodeClickAction(data);
          },
        });
      }
      else {
        this.ToleranceTreeNodeClickAction(data);
      }
    }
  }

  ToleranceTreeNodeClickAction(data: string) {
    this.selectedTolerenceId = parseInt(data);
    this.GetToleranceInfoBinding();
    this.activedNode = data;
  }


  //用户点击增加按钮时，左侧列表会增加；右侧form中只有label会default填值，其他的都是null，都是invalid状态
  AddTolerance() {
    this.haveToleracne = true;

    if(this.IsAddingTolerance)
    {
      this.messageTolerance.warning("添加操作未完成");
      return;
    }

    //先判断form的状态是否为pristine，然后如果需要保存，在保存阶段会去判断form的状态是否为valid
    
    if (this.form.dirty) {
      this.modalService.confirm({
        nzTitle: '保存当前页面的修改?',
        nzOnOk: () => {
          this.UpdateToleracne();
          this.AddToleranceAction();
        },
        nzOnCancel: () => {
          this.AddToleranceAction();
        },
      });
    }
    else
    {
      this.AddToleranceAction();
    }
  }


  AddToleranceAction()
  {
    this.IsAddingTolerance = true;
    //左侧
    var nodeTemp = this.nodes;
    //由于后续，tolerance模块会加锁，即不会出现同时出现多用户同时在操作tolerance列表，所以名字的后缀就用前端数组长度进行计算，没问题
    var newToleranceName = "Tolerance"+(this.nodes.length+1).toString();
    nodeTemp.push({
      title: newToleranceName,
      key: "addTolerance",
    })
    this.activedNode = "addTolerance";
 
    this.form.controls.toleranceTableLabel.setValue(newToleranceName);
    this.form.controls.technique.setValue(this.techniques[0]);
    this.form.controls.gantryAngle.setValue(null);
    this.form.controls.beamLimitingDeviceAngle.setValue(null);
    this.form.controls.patientSupportAngle.setValue(null);
    this.form.controls.tableVRT.setValue(null);
    this.form.controls.tableLAT.setValue(null);
    this.form.controls.tableLNG.setValue(null);
    this.form.controls.beamLimitingDevicePosition_X.setValue(null);
    this.form.controls.beamLimitingDevicePosition_Y.setValue(null);
    this.form.controls.beamLimitingDevicePosition_ASYMX.setValue(null);
    this.form.controls.beamLimitingDevicePosition_ASYMY.setValue(null);
    this.form.controls.beamLimitingDevicePosition_MLCX.setValue(null);
    this.form.controls.beamLimitingDevicePosition_MLCY.setValue(null);

    this.form.markAsPristine();//用户体验,新增时,要将form状态字段重置
    this.form.markAsUntouched();

  }


  CopyTolerance() {
    this._toleranceService.copyTolerance(this.selectedTolerenceId).subscribe(
      data => {
        var tolerance: ToleranceDto = data;
        this.RefreshTolerance(tolerance.id);
      }
    )
  }

  DeleteTolerance() {
    this.modalService.confirm({
      nzTitle: '删除当前容错？',
      nzOnOk: () => {
        this.DeleteToleranceAction();
      },
      nzOnCancel: () => {
      },
    });
  }

  DeleteToleranceAction()
  {
    this._toleranceService.deleteTolerance(this.selectedTolerenceId).subscribe(
      data => {
        if(!data)
        {
          this.messageTolerance.warning("无法删除正在使用的容错!");
          return;
        }
        if (this.GetPreToleranceID() == -1) {
            this.RefreshTolerance(null);
        }
        else {
          //删除Tree的非第一个node
          this.RefreshTolerance(this.GetPreToleranceID());
        }
      }
    )
  }

  UpdateToleracne() {
    if(!this.form.valid)
    {
      this.messageTolerance.warning("保存失败，请检查！");
      return;
    }
    var Tolerance: ToleranceDto = new ToleranceDto();
    Tolerance.toleranceTableLabel = this.form.controls.toleranceTableLabel.value;
    Tolerance.technique = this.form.controls.technique.value.value;

    Tolerance.gantryAngle = this.form.controls.gantryAngle.value;
    Tolerance.beamLimitingDeviceAngle = this.form.controls.beamLimitingDeviceAngle.value;
    Tolerance.patientSupportAngle = this.form.controls.patientSupportAngle.value;

    Tolerance.tableVRT = this.form.controls.tableVRT.value;
    Tolerance.tableLAT = this.form.controls.tableLAT.value;
    Tolerance.tableLNG = this.form.controls.tableLNG.value;
    
    Tolerance.beamLimitingDevicePosition_X = this.form.controls.beamLimitingDevicePosition_X.value;
    Tolerance.beamLimitingDevicePosition_Y = this.form.controls.beamLimitingDevicePosition_Y.value;
    Tolerance.beamLimitingDevicePosition_ASYMX = this.form.controls.beamLimitingDevicePosition_ASYMX.value;
    Tolerance.beamLimitingDevicePosition_ASYMY = this.form.controls.beamLimitingDevicePosition_ASYMY.value;
    Tolerance.beamLimitingDevicePosition_MLCX = this.form.controls.beamLimitingDevicePosition_MLCX.value;
    Tolerance.beamLimitingDevicePosition_MLCY = this.form.controls.beamLimitingDevicePosition_MLCY.value;

 
    if(this.IsAddingTolerance)
    {
      this._toleranceService.createTolerance(Tolerance).subscribe(
      (data:ToleranceDto) => {
        if(data== null)
        {
          this.messageTolerance.warning("保存失败！");
          this.RefreshTolerance(this.selectedTolerenceId);//selectedTolerenceId是新添加toleran上一个节点的id
          this.IsAddingTolerance = false;
        }
        else{
          this.messageTolerance.info("添加成功！");
          this.RefreshTolerance(data.id);
          this.IsAddingTolerance = false;
        }
      }
    )
    }
    else
    {
      Tolerance.id = this.selectedTolerenceId;
      this._toleranceService.updateTolerance(Tolerance).subscribe(
        data=>{
          if(data)
          {
            this.message.info("保存成功！");
            this.RefreshTolerance(this.selectedTolerenceId);
            //this.form.markAsPristine();//标记form表单状态为pristine
          }
        }
      )
    }
  }

  GetPreToleranceID(): number {
    var preid = -1;
    try {
      this.nodes.forEach(node => {
        try {
          if (parseInt(node.key) != this.selectedTolerenceId) {
            preid = parseInt(node.key);
          }
          else {
            throw new Error('get preid');
          }
        } catch (e) {
          throw new Error('get preid');
        }
      });
    } catch (error) {
    }
    return preid;
  }

  RefreshTolerance(id: number) {
    this._toleranceService.getToleranceTree().subscribe(
      data => {
        var toleranceTree: ToleranceTreeDto[] = data;

        var nodeTemp: NzTreeNodeOptions[] = [];
        if (id == null) //Tree的第一个节点被选中
        {
          if(toleranceTree.length == 0)
          {
            this.nodes = [];
            this.haveToleracne = false;
            return;
          }
          this.haveToleracne = true;
          toleranceTree.forEach(
            tolerancenode => {
              nodeTemp.push({
                title: tolerancenode.toleranceTableLabel,
                key: tolerancenode.id.toString(),
              })
              this.activedNode  = nodeTemp[0].key;
              this.selectedTolerenceId = parseInt(nodeTemp[0].key);
            }
          )
        }
        else//Tree的指定id被选中
        {
          toleranceTree.forEach(
            tolerancenode => {
                nodeTemp.push({
                  title: tolerancenode.toleranceTableLabel,
                  key: tolerancenode.id.toString(),
                })
              }
          )
          this.activedNode = id.toString();
          this.selectedTolerenceId = id;
        }

        this.nodes = nodeTemp;
        //绑定更新
        this.GetToleranceInfoBinding()
      }
    )
  }

  GetToleranceInfoBinding() {
    this._toleranceService.getTolerance(this.selectedTolerenceId).subscribe(
      data => {
        var tolerance: ToleranceDto = data;
        this.form = this.fb.group({
          toleranceTableLabel: [tolerance.toleranceTableLabel,[Validators.required,Validators.minLength(1),Validators.maxLength(64)]],
          technique: [this.techniques[tolerance.technique],[Validators.required,]],
          gantryAngle: [tolerance.gantryAngle.toFixed(1),[Validators.required,this.onlyFloatCheck1,Validators.min(0),Validators.max(360)]],
          beamLimitingDeviceAngle: [tolerance.beamLimitingDeviceAngle.toFixed(1),[Validators.required,this.onlyFloatCheck1,Validators.min(0),Validators.max(2)]],
          patientSupportAngle: [tolerance.patientSupportAngle.toFixed(1),[Validators.required,this.onlyFloatCheck1,Validators.min(0),Validators.max(180)]],
          tableVRT: [tolerance.tableVRT.toFixed(2),[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(100)]],
          tableLAT: [tolerance.tableLAT.toFixed(2),[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(100)]],
          tableLNG: [tolerance.tableLNG.toFixed(2),[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(100)]],
          beamLimitingDevicePosition_X: [tolerance.beamLimitingDevicePosition_X.toFixed(2),[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
          beamLimitingDevicePosition_Y: [tolerance.beamLimitingDevicePosition_Y.toFixed(2),[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
          beamLimitingDevicePosition_ASYMX: [tolerance.beamLimitingDevicePosition_ASYMX.toFixed(2),[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
          beamLimitingDevicePosition_ASYMY: [tolerance.beamLimitingDevicePosition_ASYMY.toFixed(2),[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
          beamLimitingDevicePosition_MLCX: [tolerance.beamLimitingDevicePosition_MLCX.toFixed(2),[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
          beamLimitingDevicePosition_MLCY: [tolerance.beamLimitingDevicePosition_MLCY.toFixed(2),[Validators.required,this.onlyFloatCheck2,Validators.min(0),Validators.max(0.1)]],
        })
      }
    )
  }

 dropdownChange(visibale: boolean, i: string) {
    //Tolerance的添加操作是否正常进行？
    if (this.IsAddingTolerance) {
      if(i == "addTolerance")//当用户正在add时，点击了正在创建的tolerance时，需要进行的判断
      {
        this.messageTolerance.warning("添加操作未完成");
        this.ClickOtherNode = false;
        return;
      }
      else//当用户正在add时，点击了别的tolerance时，需要进行的判断，
      {
        this.messageTolerance.warning("添加操作未完成");
        this.ClickOtherNode = true;
        return;
      }
    }
    else {
      //先判断form的状态是否为pristine，然后如果需要保存，在保存阶段会去判断form的状态是否为valid，
      //这部分后续处理...
      if (visibale === true) {
        this.activedNode = i;
        this.selectedTolerenceId = parseInt(i);
        this.GetToleranceInfoBinding();
      } else if (visibale === false) {
        // this.activedNode = undefined;
      }
    }
  }

  test(any:any)
  {
    console.log(any.target.attributes);
  }
  
 //常用的正则表达式： https://c.runoob.com/front-end/854




    //自定义验证器，0.1精度 
    onlyFloatCheck1(control: FormControl): any {
      var myreg = /^\d+(\.\d{1})?$/;
      var valid = myreg.test(control.value);
      return valid ? null : { onlyFloat: true };
    }
  
     //自定义验证器，0.01精度 
     onlyFloatCheck2(control: FormControl): any {
      var myreg = /^\d+(\.\d{1,2})?$/;
      var valid = myreg.test(control.value);
      return valid ? null : { onlyFloat: true };
    }


    AddingTolerance()
    {
      this.messageTolerance.warning("添加操作未完成");
    }

    AddingToleranceToDelete()
    {
    if(!this.ClickOtherNode)//如果点击的是本节点
    {
      //获取删除后需要停留的节点id,即上一个节点
      if(this.nodes.length == 1)
      {
        this.RefreshTolerance(null);
      }
      else
      {
        var id = parseInt(this.nodes[this.nodes.length - 2].key);
        this.RefreshTolerance(id);//当添加操作未完成就直接删除时
      }
      this.IsAddingTolerance = false;
    }
    else//如果点击的不是本节点
    {
      this.messageTolerance.warning("添加操作未完成");
    }
    }


  CopyClick() {
    if (this.IsAddingTolerance) {
      this.AddingTolerance();
    }
    else {
      this.CopyTolerance()
    }
  }


  DeleteClick()
  {
    if (this.IsAddingTolerance) {
      this.AddingToleranceToDelete();
    }
    else {
      this.DeleteTolerance();
    }
  }

}


