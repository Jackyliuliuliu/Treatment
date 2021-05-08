import { Component, OnInit,Injector,ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { BeamDto, BeamServiceProxy, ControlPointDto } from '@shared/service-proxies/service-proxies';
import { NzMessageService} from 'ng-zorro-antd';
import {MlcComponent} from'@app/main/mlc/mlc.component';
import { AppComponentBase } from '@shared/app-component-base';
import { ControlPointInfo } from '@app/main/beamparameter/beamparameter.component';
import { TreeNode } from 'angular-tree-component/dist/defs/api';

@Component({
  selector: 'app-editbev',
  templateUrl: './editbev.component.html',
  styleUrls: ['./editbev.component.css']
})
export class EditbevComponent extends AppComponentBase  implements OnInit {

  @Input()
  isEditPermission:boolean;
  @Input()
  beamId:string;
  @Input()
  beamGroupList: TreeNode[];
  @Input()
  beamGroupID:number;
  @ViewChild('mlcShape')
  private _mlcCommponent: MlcComponent;

  @Output()
  public editBEVConfirm=new EventEmitter<boolean>();
  //BEV
  beam:BeamDto;
  isEditBEV:boolean=false;
  beamLimitingDeviceAngle:number | null;
  initialBeamLimitingDeviceAngle:number | null;
  cumulativeMu:number | null;
  controlPointsData: ControlPointInfo;
  controlPoints: ControlPointDto[] = [];
  updateControlPoints: ControlPointDto[] = [];
  selectedControlPoint:ControlPointDto = new ControlPointDto();
  symX:boolean;
  jawX1:number;
  jawX2:number;
  symY:boolean;
  jawY1:number;
  jawY2:number;

  XJawWrong:boolean;
  YJawWrong:boolean;
  X1RangeError:boolean;
  X2RangeError:boolean;
  Y1RangeError:boolean;
  Y2RangeError:boolean;

  constructor(
    private beamServiceProxy: BeamServiceProxy,
    private _message: NzMessageService,
    injector: Injector) {
    super(injector);
    }

  ngOnInit() {
  }

  reset():void{
    this.beam=null;
    this. beamLimitingDeviceAngle=null;
    this.initialBeamLimitingDeviceAngle=null;
    this.cumulativeMu=null;
    this.controlPointsData=null;
    this.controlPoints=null;
    this.updateControlPoints=[];
    this.selectedControlPoint=null;
    this.symX=false;
    this.jawX1=null;
    this.jawX2=null;
    this.symY=false;
    this.jawY1=null;
    this.jawY2=null;
    this.XJawWrong=false;
    this.YJawWrong=false;
  }
  editBEV():void{
    //判断权限
    var beamGroupNode=this.beamGroupList.find(beamGroup=>beamGroup.id == this.beamGroupID);
    if(beamGroupNode!=null){
      if(beamGroupNode.isApprove){
        this.message.error("已批准射野组下的射野不允许编辑！");
        return;
      }
      if(beamGroupNode.isCreateByTms==false){
        this.message.error("非TMS创建的射野BEV不允许修改！");
        return;
      }
    }

    this.beamServiceProxy.getBeamInfoByIndex(parseInt(this.beamId)).subscribe(
      beam_data => {
        if (null == beam_data) {
          return;
        }
        this.reset();
        var beam: BeamDto = beam_data;
        this.beam = beam; 
        if(beam.jawX1!=undefined && beam.jawX1 !=null){
            this.jawX1=Math.round(beam.jawX1)/10;
        }
        if(beam.jawX2!=undefined && beam.jawX2 !=null){
          this.jawX2=Math.round(beam.jawX2)/10;
        }
        if(beam.jawY1!=undefined && beam.jawY1 !=null){
          this.jawY1=Math.round(beam.jawY1)/10;
        }
        if(beam.jawY2!=undefined && beam.jawY2 !=null){
          this.jawY2=Math.round(beam.jawY2)/10;
        }
        if( beam.jawX1!=undefined && beam.jawX1 !=null && beam.jawX2!=undefined && beam.jawX2 !=null){
          if(beam.jawX1== -beam.jawX2){
             this.symX=true;
          }else{
            this.symX=false;
          }
        }else{
          this.symX=false; 
        }
        if(beam.jawY1!=undefined && beam.jawY1 !=null && beam.jawY2!=undefined && beam.jawY2 !=null){
          if(beam.jawY1== -beam.jawY2){
             this.symY=true;
          }else{
             this.symY=false;
          }
        }else{
           this.symY=false; 
        }
        this.beamLimitingDeviceAngle=beam.collimatorAngle;
        this.initialBeamLimitingDeviceAngle=beam.collimatorAngle;
        if(beam_data.controlPoints!=undefined && beam_data.controlPoints!=null && beam_data.controlPoints.length>0){
          this.cumulativeMu=beam_data.controlPoints[0].cumulativeMetersetWeight;
        }
        var controlPointInfo = new ControlPointInfo();
        controlPointInfo.controlPoints = beam.controlPoints;
        controlPointInfo.mlcLeafPositionBoundaries = beam.mlcLeafPositionBoundaries;
        this.controlPointsData = controlPointInfo;//传值给mlc组件
        this.controlPoints = beam.controlPoints;
        this.selectedControlPoint = this.controlPoints[0];
      }
    )
    this.isEditBEV=true;
  }
  cancelEdit():void{
      this.isEditBEV=false;
  }

  changeAsymx(event:any):void{
      if(event){
        this.symX=true;
        if(this.jawX1!=undefined && this.jawX1!=null){
          this.jawX2=-this.jawX1;
        }else if(this.jawX2 !=undefined && this.jawX2!=null){
          this.jawX1=-this.jawX2;
        }
      }else{
      this.symX=false;
      }
      if(this.jawX1>this.jawX2){
        this.XJawWrong=true;
      }else{
        this.XJawWrong=false;
        this.selectedControlPoint.jaw_X1=this.jawX1*10;
        this.selectedControlPoint.jaw_X2=this.jawX2*10;
        this.resetBEVImage();
      }
  }

  resetBEVImage(){
    this.controlPointsData[this.selectedControlPoint.controlPointIndex]=this.selectedControlPoint;
    this._mlcCommponent.reset(this.controlPointsData,this.selectedControlPoint.controlPointIndex);
  }
 
  changeAsymy(event:any):void{
      if(event){
        this.symY=true;
          if(this.jawY1 !=undefined && this.jawY1!=null){
              this.jawY2=-this.jawY1;
          }else if(this.jawY2 !=undefined && this.jawY2!=null){
              this.jawY1=-this.jawY2;
          }
      }else{
        this.symY=false;
      }
      if(this.jawY1>this.jawY2){
        this.YJawWrong=true;
      }else{
        this.YJawWrong=false;
        this.selectedControlPoint.jaw_Y1=this.jawY1*10;
        this.selectedControlPoint.jaw_Y2=this.jawY2*10;
        this.resetBEVImage();
      }
      
  }

  changejawX1(event:any):void{
    if(this.jawX1>20 || this.jawX1<-20){
      this.X1RangeError=true;
    }else{
      this.X1RangeError=false;
      if(this.symX){
        this.jawX2=-event;
        }
        if(this.jawX1>this.jawX2){
          this.XJawWrong=true;
        }else{
          this.XJawWrong=false;
          this.selectedControlPoint.jaw_X1=this.jawX1*10;
          this.selectedControlPoint.jaw_X2=this.jawX2*10;
          this.resetBEVImage();
        }
    }
  }

  changejawX2(event:any):void{
    if(this.jawX2>20 || this.jawX2<-20){
      this.X2RangeError=true;
    }else{
      this.X2RangeError=false;
      if(this.symX){
        this.jawX1=-event;
      }
      if(this.jawX1>this.jawX2){
        this.XJawWrong=true;
      }else{
        this.XJawWrong=false;
        this.selectedControlPoint.jaw_X1=this.jawX1*10;
        this.selectedControlPoint.jaw_X2=this.jawX2*10;
        this.resetBEVImage();
      }
    }
  }

  changejawY1(event:any):void{
    if(this.jawY1>20 || this.jawY1<-20){
      this.Y1RangeError=true;
    }else{
      this.Y1RangeError=false;
      if(this.symY){
        this.jawY2=-event;
      }
      if(this.jawY1>this.jawY2){
        this.YJawWrong=true;
      }else{
        this.YJawWrong=false;
        this.selectedControlPoint.jaw_Y1=this.jawY1*10;
        this.selectedControlPoint.jaw_Y2=this.jawY2*10;
        this.resetBEVImage();
      }
    }
  }

  changejawY2(event:any):void{
    if(this.jawY2>20 || this.jawY2<-20){
      this.Y2RangeError=true;
    }else{
      this.Y2RangeError=false;
      if(this.symY){
        this.jawY1=-event;
      }
      if(this.jawY1>this.jawY2){
        this.YJawWrong=true;
      }else{
        this.YJawWrong=false;
        this.selectedControlPoint.jaw_Y1=this.jawY1*10;
        this.selectedControlPoint.jaw_Y2=this.jawY2*10;
        this.resetBEVImage();
      }
    }
  }

  

    GetControlPointIndex(controlpointIndex: number) {
      if (controlpointIndex != null
        && controlpointIndex != 0
        && this.controlPoints[controlpointIndex - 1] != null) {
        var switch_controlPointsIndex = controlpointIndex - 1;
        this.GetValidJaw(switch_controlPointsIndex);
        this.cumulativeMu=this.controlPoints[controlpointIndex - 1].cumulativeMetersetWeight;
        this.selectedControlPoint = this.controlPoints[controlpointIndex - 1];
      }
    }
    
  //切换cp时，jaw四个值若都为0，向上寻找不都为0的值
    GetValidJaw(switch_controlPointsIndex: number) {
      for (var i = switch_controlPointsIndex; i > 0; i--) {
        if (this.controlPoints[i].jaw_X1 != 0 
          ||this.controlPoints[i].jaw_X2 != 0 
          ||this.controlPoints[i].jaw_Y1 != 0
          ||this.controlPoints[i].jaw_Y2 != 0   ) {
          this.jawX1=Math.round(this.controlPoints[i].jaw_X1)/10;
          this.jawX2=Math.round(this.controlPoints[i].jaw_X2)/10;
          this.jawY1=Math.round(this.controlPoints[i].jaw_Y1)/10;
          this.jawY2=Math.round(this.controlPoints[i].jaw_Y2)/10;
          if(this.controlPoints[i].asymX !=undefined && this.controlPoints[i].asymX!=null){
            this.symX=!this.controlPoints[i].asymX;
          }else{
            this.symX=false;
          }
          if(this.controlPoints[i].asymY !=undefined && this.controlPoints[i].asymY!=null){
            this.symY=!this.controlPoints[i].asymY ;
          }else{
            this.symY=false;
          }
          break;
        }
        else {
          continue;
        }
      }
    }
    
  submitEdit():void{
    
      var controlPoint = new ControlPointDto();
      controlPoint = this.selectedControlPoint;
      var update=false;
      if(this.beamLimitingDeviceAngle!=null && this.beamLimitingDeviceAngle!=undefined && this.initialBeamLimitingDeviceAngle!=this.beamLimitingDeviceAngle){
        if(this.beamId!=undefined && this.beamId!=null){
          var controlPointFirst = this.controlPoints[0];
          if(controlPointFirst!=undefined && controlPointFirst!=null){
            controlPointFirst.beamLimitingDeviceAngle=this.beamLimitingDeviceAngle;
            update=true;
            this.updateControlPoints.push(controlPointFirst);
          }
        }
      }
      if(this.jawX1 !=undefined && this.jawX1!=null && this.jawX1*10!==controlPoint.jaw_X1){
        controlPoint.jaw_X1=this.jawX1*10;
        update=true;
      }
      if(this.jawX2 !=undefined && this.jawX2!=null && this.jawX2*10!==controlPoint.jaw_X2){
        controlPoint.jaw_X2=this.jawX2*10;
        update=true;
      }
      if(this.jawY1 !=undefined && this.jawY1!=null && this.jawY1*10!==controlPoint.jaw_Y1){
        controlPoint.jaw_Y1=this.jawY1*10;
        update=true;
      }
      if(this.jawY2 !=undefined && this.jawY2!=null && this.jawY2*10!==controlPoint.jaw_Y2){
        controlPoint.jaw_Y2=this.jawY2*10;
        update=true;
      }
      if(this.symX!=(!controlPoint.asymX)){
        controlPoint.asymX=!this.symX;
      }
      if(this.symY!= (!controlPoint.asymY)){
        controlPoint.asymY=!this.symY;
      }
      if(update){
        this.updateControlPoints.push(controlPoint);
        if(this.updateControlPoints!=undefined &&  this.updateControlPoints!=null && this.updateControlPoints.length>0){
          this.beamServiceProxy.updateControlPointList(this.updateControlPoints)
          .pipe()
          .subscribe((result: boolean) => {
              if(result){
              this.editBEVConfirm.emit(true);
              this.isEditBEV=false;
              this._message.success(this.l('update beam successfully!'));
              }else{
                this._message.error("JAW值更新失败");
                return;
              }
              console.log("update controlpoint is success");
          })
        }
       }
      }
      
}
class LeafPairData {
  public value1: number;
  public value2: number;
  public index: number;
}