import { Component, OnInit, Injector, OnChanges, Input, Output, EventEmitter, Renderer2, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormGroupDirective, FormArray, FormControl } from '@angular/forms';
import { BeamGroupServiceProxy,WedgeDto,BlockDto, BeamGroupDto, BeamDto, EnumServiceProxy, TreatmentDeliveryType, BeamServiceProxy, RotationDirection, ControlPointDto, ToleranceDto, RTToleranceTables, ToleranceServiceProxy, PortImageBeamDto, PortalImageTypes, PortalExposureTypes, BeamMode } from '@shared/service-proxies/service-proxies';
import { init } from 'echarts';
import { AppComponentBase } from '@shared/app-component-base';
import { NzModalService, NzMessageService, NzAnchorLinkComponent } from 'ng-zorro-antd';
import { EditApertureModalComponent } from '@app/main/mlc/editAperture.component';
import { FastBackwardFill } from '@ant-design/icons-angular/icons/public_api';
import { instantiateDefaultStyleNormalizer } from '@angular/platform-browser/animations/src/providers';
import { GetBeamIdService } from '@shared/service-proxies/get-beamId.service';
import { UpdateBeamInfoService } from '@shared/service-proxies/update-beamInfo.service';
import { Subscription } from 'rxjs';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { BeamActionServiceService } from './beamactions/beam-action-service.service';
import { max } from 'moment';
import { TestBed } from '@angular/core/testing';

@Component({
  selector: 'app-beamparameter',
  templateUrl: './beamparameter.component.html',
  styleUrls: ['./beamparameter.component.less']
})
export class BeamparameterComponent extends AppComponentBase implements OnInit, OnChanges {

  @Input()
  id:string;//beamId--beam definition中node节点的ID

  @Input()
  beamGroupId: number;
 
  @Input()
  beamGroupList: TreeNode[];

  @Output()
  public nameChange = new EventEmitter<true>();
  BeamLimitingDeviceSequence: FormGroup;
  beam: BeamDto = null;
  BeamInfoLoading: boolean = true;
  beamModeString:string = null;
  //  Basic Info
  beamtypes: any[] = [];//tolist
  machinenames: any[] = [];//tolist
  radiationtypes: any[] = [];//tolist
  serialnumbers: any[] = [];//tolist
  deliverytypes: any[] = [];//tolist
  tolerances: any[] = [];//tolist
  //  Output
  // nominalbeamenergys: any[] = [];//tolist
  // fluencemodes: any[] = [];//tolist
  // beamModes: any[] = [];//tolist
  // doseRates: any[] = [];//tolist

  // Gantry
  rotationdirections: any[] = [];//tolist

  SSD:number;

  // BeamLimitingDeviceSequence
  beamlimitingdevicetype_xs: any[] = [];
  beamlimitingdevicetype_ys: any[] = [];
  beamlimitingdevicetype_mlcs: any[] = [];
  canEditAperture: boolean = true;
  isMlcDataVisible: boolean = false;
  cumulativeMu : number = null;

  enums;
  machines;

  // imaging disabled
  imageEnable
  beamModeList: any[] = [];//是否与beamModes重复

  //imagingInfo
  isImageAble:boolean;
  imagingPositionX:number = null;
  imagingPositionY:number = null;
  rtImagingSid:number = null;
  isPreAble:boolean;
  prePortalMu:number = null;
  prePortalDoubleExposure:boolean;
  prePortalRaditionMode:string = null;
  prePortalDelta:number = null;
  prePortalOpenmu:number = null;
  isPostAble:boolean;
  postPortalMu:number = null;
  postPortalDoubleExposure:boolean;
  postPortalRaditionMode:string = null;
  postPortalDelta:number = null;
  postPortalOpenmu:number = null;
  isDurAble:boolean;
  DuringPortalMu:number = null;
 
  //WedgeSequence
  WedgeSequence:WedgeDto[]=[];
  Bolus:any[];
  BlockSequence:BlockDto[]=[];
  ApplicatorSequence:any[];
  subscription: Subscription;

  controlPointsData: ControlPointInfo;//segmentsData:SegmentsData;
  symx:string | null;
  symy:string | null;
  controlPoints: ControlPointDto[] = [];//beam中的controlPoints
   //isToleranceChooseFromRVS: boolean;
  selectedControlPoint:ControlPointDto = new ControlPointDto();
  isBeamLimitingDeviceInit: boolean;

  nameChangePre: string;
  toleranceCondition: boolean;
  isBeamInit: boolean;
  //***************************************************************************
  //*****************************构造函数***************************************
  //***************************************************************************
  constructor(private fb: FormBuilder,
    private beamGroupService: BeamGroupServiceProxy,
    private _nzModalService: NzModalService,
    private enumService: EnumServiceProxy,
    private _message: NzMessageService,
    private _beamService: BeamServiceProxy,
    private _getBeamIdService: GetBeamIdService,
    private _updateBeamInfoService: UpdateBeamInfoService,
    private _toleranceService: ToleranceServiceProxy,
    private beamActionServiceService: BeamActionServiceService,
    private renderer2: Renderer2,
    injector: Injector) {
    super(injector);
    
  }

