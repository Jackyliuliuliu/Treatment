import { Component, OnInit, Input, Output ,EventEmitter,Injector } from '@angular/core';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppComponentBase } from '@shared/app-component-base';
import { BeamGroupServiceProxy, BeamGroupDto, BeamDto, EnumServiceProxy, TreatmentDeliveryType, BeamServiceProxy, RotationDirection, ControlPointDto, ToleranceDto, RTToleranceTables, ToleranceServiceProxy, PortImageBeamDto, PortalImageTypes, PortalExposureTypes, BeamMode, Point3OfDouble } from '@shared/service-proxies/service-proxies';
import { FormGroup, FormBuilder} from '@angular/forms';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-editbeam',
  templateUrl: './editbeam.component.html',
  styleUrls: ['./editbeam.component.css']
})
export class EditbeamComponent extends AppComponentBase implements OnInit {

 @Input()
 isEditPermission:boolean;
 @Input()
 beamID:string;
 @Input()
 patientID:number;
 @Input()
 beamGroupID:number;
 @Input()
 beamGroupList: TreeNode[];
 @Output()
 public confirmaction=new EventEmitter<boolean>();


 isCreatedByTms:boolean;
 beam: BeamDto |null;
 enums;
 isEditbeam: boolean = false;
 validateForm: FormGroup;

 //input
 beamName:string | null;
 initialBeamName:string | string;
 toleracnceEditable:boolean;
 tolerance:ToleranceDto;
 tolerances: ToleranceDto[]=[];
 beamDose:number;
 beamMode:any;
 beamModes:any[] = [];
 description:string;
 SSD:number;
 MU:number;
 
 
 
  constructor(
    private formBuilder: FormBuilder,
    private _beamGroupService: BeamGroupServiceProxy,
    private _beamService: BeamServiceProxy,
    private _toleranceService: ToleranceServiceProxy,
    private enumService: EnumServiceProxy,
    private _message: NzMessageService,
    injector: Injector
    ) {
      super(injector);
     }

  ngOnInit() {
    
  }
  ngOnChanges(){
    //判断哪些input的参数变化时需要更新页面？
    //更新页面和reset、获取数据方法分开。
  }
  editBeam(): void {
    console.log("edit beam")
    
    var beamGroupNode=this.beamGroupList.find(beamGroup=>beamGroup.id == this.beamGroupID);
    if(beamGroupNode!=null){
      if(beamGroupNode.isApprove){
        this.message.error("已批准射野组下的射野不允许编辑！");
        return;
      }
      if(beamGroupNode.isCreateByTms!=null){
        this.isCreatedByTms=beamGroupNode.isCreateByTms;
      }else{
        this.isCreatedByTms=true;
      }
    }
    this.enumService.getAllMaps().subscribe(
      enums_data => {
        if (enums_data != null) {
          this.enums = enums_data;
        }
      }
    );
    this.initBeamValue();
    this.isEditbeam = true
  }
  initBeamValue(){
    this.beam=null;
    //basic Info
    //input
    this.beamName='';
    this.initialBeamName='';
    this.beamDose=null;
    this.description='';
    this.tolerance=null;
    this.toleracnceEditable=true;
    this.tolerances=[];
    this.beamMode=null;
    this.beamModes = [];
    this.enums=null;
    this.validateForm=null;
    this.SSD=null;
    this.MU=null;
    this._beamService.getBeamInfoByIndex(parseInt(this.beamID)).subscribe(//
      beam_data => {
        if (null == beam_data || undefined == beam_data) {
          return;
        }else{
          var beam: BeamDto = beam_data;
          this.beam = beam;
          this.beamName=beam.name;
          this.initialBeamName=beam.name;
          this.beamDose=beam.beamDose;
          this.description=beam.description;
          this.MU=beam.beamMu;
          if(beam.controlPoints!=undefined && beam.controlPoints != null && beam.controlPoints.length > 0){
            this.SSD=Math.round(beam.controlPoints[0].sourceToSurfaceDistance )/10;
          }
          if(this.beam !=undefined && this.beam!=null){
            this.initTolerance();
            this.initBeamMode();
          }
        }
       
      }
    );
  }
  initTolerance(){
    if(this.beamGroupID!=null){
      this._beamGroupService.getBeamGroupStatus(this.beamGroupID).subscribe(
        data=>{
          if(data!=null){
            if(data.toleranceId!=null){
              //当beamGroup勾选Tolerance时，tolerance不可编辑
              this.toleracnceEditable=false;
              this.tolerance=this.RTToleranceTablesToToleranceDto(this.beam.rtToleranceTables);
            }else{
              this.toleracnceEditable=true;
              this._toleranceService.getAllTolerance().subscribe(
                data =>{
                  if(data!=null){
                    var toleranceListall: ToleranceDto[] = data;
                    toleranceListall.forEach(tolerance=>{
                      if(null == this.beam.beamType || undefined == this.beam.beamType){
                        this.tolerances.push(tolerance);
                     }else if(tolerance.technique == this.enums.TechniqueType[this.beam.beamType]){
                        this.tolerances.push(tolerance);
                     }
                    });
                  }
                  if(this.beam.rtToleranceTables ==null){
                     this.tolerance=null;//beam 本身没有tolerance
                  }else{
                     this.tolerances.forEach(tolerance => {
                       if(tolerance.toleranceTableLabel==this.beam.rtToleranceTables.toleranceTableLabel){
                          if(tolerance==undefined || tolerance ==null ){
                            this.tolerances.push(this.RTToleranceTablesToToleranceDto(this.beam.rtToleranceTables));
                            this.tolerance=this.tolerances[this.tolerances.length-1];
                          }else{
                            this.tolerance=tolerance;
                          }
                       }
                      });
                  }
                }
              )
            }
          }
        }
      )
    }
  }
  RTToleranceTablesToToleranceDto(tolerance: RTToleranceTables): ToleranceDto {
      if (null == tolerance) {
        return;
      }
      let toleranceDto: ToleranceDto = new ToleranceDto();
      toleranceDto.id = -1;//这里表示beam中本身就有的tolerance
      toleranceDto.toleranceTableLabel = tolerance.toleranceTableLabel;
      if (this.beam.beamType != null) {
        toleranceDto.technique = this.enums.TechniqueType[this.beam.beamType];
      }
      toleranceDto.gantryAngle = tolerance.gantryAngleTolerance;
      toleranceDto.beamLimitingDeviceAngle = tolerance.beamLimitingDeviceAngleTolerance;
      toleranceDto.patientSupportAngle = tolerance.patientSupportAngleTolerance
      toleranceDto.tableVRT = tolerance.tableTopVerticalPositionTolerance;
      toleranceDto.tableLAT = tolerance.tableTopLateralPositionTolerance;
      toleranceDto.tableLNG = tolerance.tableTopLongitudinalPositionTolerance;
      if (tolerance.beamLimitingDeviceToleranceSequence == null) {
        return;
      }
      if (tolerance.beamLimitingDeviceToleranceSequence[0] != null) {
        toleranceDto.beamLimitingDevicePosition_X = tolerance.beamLimitingDeviceToleranceSequence[0].beamLimitingDevicePositionTolerance;
      }

      if (tolerance.beamLimitingDeviceToleranceSequence[1] != null) {
        toleranceDto.beamLimitingDevicePosition_Y = tolerance.beamLimitingDeviceToleranceSequence[1].beamLimitingDevicePositionTolerance;
      }

      if (tolerance.beamLimitingDeviceToleranceSequence[2] != null) {
        toleranceDto.beamLimitingDevicePosition_ASYMX = tolerance.beamLimitingDeviceToleranceSequence[2].beamLimitingDevicePositionTolerance;
      }

      if (tolerance.beamLimitingDeviceToleranceSequence[3] != null) {
        toleranceDto.beamLimitingDevicePosition_ASYMY = tolerance.beamLimitingDeviceToleranceSequence[3].beamLimitingDevicePositionTolerance;
      }

      if (tolerance.beamLimitingDeviceToleranceSequence[4] != null) {
        toleranceDto.beamLimitingDevicePosition_MLCX = tolerance.beamLimitingDeviceToleranceSequence[4].beamLimitingDevicePositionTolerance;
      }

      return toleranceDto;
  }
  initBeamMode(){
    //机器不在系统中
    if(this.beam!=undefined && this.beam!=null){
      if(this.beam.beamFluenceMode!=undefined && this.beam.beamFluenceMode!=null && this.beam.nominalBeamEnergy!=undefined && this.beam.nominalBeamEnergy!=null){
        if (this.beam.beamFluenceMode.Name == "STANDARD") {
          this.beamMode = this.beam.nominalBeamEnergy.toString() + "MV-" + "FFF";
        }
        else {
          this.beamMode = this.beam.nominalBeamEnergy.toString() + "MV-" + "FF";
        }
      }
      if(this.beam.validMachine){
        this.beam.beamModes.forEach(
          beamMode =>{
            var beamModeString=null;
            if(beamMode.energy!=null && beamMode.isFlattened!=null){
              if (beamMode.isFlattened) {
                beamModeString = beamMode.energy.toString() + "MV-" + "FF";
              }
              else {
                beamModeString = beamMode.energy.toString() + "MV-" + "FFF";
              }
            }
            this.beamModes.push(beamModeString);
        });
      }
    }
  }