  //***************************************************************************
  //************************ngOnChanges钩子函数用来初始化组件*******************
  //***************************************************************************
  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
    this.beamActionServiceService.CopyBeamLoading.subscribe(() => { this.BeamInfoLoading = true })
    this.beamActionServiceService.AddBeamLoading.subscribe(() => { this.BeamInfoLoading = true })
    this.beamActionServiceService.DeleteBeamLoading.subscribe(() => { this.BeamInfoLoading = true })
    this.BeamLimitingDeviceSequence=this.fb.group({
      beamlimitingdeviceangle: [null, [Validators.required]],
      x1: [null, [Validators.required]],
      x2: [null, [Validators.required]],
      y1: [null, [Validators.required]],
      y2: [null, [Validators.required]],
      ssd: [null, [Validators.required]],
      cumulativemu: [null, [Validators.required,]],
    }),
    this.initBeamData();
  }
  
  ngOnInit() {

  }
  //***************************************************************************
  //************************各种Action函数**************************************
  //***************************************************************************
  async initBeamData():Promise<boolean>{
    if (this.id == null) {
      return;
    }
    this._beamService.getBeamInfoByIndex(parseInt(this.id)).subscribe(
      beam_data => {
        if (null == beam_data) {
          return;
        }
        this.resetData();
        this.resetImage();
        this.isBeamInit = true;
        var beam: BeamDto = beam_data;
        this.beam = beam;
        this.initBeamMode(beam);
        this.initImaging(beam);
        if(beam.wedgeList!=null && beam.wedgeList.length>0){
          this.WedgeSequence=beam.wedgeList;
        }
        if(beam.blockList!=null && beam.blockList.length>0){
          this.BlockSequence=beam.blockList;
        }
        this.Bolus=[];
        this.initBeamLimitingDeviceSequence( beam);
        this.ApplicatorSequence=[];
        //this.setBeamEditable(beam);
        this.BeamInfoLoading = false;
        this.isBeamInit = false;
        // if (this.id != null) {
        //   this._getBeamIdService.setBeamIndex(this.id);
        // }
      }
    )
  }
 
  resetData():void{
    this.SSD=null;
    this.WedgeSequence=[];
    this.Bolus=[];
    this.BlockSequence=[];
    this.ApplicatorSequence=[];
  }

  resetImage():void{
    this.isImageAble=false;
    this.imagingPositionX=null;
    this.imagingPositionY=null;
    this.rtImagingSid=null;
    this.isPreAble=false;
    this.prePortalMu=null;
    this.prePortalDoubleExposure=null;
    this.prePortalRaditionMode=null;
    this.prePortalDelta=null;
    this.prePortalOpenmu=null;
    this.isPostAble=false;
    this.postPortalMu=null;
    this.postPortalDoubleExposure=null;
    this.postPortalRaditionMode=null;
    this.postPortalDelta=null;
    this.postPortalOpenmu=null;
    this.isDurAble=false;
    this.DuringPortalMu=null;
  }

  refreshBeamBasic(id:string):void{
    this.resetData();
    this._beamService.getBeamInfoByIndex(parseInt(this.id)).subscribe(
      beam_data => {
        if (null == beam_data) {
          return;
        }
        this.isBeamInit = true;
        var beam: BeamDto = beam_data;
        this.beam = beam; 
        this.initBeamMode(beam);
        if(this.beam.controlPoints!=undefined && this.beam.controlPoints!=null && this.beam.controlPoints.length>0){
          this.SSD=Math.round(this.beam.controlPoints[0].sourceToSurfaceDistance)/10;
        }
        this.BeamInfoLoading = false;
        this.isBeamInit = false;
      }
    )
  }

  initBeamMode(beam:BeamDto):void{
    if(beam.beamFluenceMode!=undefined && beam.beamFluenceMode!=null && beam.nominalBeamEnergy!=undefined && beam.nominalBeamEnergy!=null){
      if (beam.beamFluenceMode.Name == "STANDARD") {
        this.beamModeString = beam.nominalBeamEnergy.toString() + "MV-" + "FFF";
      }
      else {
        this.beamModeString = beam.nominalBeamEnergy.toString() + "MV-" + "FF";
      }
    }
  }

  initBeamLimitingDeviceSequence( beam: BeamDto) {
    //resetData
    this.controlPointsData=null;
    this.symx=null;
    this.symy=null;
    this.controlPoints=null;
    //enums: { [key: string]: { [key: string]: number; }; },
    /**传值给mlc控件**/
    var controlPointInfo = new ControlPointInfo();
    controlPointInfo.controlPoints = beam.controlPoints;
    controlPointInfo.mlcLeafPositionBoundaries = beam.mlcLeafPositionBoundaries;
    this.controlPointsData = controlPointInfo;//传值给mlc组件
    //init
    this.controlPoints = beam.controlPoints;
    this.isBeamLimitingDeviceInit = true;
    if (beam.controlPoints[0] != null) {
        if(beam.collimatorAngle!=undefined && beam.collimatorAngle!=null){
          this.beam.collimatorAngle=Math.round(beam.collimatorAngle*100)/100;
        }
        if(beam.jawX1!=undefined && beam.jawX1!=null){
          this.beam.jawX1=Math.round(beam.jawX1)/10;
        }
        if(beam.jawX2!=undefined && beam.jawX2!=null){
          this.beam.jawX2=Math.round(beam.jawX2)/10;
        }
        if(beam.jawY1!=undefined && beam.jawY1!=null){
          this.beam.jawY1=Math.round(beam.jawY1)/10;
        }
        if(beam.jawY2!=undefined && beam.jawY2!=null){
          this.beam.jawY2=Math.round(beam.jawY2)/10;
        }
        if(beam.jawX1 == -beam.jawX2){
          this.symx="是";
        }else{
          this.symx="否";
        }
        if(beam.jawY1 == -beam.jawY2){
          this.symy="是";
        }else{
          this.symy="否";
        }
        if(beam.patientSupportAngle!=undefined && beam.patientSupportAngle!=null){
          this.beam.patientSupportAngle=Math.round(beam.patientSupportAngle*100)/100;
        }
    
      if(beam.controlPoints[0].sourceToSurfaceDistance != null)
      {
        this.SSD=Math.round(beam.controlPoints[0].sourceToSurfaceDistance )/10;
      }
      this.cumulativeMu=Math.round(beam.controlPoints[0].cumulativeMetersetWeight*100)/100;
    }
    this.isBeamLimitingDeviceInit = false;
  }


  updateSegments() {
    this._beamService.getBeamInfoByIndex(parseInt(this.id)).subscribe(
      beam_data => {
        var beam: BeamDto = beam_data;
        this.initBeamLimitingDeviceSequence( beam);
      },
    )
  }

  showMlcData() {
    this.isMlcDataVisible = true;
  }

  initImaging(beam: BeamDto) {
    if (beam.portImageBeams != null && beam.portImageBeams.length > 0) {
      beam.portImageBeams.forEach(
        portImageBeam => {
          if (portImageBeam.portType != null) {
            this.isImageAble=true;
            //Pre
            if (portImageBeam.portType.name == "Pre") {
              this.isPreAble=true;
              this.imagingPositionX=Math.round(portImageBeam.detectorXShift*100)/100 ;
              this.imagingPositionY=Math.round(portImageBeam.detectorYShift*100)/100 ;
              this.rtImagingSid=Math.round(portImageBeam.sid*100)/100 ;
              if(portImageBeam.mu!=undefined && portImageBeam.mu!=null){
                this.prePortalMu=portImageBeam.mu;
              }
              
              if (portImageBeam.doublePosure != null && portImageBeam.doublePosure.name == "Double") {
                if(portImageBeam.isFlat!=null && portImageBeam.machineEnergy!=null){
                   var isFlatString=portImageBeam.isFlat? ("MV-" + "FF") : ("MV-" + "FFF");
                   this.prePortalRaditionMode=portImageBeam.machineEnergy.toString()+isFlatString;
                }
                this.prePortalDoubleExposure=true;
                this.prePortalDelta=Math.round(portImageBeam.portImageDelta*100)/100 ;
                this.prePortalOpenmu=Math.round(portImageBeam.portImageOpenMu*100)/100 ;
              }
            }
            //During
            else if (portImageBeam.portType.name == "During") {
              this.isDurAble=true;
              this.imagingPositionX=Math.round(portImageBeam.detectorXShift*100)/100 ;
              this.imagingPositionY=Math.round(portImageBeam.detectorYShift*100)/100 ;
              this.rtImagingSid=Math.round(portImageBeam.sid*100)/100 ;
              if(portImageBeam.mu!=undefined && portImageBeam.mu!=null){
                this.DuringPortalMu=portImageBeam.mu;
              }
              
            }
            //Post
            else if (portImageBeam.portType.name == "Post") {
              this.isPostAble=true;
              this.imagingPositionX=Math.round(portImageBeam.detectorXShift*100)/100 ;
              this.imagingPositionY=Math.round(portImageBeam.detectorYShift*100)/100 ;
              this.rtImagingSid=Math.round(portImageBeam.sid*100)/100 ;
              if(portImageBeam.mu!=undefined && portImageBeam.mu!=null){
                this.postPortalMu=portImageBeam.mu;
              }
              
              if (portImageBeam.doublePosure != null && portImageBeam.doublePosure.name == "Double") {
                if(portImageBeam.isFlat!=null && portImageBeam.machineEnergy!=null){
                  var isFlatString=portImageBeam.isFlat? ("MV-" + "FF") : ("MV-" + "FFF");
                  this.postPortalRaditionMode=portImageBeam.machineEnergy.toString()+isFlatString;
                }
                this.postPortalDoubleExposure=true;
                this.postPortalDelta=Math.round(portImageBeam.portImageDelta*100)/100 ;
                this.postPortalOpenmu=Math.round(portImageBeam.portImageOpenMu*100)/100 ;
              }
            }
          }
        }
      )
    }
    
  }

  KeyValueToSelect(keyValues: { [key: string]: number; }, selectViewModel: any[]) {
    for (var kv in keyValues) {
      selectViewModel.push({ value: kv, label: kv, index: keyValues[kv] });
      //index：keyValues: { [key: string]: number 中的number 值，因为有时候服务端传回来的是number类型不是string
    }
  }

  //由于服务端在枚举传到UI时，将枚举变为字典类型，这边根据传回来的是number还是string做了分支判断，
  //当传回来的时string则isName置为true，number则为false，
  //这里的try-catch，没有处理异常的情况，这是为了跳出forEach循环
  IndexofSelect(ViewModelSelects: any[], selectvalue: string, isName: boolean): number {
    var index = -1;
    if (isName) {
      try {
        ViewModelSelects.forEach(ViewModelSelect => {
          index = index + 1;
          if (ViewModelSelect.label == selectvalue) {
            throw new Error('get index');
          }

        })
      }
      catch (e) {
      }
      return index;
    }
    else {
      try {
        ViewModelSelects.forEach(ViewModelSelect => {
          index = index + 1;
          if (ViewModelSelect.index == selectvalue) {
            throw new Error('get index');
          }
          index = index + 1;
        })
      }
      catch (e) {
      }
      return index;
    }

  }
  
  //换cp时，会触发，
  //注意：由于mlc组件内核beam中的segments同步，所以，在有换cp事件过来，根据index在beam中的segments进行遍历；
  //当然也可以MLC组件传相关的segment值过来
  GetControlPointIndex(controlpointIndex: number) {
    if (controlpointIndex != null
      && controlpointIndex != 0
      && this.controlPoints[controlpointIndex - 1] != null) {
      var switch_controlPointsIndex = controlpointIndex - 1;
      this.GetValidBeamlimitingdeviceangle(switch_controlPointsIndex);
      this.GetValidJaw(switch_controlPointsIndex);
      this.GetValidSSD(switch_controlPointsIndex);
      this.cumulativeMu=this.controlPoints[controlpointIndex - 1].cumulativeMetersetWeight;
      this.selectedControlPoint = this.controlPoints[controlpointIndex - 1];
    }
  }
   //切换cp时，beamlimitingdeviceangle若为null，向上寻找不为null的值
  GetValidBeamlimitingdeviceangle(switch_controlPointsIndex: number) {
      for (var i = switch_controlPointsIndex; i > 0; i--) {
        if (this.controlPoints[i].beamLimitingDeviceAngle != null) {
          this.BeamLimitingDeviceSequence.controls.beamlimitingdeviceangle.setValue(this.controlPoints[i].beamLimitingDeviceAngle);
          break;
        }
        else {
          continue;
        }
      }
  }

//切换cp时，jaw四个值若都为0，向上寻找不都为0的值
  GetValidJaw(switch_controlPointsIndex: number) {
    for (var i = switch_controlPointsIndex; i > 0; i--) {
      if (this.controlPoints[i].jaw_X1 != 0 
        ||this.controlPoints[i].jaw_X2 != 0 
        ||this.controlPoints[i].jaw_Y1 != 0
        ||this.controlPoints[i].jaw_Y2 != 0   ) {
        this.beam.jawX1=Math.round(this.controlPoints[i].jaw_X1)/10;
        this.beam.jawX2=Math.round(this.controlPoints[i].jaw_X2)/10;
        this.beam.jawY1=Math.round(this.controlPoints[i].jaw_Y1)/10;
        this.beam.jawY2=Math.round(this.controlPoints[i].jaw_Y2)/10;
        if(this.controlPoints[i].asymX !=undefined && this.controlPoints[i].asymX!=null){
          this.symx=this.controlPoints[i].asymX ? "否" : "是";
        }else{
          this.symx="否";
        }
        if(this.controlPoints[i].asymY !=undefined && this.controlPoints[i].asymY!=null){
          this.symy=this.controlPoints[i].asymY ? "否" : "是";
        }else{
          this.symy="否";
        }
        break;
      }
      else {
        continue;
      }
    }
  }

  GetValidSSD(switch_controlPointsIndex: number) {
    for (var i = switch_controlPointsIndex; i > 0; i--) {
      if (this.controlPoints[i].sourceToSurfaceDistance != null && this.controlPoints[i].sourceToSurfaceDistance != 0 ) {
        this.SSD=Math.round(this.controlPoints[i].sourceToSurfaceDistance*10)/100;
        break;
      }
      else {
        continue
      }
    }
}

  updateBeamImage():void{
    this._beamService.getBeamImageByIndex(parseInt(this.id)).subscribe(
      beamImageData => {
        if (null == beamImageData) {
          return;
        }
        //this.isBeamInit = true;
        var beam: BeamDto = beamImageData;
        this.resetImage();
        this.initImaging( beam);       
      },
    )
    
  }

  updateBEV():void{
    this._beamService.getBeamInfoByIndex(parseInt(this.id)).subscribe(
      beam_data => {
        if (null == beam_data) {
          return;
        }
        this.initBeamLimitingDeviceSequence(beam_data);
      },
    )
  }


  // initBeamOutput(enums: { [key: string]: { [key: string]: number; }; }, beam: BeamDto) {

  //   //针对那些机器不在系统中数据
  //   if (!beam.validMachine) {
  //     // beam.nominalBeamEnergy
  //     // beam.beamFluenceMode
  //     var beamModeString;
  //     if (beam.beamFluenceMode != null) {
  //       if (beam.beamFluenceMode.Name == "STANDARD") {
  //         beamModeString = beam.nominalBeamEnergy.toString() + "MV-" + "FFF";
  //       }
  //       else {
  //         beamModeString = beam.nominalBeamEnergy.toString() + "MV-" + "FF";
  //       }
  //       var beamModes = [];
  //       beamModes.push(
  //         {
  //           label: beamModeString,
  //         }
  //       )
  //       this.beamModes = beamModes;
  //       this.Output.controls.beammode.setValue(this.beamModes[0]);

  //       var doseRates = [];
  //       doseRates.push(beam.doseRateSet);
  //       this.doseRates = doseRates;
  //       this.Output.controls.doseRate.setValue(this.doseRates[0]);
        
  //       this.Output.controls.beamdose.setValue(beam.beamDose);
  //       this.Output.controls.totalmu.setValue(beam.beamMu);

  //       return;
  //     }
  //   }


  //   if (beam.beamModes != null) {
  //     var beamModes = [];
  //     beam.beamModes.forEach(
  //       beamMode => {
  //         if (beamMode.energy != null && beamMode.isFlattened != null) {

  //           if (beamMode.isFlattened) {
  //             var beamModeString = beamMode.energy.toString() + "MV-" + "FF";
  //           }
  //           else {
  //             var beamModeString = beamMode.energy.toString() + "MV-" + "FFF";
  //           }
  //         }
  //         beamModes.push(
  //           {
  //             label: beamModeString,
  //             value: beamMode,
  //           }
  //         )
  //       }
  //     )
  //     this.beamModes = beamModes;
  //   }

  //   var isFlat: boolean = false;
  //   if (beam.beamFluenceMode != null) {
  //     if (beam.beamFluenceMode.Name == "STANDARD") {
  //       isFlat = false;
  //     }
  //     else {
  //       isFlat = true;
  //     }

  //     var index = this.IndexofbeamModeList(beam.nominalBeamEnergy, isFlat);
  //     if (index != -1) {
  //       this.Output.controls.beammode.setValue(this.beamModes[index]);
  //     }
  //   }

  //   if (this.Output.controls.beammode.value != null) {
  //     this.GetDoseRateList(this.Output.controls.beammode.value.value);
  //   }



  //   var index = this.IndexofDoseRate(beam.doseRateSet);
  //   if (index != -1) {
  //     this.Output.controls.doseRate.setValue(this.doseRates[index]);
  //   }

  //   this.Output.controls.beamdose.setValue(beam.beamDose);
  //   this.Output.controls.totalmu.setValue(beam.beamMu);
  // }



  // GetDoseRateList(_beamMode: BeamMode) {
  //   var index = -1;
  //   try {
  //     this.beam.beamModes.forEach(
  //       beamMode => {
  //         index = index + 1;
  //         if (beamMode.energy == _beamMode.energy && beamMode.isFlattened == _beamMode.isFlattened) {
  //           throw new Error('get index');//为了跳出循环
  //         }

  //       }
  //     )
  //   } catch (error) {
  //   }

  //   if (index != -1) {
  //     this.doseRates = this.beam.beamModes[index].doseRates;
  //   }
  // }

  // IndexofDoseRate(_doseRate: number) {
  //   var index = -1;
  //   try {
  //     this.doseRates.forEach(
  //       doseRate => {
  //         index = index + 1;
  //         if (doseRate == _doseRate) {
  //           throw new Error('get index');//为了跳出循环
  //         }
  //       }
  //     )
  //   } catch (e) {
  //   }
  //   return index;
  // }


  

  // IndexofbeamModeList(machineEnergy: number, isFlat: boolean): number {
  //   var index = -1;
  //   try {
  //     this.beamModes.forEach(
  //       beamMode => {
  //         index = index + 1;
  //         if (beamMode.value.energy == machineEnergy && beamMode.value.isFlattened == isFlat) {
  //           throw new Error('get index');//为了跳出循环
  //         }
  //       }
  //     )
  //   } catch (e) {
  //   }
  //   return index;
  // }


  //initSubscribe() {
    

    //Gantry Stop Angle
    // this.Gantry.controls.gantryangle.valueChanges.subscribe(
    //   data => {
    //     if (this.isBeamInit) {
    //       return;
    //     }

    //     if (this.beam.beamType == "3DCRT") {
    //       this.Gantry.controls.gantrystopangle.setValue(data);
    //       return;
    //     }

    //     if (this.Gantry.controls.rotationdirection.value == null ||
    //       this.Gantry.controls.arclength.value == null ||
    //       data == null) {
    //       return;
    //     }

    //     //先全部转string,AbstractControl的value值的类型在变化，
    //     //在赋值时，类型为赋值类型；但当修改input时会变为string；
    //     //所以统一改为string处理
    //     var data = data.toString();
    //     var rotationdirection = this.Gantry.controls.rotationdirection.value.toString();
    //     var arclength = this.Gantry.controls.arclength.value.toString();

    //     if (data != "" && rotationdirection != "None" && arclength != "") {
    //       var tempAngle = rotationdirection == "Clockwise"
    //         ? parseInt(data) + parseInt(arclength)
    //         : parseInt(data) - parseInt(arclength);
    //       while (true) // 采用最简单的方式处理，保证取值范围在[0, 360)之间(from wpf)
    //       {
    //         if (tempAngle >= 0 && tempAngle < 360) {
    //           break;
    //         }
    //         if (tempAngle < 0) {
    //           tempAngle += 360;
    //         }
    //         if (tempAngle >= 360) {
    //           tempAngle -= 360;
    //         }
    //       }
    //       this.Gantry.controls.gantrystopangle.setValue(tempAngle);
    //     }
    //   }
    // )

    // this.Gantry.controls.arclength.valueChanges.subscribe(
    //   data => {
    //     if (this.isBeamInit) {
    //       return;
    //     }

    //     if (this.Gantry.controls.rotationdirection.value == null ||
    //       this.Gantry.controls.gantryangle.value == null ||
    //       data == null) {
    //       return;
    //     }

    //     //先全部转string
    //     var data = data.toString();
    //     var rotationdirection = this.Gantry.controls.rotationdirection.value.toString();
    //     var gantryangle = this.Gantry.controls.gantryangle.value.toString();

    //     if (data != "" && rotationdirection != "None" && gantryangle != "") {
    //       var tempAngle = rotationdirection == "Clockwise"
    //         ? parseInt(gantryangle) + parseInt(data)
    //         : parseInt(gantryangle) - parseInt(data);
    //       while (true) // 采用最简单的方式处理，保证取值范围在[0, 360)之间
    //       {
    //         if (tempAngle >= 0 && tempAngle < 360) {
    //           break;
    //         }
    //         if (tempAngle < 0) {
    //           tempAngle += 360;
    //         }
    //         if (tempAngle >= 360) {
    //           tempAngle -= 360;
    //         }
    //       }
    //       this.Gantry.controls.gantrystopangle.setValue(tempAngle);
    //     }
    //   }
    // )

    // this.Gantry.controls.rotationdirection.valueChanges.subscribe(
    //   data => {
    //     if (this.isBeamInit) {
    //       return;
    //     }


    //     if (this.Gantry.controls.gantryangle.value == null ||
    //       this.Gantry.controls.arclength.value == null ||
    //       data == null) {
    //       return;
    //     }

    //     //先全部转string
    //     var data = data.toString();
    //     var gantryangle = this.Gantry.controls.gantryangle.value.toString();
    //     var arclength = this.Gantry.controls.arclength.value.toString();



    //     if (data != "None" && gantryangle != "" && arclength != "") {
    //       var tempAngle = data == "Clockwise"
    //         ? parseInt(gantryangle) + parseInt(arclength)
    //         : parseInt(gantryangle) - parseInt(arclength);
    //       while (true) // 采用最简单的方式处理，保证取值范围在[0, 360)之间
    //       {
    //         if (tempAngle >= 0 && tempAngle < 360) {
    //           break;
    //         }
    //         if (tempAngle < 0) {
    //           tempAngle += 360;
    //         }
    //         if (tempAngle >= 360) {
    //           tempAngle -= 360;
    //         }
    //       }
    //       this.Gantry.controls.gantrystopangle.setValue(tempAngle);
    //     }
    //   }
    // )

  //}

  // SetGantrystopangle() {
  //   if (this.Gantry.controls.rotationdirection.value != "None"
  //     && this.Gantry.controls.gantryangle.value != null
  //     && this.Gantry.controls.arclength.value != null) {
  //     var tempAngle = this.Gantry.controls.rotationdirection.value == "Clockwise"
  //       ? parseInt(this.Gantry.controls.gantryangle.value) + parseInt(this.Gantry.controls.arclength.value)
  //       : parseInt(this.Gantry.controls.gantryangle.value) - parseInt(this.Gantry.controls.arclength.value);
  //     while (true) // 采用最简单的方式处理，保证取值范围在[0, 360)之间
  //     {
  //       if (tempAngle >= 0 && tempAngle < 360) {
  //         break;
  //       }
  //       if (tempAngle < 0) {
  //         tempAngle += 360;
  //       }
  //       if (tempAngle >= 360) {
  //         tempAngle -= 360;
  //       }
  //     }
  //     this.Gantry.controls.gantrystopangle.setValue(tempAngle);
  //   }
  // }




  /*****************************************/
  /******************保存beam****************/
  /**********************
  SaveBeam() {
    if (this.IsDuplicateName()) {
      this._message.warning(this.l('the beamname is duplicate!'));
      return;
    }

    if(this.Imaging.controls.imagingenbale.value == true
      && this.Imaging.controls.portalpre.value == false
      && this.Imaging.controls.portalduring.value == false
      && this.Imaging.controls.portalpost.value == false)
    {
      this._message.warning(this.l('You must choose an imaging method!'));
      return;
    }

    var beamDto: BeamDto = new BeamDto();
    //BasicInfo
    beamDto.name = this.BasicInfo.controls.beamname.value;
    //beamDto.number = this.BasicInfo.controls.beamnumber.value;
    beamDto.beamType = this.BasicInfo.controls.beamtype.value;
    beamDto.beamRadiationType = this.BasicInfo.controls.radiationtype.value;
    beamDto.machineName = this.BasicInfo.controls.machinename.value;
    beamDto.description = this.BasicInfo.controls.beamdescription.value;
    beamDto.deviceSerialNumber = this.BasicInfo.controls.serialnumber.value;

    if (this.BasicInfo.controls.tolerance.value != null) {
      beamDto.toleranceId = this.BasicInfo.controls.tolerance.value.id;
    }


    if (this.BasicInfo.controls.deliverytype.value != null) {
      var treatmentDeliveryType = new TreatmentDeliveryType();
      treatmentDeliveryType.name = this.BasicInfo.controls.deliverytype.value;
      treatmentDeliveryType.id = this.enums.TreatmentDeliveryType[this.BasicInfo.controls.deliverytype.value];
      beamDto.beamTreatmentDeliveryType = treatmentDeliveryType;
    }

    //output


    beamDto.beamMu = this.Output.controls.totalmu.value;

    beamDto.doseRateSet = this.Output.controls.doseRate.value;

    beamDto.beamDose = this.Output.controls.beamdose.value;

    if (this.Output.controls.beammode != null && this.Output.controls.beammode.value != null) {
      beamDto.nominalBeamEnergy = this.Output.controls.beammode.value.value.energy;
      var id = this.Output.controls.beammode.value.value.isFlattened ? 1 : 0;
      var name = id == 1 ? "NON_STANDARD" : "STANDARD";
      var beamFluenceMode = {
        Id: id,
        Name: name
      };
      beamDto.beamFluenceMode = beamFluenceMode;
    }


    // if(this.Output.controls.fluencemode.value!= null)
    // {
    //   var beamFluenceMode = {
    //     Id: this.enums.FluenceMode[this.Output.controls.fluencemode.value],
    //     Name: this.Output.controls.fluencemode.value };
    //  beamDto.beamFluenceMode = beamFluenceMode;
    // }




    //gantry
    beamDto.gantryAngle = this.Gantry.controls.gantryangle.value;


    if (this.Gantry.controls.rotationdirection.value != null) {
      var gantryRotationDirection = new RotationDirection();
      gantryRotationDirection.name = this.Gantry.controls.rotationdirection.value;
      gantryRotationDirection.id = this.enums.RotationDirection[this.Gantry.controls.rotationdirection.value];
      beamDto.gantryRotationDirection = gantryRotationDirection;
    }


    beamDto.arcLength = this.Gantry.controls.arclength.value;

    beamDto.arcStopGantryAngle = this.Gantry.controls.gantrystopangle.value;

    //patientSupport0
    beamDto.patientSupportAngle = this.PatientSupport.controls.patientSupportAngle.value;

    //BeamLimitingDeviceSequence
    beamDto.collimatorAngle = this.BeamLimitingDeviceSequence.controls.beamlimitingdeviceangle.value;
    beamDto.jawX1 = this.BeamLimitingDeviceSequence.controls.x1.value;
    beamDto.jawX2 = this.BeamLimitingDeviceSequence.controls.x2.value;
    beamDto.jawY1 = this.BeamLimitingDeviceSequence.controls.y1.value;
    beamDto.jawY2 = this.BeamLimitingDeviceSequence.controls.y2.value;

    beamDto.controlPoints = this.controlPoints;


    //portalimage
    var portalImageBeams: PortImageBeamDto[] = [];//tolist

    if (false == this.Imaging.controls.imagingenbale.value) {
      //用户未勾选portal
      portalImageBeams = [];
    }
    else {
      //用户勾选portal
      if (this.Imaging.controls.portalpre.value) {
        var pre = new PortImageBeamDto();
        var type = new PortalImageTypes();
        type.id = 0;
        type.name = "Pre";
        pre.portType = type;

        pre.sid = this.Imaging.controls.rtimagesid.value;
        pre.detectorXShift = this.Imaging.controls.rtimagepositionx.value;
        pre.detectorYShift = this.Imaging.controls.rtimagepositiony.value;

        pre.mu = this.Imaging.controls.mupre.value;

        if (this.Imaging.controls.doubleexposurepre.value) {
          pre.doublePosure = new PortalExposureTypes();
          pre.doublePosure.name = "Double";
          pre.doublePosure.id = 1;
          pre.portImageOpenMu = this.Imaging.controls.openmupre.value;
          pre.portImageDelta = this.Imaging.controls.deltapre.value;
          if (this.Imaging.controls.beammodepre.value != null) {
            pre.machineEnergy = this.Imaging.controls.beammodepre.value.value.energy;
            pre.isFlat = this.Imaging.controls.beammodepre.value.value.isFlattened;
          }
        }
        if (this.id != null) {
          pre.referencedTreatmentBeamId = parseInt(this.id);
        }

        portalImageBeams.push(pre);
      }
      if (this.Imaging.controls.portalduring.value) {
        var during = new PortImageBeamDto();

        var type = new PortalImageTypes();
        type.id = 1;
        type.name = "During";
        during.portType = type;

        during.sid = this.Imaging.controls.rtimagesid.value;
        during.detectorXShift = this.Imaging.controls.rtimagepositionx.value;
        during.detectorYShift = this.Imaging.controls.rtimagepositiony.value;

        during.mu = this.Imaging.controls.muduring.value;
        if (this.id != null) {
          during.referencedTreatmentBeamId = parseInt(this.id);
        }
        portalImageBeams.push(during);
      }
      if (this.Imaging.controls.portalpost.value) {
        var post = new PortImageBeamDto();
        var type = new PortalImageTypes();
        type.id = 2;
        type.name = "Post";
        post.portType = type;
        post.sid = this.Imaging.controls.rtimagesid.value;
        post.detectorXShift = this.Imaging.controls.rtimagepositionx.value;
        post.detectorYShift = this.Imaging.controls.rtimagepositiony.value;
        
        post.mu = this.Imaging.controls.mupost.value;

        if (this.Imaging.controls.doubleexposurepost.value) {
          post.doublePosure = new PortalExposureTypes();
          post.doublePosure.name = "Double";
          post.doublePosure.id = 1;
          post.portImageOpenMu = this.Imaging.controls.openmupost.value;
          post.portImageDelta = this.Imaging.controls.deltapost.value;
          if (this.Imaging.controls.beammodepost.value != null) {
            post.machineEnergy = this.Imaging.controls.beammodepost.value.value.energy;
            post.isFlat = this.Imaging.controls.beammodepost.value.value.isFlattened;
          }
        }
        if (this.id != null) {
          post.referencedTreatmentBeamId = parseInt(this.id);
        }
        portalImageBeams.push(post);
      }
    }

    beamDto.portImageBeams = portalImageBeams;

    if (this.id != null) {
      beamDto.id = parseInt(this.id);
    }

    this._beamService.updateBeam(beamDto).subscribe(
      data => {
        if (data) {
          if (beamDto.name != this.nameChangePre) {
            this.nameChange.emit(true);
          }
          this._message.success(this.l('update beam successfully!'));
     
          this.form.markAsPristine();//标记form表单状态为pristine
        }
        else{
          this._message.error(this.l('update beam failed'))
        }
      }
    )
  }*******************/

}

export class ControlPointInfo {
  mlcLeafPositionBoundaries: number[];
  controlPoints: ControlPointDto[];
}

class LeafPairData {
  public value1: string;
  public value2: string;
  public index: number;
}