  isBeamDuplicate(event :string):boolean{
    var result:boolean=true;
    if(event!=undefined &&  event!=null && this.initialBeamName!=null){
      if(this.initialBeamName == event ){
       return true;
      }
      this.beamGroupList.forEach(beamGroup=>{
        if(beamGroup.id == this.beamGroupID){
          var beams: TreeNode[]=beamGroup.children;
          if(beams!=undefined && beams!=null && beams.length>0){
               beams.forEach(element => {
                if(element.name == event){
                  result= false;
                }
              });
            }
          } 
      });
    } 
    return result;
  }

  getEnergyFromBeamModeString(beamMode:string):number{
    if(beamMode!=null){
      var energyIndex=beamMode.indexOf("MV");
      var energyString=beamMode.substring(0,energyIndex);
      if(energyString!=null){
       return  parseInt(energyString);
      }
    }
     return null;
   }

  getIsFlatFromBeamModeString(beamMode:string):boolean{
    if(beamMode!=null){
      var isFlatString=beamMode.split("-")[1];
      if(isFlatString!=null){
        if(isFlatString == "FF"){
          return true;
        }else{
          return false;
        }
      }
    }
  }


  submitEdit(): void {
    var isNameAvailable=this.isBeamDuplicate(this.beamName);
    if(!isNameAvailable){
      this._message.error(this.l('the beamname is duplicate!'))
       return;
    }
    var updateBeamDto=this.beam;
    updateBeamDto.name=this.beamName;
    if(this.tolerance !=undefined && this.tolerance!=null){
      updateBeamDto.toleranceId=this.tolerance.id;
    }
    updateBeamDto.beamDose=this.beamDose;
    updateBeamDto.nominalBeamEnergy = this.getEnergyFromBeamModeString(this.beamMode);
    var isFlat=this.getIsFlatFromBeamModeString(this.beamMode);
      var beamFluenceMode = {
        Id: isFlat ? 1:0,
        Name: isFlat ? "NON_STANDARD" : "STANDARD"
      };
    updateBeamDto.beamFluenceMode = beamFluenceMode;
    updateBeamDto.beamMu=this.MU;
    if(updateBeamDto.controlPoints==undefined || updateBeamDto.controlPoints==null || updateBeamDto.controlPoints.length<1){
      updateBeamDto.controlPoints=new ControlPointDto[1];
      updateBeamDto.controlPoints[0]=new ControlPointDto;
    }
    updateBeamDto.controlPoints[0].sourceToSurfaceDistance=this.SSD*10;
    updateBeamDto.description=this.description;
    this._beamService.updateBeam(updateBeamDto).subscribe(
      data => {
        if (data) {
          this.confirmaction.emit(true);
          this._message.success(this.l('update beam successfully!'));
          this.isEditbeam = false;
        }
        else {
          this._message.error(this.l('update beam failed'))
        }
      }
    )
  }
  cancelEdit(): void {
      console.log('cancel')
      this.isEditbeam = false
  }
}
