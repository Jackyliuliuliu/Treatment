import { Component, OnInit, Input, Output, EventEmitter, Injector } from '@angular/core';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppComponentBase } from '@shared/app-component-base';
import { BeamDto, BeamServiceProxy,PortalImageTypes,PortalExposureTypes,PortImageBeamDto,BeamGroupServiceProxy, CheckBeamGroupResult, MachineOutput, RadiationType, TechniqueType, PresciprionOutput, ToleranceDto, ToleranceServiceProxy, BeamGroupStatusDto, SetupDto, PatientPosition, PatientSetupDto, BeamGroupImageDto, FixationDeviceImageDto } from '@shared/service-proxies/service-proxies';
import {  FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { NumericalPrecisionTwo } from '@shared/validator/formControlValidators';

@Component({
  selector: 'app-editbeamimaging',
  templateUrl: './editbeamimaging.component.html',
  styleUrls: ['./editbeamimaging.component.css']
})
export class EditbeamimagingComponent extends AppComponentBase implements OnInit {

  @Input()
  beamId:string;
  @Input()
  beamGroupID:number;
  @Input()
  beamGroupList: TreeNode[];
  @Input()
  isEditPermission: boolean;
  @Output()
  public confirmaction=new EventEmitter<boolean>();

  beam: BeamDto;
  isEditBeamImaging:boolean;
  beamImagingForm:FormGroup;
  beamModeList: any[] = [];
  beamModes:any[]=[];

  imagingPositionAble:boolean;
  protralPreAble:boolean;
  protralDurAble:boolean;
  protralPostAble:boolean;
  prePortalDoubleExposure:boolean;
  postPortalDoubleExposure:boolean;
  

  constructor(injector: Injector,
    private formbuilder: FormBuilder,
    private _message: NzMessageService,
    private _beamService: BeamServiceProxy) {
    super(injector);
   }

  ngOnInit() {
    this.initImagingForm();
  }

  ngOnChanges():void{
  
  }

  editImaging():void{
    var beamGroupNode=this.beamGroupList.find(beamGroup=>beamGroup.id == this.beamGroupID);
    if(beamGroupNode!=null){
      if(beamGroupNode.isApprove){
        this.message.error("已批准射野组下的射野成像不允许编辑！");
        return;
      }
      
    }
    this.initImaging();
    
  }
  cancelEdit():void{
    this.isEditBeamImaging=false;
  }

  initImagingForm():void{

    this.beamImagingForm=this.formbuilder.group({
      imagingPositionAble:['',null],
      imagingPositionX: ['', null],
      imagingPositionY: ['', null],
      rtImagingSid: ['', null],
      protralPreAble:['',null],
      prePortalMu: ['', null],
      prePortalDoubleExposure:['',null],
      prePortalRaditionMode: ['', null],
      prePortalDelta: ['', null],
      prePortalOpenmu: ['', null],
      protralDurAble:['',null],
      duringPortalMu: ['',null],
      protralPostAble:['',null],
      postPortalMu: ['',  null],
      postPortalDoubleExposure:['',null],
      postPortalRaditionMode: ['', null],
      postPortalDelta: ['',  null],
      postPortalOpenmu: ['', null],
    });
    this.beamImagingForm.controls.imagingPositionAble.valueChanges.subscribe((value)=>this.imagingPositionAbleChange(value));
    this.beamImagingForm.controls.protralPreAble.valueChanges.subscribe((value)=>this.protralPreAbleChange(value));
    this.beamImagingForm.controls.prePortalDoubleExposure.valueChanges.subscribe((value)=>this.prePortalDoubleExposureChange(value));
    this.beamImagingForm.controls.protralDurAble.valueChanges.subscribe((value)=>this.protralDurAbleChange(value));
    this.beamImagingForm.controls.protralPostAble.valueChanges.subscribe((value)=>this.protralPostAbleChange(value));
    this.beamImagingForm.controls.postPortalDoubleExposure.valueChanges.subscribe((value)=>this.postPortalDoubleExposureChange(value));
  }

   NumericalRange(control: FormControl): any {
    var valid:boolean=true;;
    if(control.value==null){
      valid=true;
    }else{
      valid=control.value<=2 && control.value>=0;
    }
    return valid ? null : { range: true };
  }


  async initImaging(): Promise<boolean|undefined>{
    if (this.beamId == undefined || this.beamId ==null) {
      this.message.error("射野信息获取失败");
      this.isEditBeamImaging=false;
      return;
    }
    this._beamService.getBeamInfoByIndex(parseInt(this.beamId)).subscribe(
      beam_data => {
        if (null == beam_data) {
          this.isEditBeamImaging=false;
          return;
        }
        else{
          if (beam_data.beamType==undefined || beam_data.beamType == "SimpleArc" || beam_data.beamType == "ConformalArc"  || beam_data.beamType == "UARC" || beam_data.beamType == "BurstArc") 
            {
              this.message.error("射野类型为undefined|SimpleArc|ConformalArc|UARC|BurstArc时不可编辑图像");
              this.isEditBeamImaging=false;
              return;
            }
        }
        var beam: BeamDto = beam_data;
        this.beam = beam;
        if (beam.beamModes != null) {
          var beamModeList = [];
          beam.beamModes.forEach(
            beamMode => {
              if (beamMode.energy != null && beamMode.isFlattened != null) {
                if (beamMode.isFlattened) {
                  var beamModeString = beamMode.energy.toString() + "MV-" + "FF";
                }
                else {
                  var beamModeString = beamMode.energy.toString() + "MV-" + "FFF";
                }
              }
              beamModeList.push(beamModeString);
            }
          )
          this.beamModeList = beamModeList;
        }
        this.beamImagingForm.reset();
        this.imagingPositionAble=false;
        this.protralPreAble=false;
        this.protralDurAble=false;
        this.protralPostAble=false;
        this.prePortalDoubleExposure=false;
        this.postPortalDoubleExposure=false;
        if (beam.portImageBeams != null && beam.portImageBeams.length > 0) {
          this.beamImagingForm.controls.imagingPositionAble.setValue(true);
          this.imagingPositionAble=true;
          this.setValidatorImagingPositionAble();
          beam.portImageBeams.forEach(
            portImageBeam => {
              if (portImageBeam.portType != null) {
                
                //Pre
                if (portImageBeam.portType.name == "Pre") {
    
                  this.beamImagingForm.controls.imagingPositionX.setValue(portImageBeam.detectorXShift);
                  this.beamImagingForm.controls.imagingPositionY.setValue(portImageBeam.detectorYShift);
                  this.beamImagingForm.controls.rtImagingSid.setValue(portImageBeam.sid);
                  this.beamImagingForm.controls.protralPreAble.setValue(true);
                  this.beamImagingForm.controls.prePortalMu.setValue(portImageBeam.mu);
                  this.protralPreAble=true;
                  this.setValidatorProtralPreAble();
                  if (portImageBeam.doublePosure != null && portImageBeam.doublePosure.name == "Double") {
                    this.beamImagingForm.controls.prePortalDoubleExposure.setValue(true);
                    if(portImageBeam.isFlat!=null && portImageBeam.machineEnergy!=null){
                      var isFlatString=portImageBeam.isFlat? ("MV-" + "FF") : ("MV-" + "FFF");
                      this.beamImagingForm.controls.prePortalRaditionMode.setValue(portImageBeam.machineEnergy.toString()+isFlatString);
                   }
                    this.beamImagingForm.controls.prePortalDelta.setValue(portImageBeam.portImageDelta);
                    this.beamImagingForm.controls.prePortalOpenmu.setValue(portImageBeam.portImageOpenMu);
                    this.prePortalDoubleExposure=true;
                    this.setValidatorPrePortalDoubleExposure();
                  }
                }
                //During
                else if (portImageBeam.portType.name == "During") {
                  this.beamImagingForm.controls.imagingPositionX.setValue(portImageBeam.detectorXShift);
                  this.beamImagingForm.controls.imagingPositionY.setValue(portImageBeam.detectorYShift);
                  this.beamImagingForm.controls.rtImagingSid.setValue(portImageBeam.sid);
                  this.beamImagingForm.controls.protralDurAble.setValue(true);
                  this.beamImagingForm.controls.duringPortalMu.setValue(portImageBeam.mu);
                  this.protralDurAble=true;
                  this.setValidatorProtralDurAble();
                }
                //Post
                else if (portImageBeam.portType.name == "Post") {
    
                  this.beamImagingForm.controls.imagingPositionX.setValue(portImageBeam.detectorXShift);
                  this.beamImagingForm.controls.imagingPositionY.setValue(portImageBeam.detectorYShift);
                  this.beamImagingForm.controls.rtImagingSid.setValue(portImageBeam.sid);
                  this.beamImagingForm.controls.postPortalMu.setValue(portImageBeam.mu);
                  this.beamImagingForm.controls.protralPostAble.setValue(true);
                  this.protralPostAble=true;
                  this.setValidatorProtralPostAble();
                  if (portImageBeam.doublePosure != null && portImageBeam.doublePosure.name == "Double") {
                    this.beamImagingForm.controls.postPortalDoubleExposure.setValue(true);
                    this.postPortalDoubleExposure=true;
                    if(portImageBeam.isFlat!=null && portImageBeam.machineEnergy!=null){
                      var isFlatString=portImageBeam.isFlat? ("MV-" + "FF") : ("MV-" + "FFF");
                      this.beamImagingForm.controls.postPortalRaditionMode.setValue(portImageBeam.machineEnergy.toString()+isFlatString);
                    }
                    this.beamImagingForm.controls.postPortalDelta.setValue(portImageBeam.portImageDelta);
                    this.beamImagingForm.controls.postPortalOpenmu.setValue(portImageBeam.portImageOpenMu);
                    this.setValidatorPostPortalDoubleExposure();
                  }
                }
              }
            }
          )
        }
        this.isEditBeamImaging=true;
      }
    )
  }
  
  setValidatorImagingPositionAble():void{
    if(this.imagingPositionAble){
      this.beamImagingForm.controls.imagingPositionX.enable();
      this.beamImagingForm.controls.imagingPositionY.enable();
      this.beamImagingForm.controls.rtImagingSid.enable();
      this.beamImagingForm.controls.imagingPositionX.setValidators([NumericalPrecisionTwo,Validators.required]);
      this.beamImagingForm.controls.imagingPositionY.setValidators([NumericalPrecisionTwo,Validators.required]);
      this.beamImagingForm.controls.rtImagingSid.setValidators([NumericalPrecisionTwo,Validators.required,Validators.max(155),Validators.min(95)]);
     
      this.beamImagingForm.controls.imagingPositionX.markAsUntouched();
      this.beamImagingForm.controls.imagingPositionY.markAsUntouched();
      this.beamImagingForm.controls.rtImagingSid.markAsUntouched();
    }else{
      this.beamImagingForm.controls.imagingPositionX.setValue(null);
      this.beamImagingForm.controls.imagingPositionY.setValue(null);
      this.beamImagingForm.controls.rtImagingSid.setValue(null);
      this.beamImagingForm.controls.prePortalMu.setValue(null);
      this.beamImagingForm.controls.prePortalRaditionMode.setValue(null);
      this.beamImagingForm.controls.prePortalDelta.setValue(null);
      this.beamImagingForm.controls.prePortalOpenmu.setValue(null);
      this.beamImagingForm.controls.duringPortalMu.setValue(null);
      this.beamImagingForm.controls.postPortalMu.setValue(null);
      this.beamImagingForm.controls.postPortalRaditionMode.setValue(null);
      this.beamImagingForm.controls.postPortalDelta.setValue(null);
      this.beamImagingForm.controls.postPortalOpenmu.setValue(null);
      this.beamImagingForm.controls.imagingPositionX.disable();
      this.beamImagingForm.controls.imagingPositionY.disable();
      this.beamImagingForm.controls.rtImagingSid.disable();
      this.beamImagingForm.controls.prePortalMu.disable();
      this.beamImagingForm.controls.prePortalRaditionMode.disable();
      this.beamImagingForm.controls.prePortalDelta.disable();
      this.beamImagingForm.controls.prePortalOpenmu.disable();
      this.beamImagingForm.controls.duringPortalMu.disable();
      this.beamImagingForm.controls.postPortalMu.disable();
      this.beamImagingForm.controls.postPortalRaditionMode.disable();
      this.beamImagingForm.controls.postPortalDelta.disable();
      this.beamImagingForm.controls.postPortalOpenmu.disable();
      this.beamImagingForm.controls.imagingPositionX.clearValidators();
      this.beamImagingForm.controls.imagingPositionY.clearValidators();
      this.beamImagingForm.controls.rtImagingSid.clearValidators();
      this.beamImagingForm.controls.prePortalMu.clearValidators();
      this.beamImagingForm.controls.prePortalRaditionMode.clearValidators();
      this.beamImagingForm.controls.prePortalDelta.clearValidators();
      this.beamImagingForm.controls.prePortalOpenmu.clearValidators();
      this.beamImagingForm.controls.duringPortalMu.clearValidators();
      this.beamImagingForm.controls.postPortalMu.clearValidators();
      this.beamImagingForm.controls.postPortalRaditionMode.clearValidators();
      this.beamImagingForm.controls.postPortalDelta.clearValidators();
      this.beamImagingForm.controls.postPortalOpenmu.clearValidators();
    }
  }

  imagingPositionAbleChange(event : any):void{
    if(!this.beamImagingForm.dirty){
      return;
    }
    if(event !=undefined && event!=null){
      this.imagingPositionAble=event;
      this.setValidatorImagingPositionAble();
    }else{
      return;
    }
  }

  setValidatorProtralPreAble():void{
    if(this.protralPreAble){
      this.beamImagingForm.controls.prePortalMu.enable();
      this.beamImagingForm.controls.prePortalMu.setValidators(NumericalPrecisionTwo);
      this.beamImagingForm.controls.prePortalMu.markAsUntouched();
    }else{
      this.beamImagingForm.controls.prePortalMu.setValue(null);
      this.beamImagingForm.controls.prePortalMu.disable();
      this.beamImagingForm.controls.prePortalMu.clearValidators();
      this.beamImagingForm.controls.prePortalRaditionMode.setValue(null);
      this.beamImagingForm.controls.prePortalDelta.setValue(null);
      this.beamImagingForm.controls.prePortalOpenmu.setValue(null);
      this.beamImagingForm.controls.prePortalRaditionMode.disable();
      this.beamImagingForm.controls.prePortalDelta.disable();
      this.beamImagingForm.controls.prePortalOpenmu.disable();
      this.beamImagingForm.controls.prePortalRaditionMode.clearValidators();
      this.beamImagingForm.controls.prePortalDelta.clearValidators();
      this.beamImagingForm.controls.prePortalOpenmu.clearValidators();
    }
  }
  
  protralPreAbleChange(event : any):void{
    if(!this.beamImagingForm.dirty){
      return;
    }
    if(event !=undefined && event!=null){
      this.protralPreAble=event;
      this.setValidatorProtralPreAble();
    }
  }


  setValidatorPrePortalDoubleExposure():void{
    if(this.prePortalDoubleExposure){
        this.beamImagingForm.controls.prePortalDelta.enable();
        this.beamImagingForm.controls.prePortalOpenmu.enable();
        this.beamImagingForm.controls.prePortalRaditionMode.enable();
        this.beamImagingForm.controls.prePortalRaditionMode.setValidators(Validators.required);
        this.beamImagingForm.controls.prePortalDelta.setValidators([NumericalPrecisionTwo,Validators.required]);
        this.beamImagingForm.controls.prePortalOpenmu.setValidators([NumericalPrecisionTwo,Validators.required,this.NumericalRange]);
        this.beamImagingForm.controls.prePortalRaditionMode.markAsUntouched();
        this.beamImagingForm.controls.prePortalDelta.markAsUntouched();
        this.beamImagingForm.controls.prePortalOpenmu.markAsUntouched();
    }else{
      this.beamImagingForm.controls.prePortalRaditionMode.setValue(null);
      this.beamImagingForm.controls.prePortalDelta.setValue(null);
      this.beamImagingForm.controls.prePortalOpenmu.setValue(null);
      this.beamImagingForm.controls.prePortalRaditionMode.disable();
      this.beamImagingForm.controls.prePortalDelta.disable();
      this.beamImagingForm.controls.prePortalOpenmu.disable();
      this.beamImagingForm.controls.prePortalRaditionMode.clearValidators();
      this.beamImagingForm.controls.prePortalDelta.clearValidators();
      this.beamImagingForm.controls.prePortalOpenmu.clearValidators();
    }
  }

  prePortalDoubleExposureChange(event : any):void{
    if(!this.beamImagingForm.dirty){
      return;
    }
    if(event !=undefined && event!=null && this.beamImagingForm.controls.prePortalDoubleExposure.dirty){
      this.prePortalDoubleExposure=event;
      this.setValidatorPrePortalDoubleExposure();
    }
  }

  setValidatorProtralDurAble():void{
    if(this.protralDurAble){
      this.beamImagingForm.controls.duringPortalMu.enable();
      this.beamImagingForm.controls.duringPortalMu.setValidators(NumericalPrecisionTwo);
      this.beamImagingForm.controls.duringPortalMu.markAsUntouched();
    }else{
      this.beamImagingForm.controls.duringPortalMu.setValue(null);
      this.beamImagingForm.controls.duringPortalMu.disable();
      this.beamImagingForm.controls.duringPortalMu.clearValidators();
    }
  }

  protralDurAbleChange(event : any):void{
    if(!this.beamImagingForm.dirty){
      return;
    }
    if(event !=undefined && event!=null){
      this.protralDurAble=event;
      this.setValidatorProtralDurAble();
    }
  }

  setValidatorProtralPostAble():void{
    if(this.protralPostAble){
      this.beamImagingForm.controls.postPortalMu.enable();
      this.beamImagingForm.controls.postPortalMu.setValidators(NumericalPrecisionTwo);
      this.beamImagingForm.controls.postPortalMu.markAsUntouched();
    }else{
      this.beamImagingForm.controls.postPortalMu.setValue(null);
      this.beamImagingForm.controls.postPortalMu.disable();
      this.beamImagingForm.controls.postPortalMu.clearValidators();
      this.beamImagingForm.controls.postPortalRaditionMode.setValue(null);
      this.beamImagingForm.controls.postPortalDelta.setValue(null);
      this.beamImagingForm.controls.postPortalOpenmu.setValue(null);
      this.beamImagingForm.controls.postPortalRaditionMode.disable();
      this.beamImagingForm.controls.postPortalDelta.disable();
      this.beamImagingForm.controls.postPortalOpenmu.disable();
      this.beamImagingForm.controls.postPortalRaditionMode.clearValidators();
      this.beamImagingForm.controls.postPortalDelta.clearValidators();
      this.beamImagingForm.controls.postPortalOpenmu.clearValidators();
    }
  }

  protralPostAbleChange(event : any):void{
    if(!this.beamImagingForm.dirty){
      return;
    }
    if(event !=undefined && event!=null){
      this.protralPostAble=event;
      this.setValidatorProtralPostAble();
    }
  }

  setValidatorPostPortalDoubleExposure():void{
    if(this.postPortalDoubleExposure){
      this.beamImagingForm.controls.postPortalDelta.enable();
        this.beamImagingForm.controls.postPortalOpenmu.enable();
        this.beamImagingForm.controls.postPortalRaditionMode.enable();
        this.beamImagingForm.controls.postPortalRaditionMode.setValidators(Validators.required);
        this.beamImagingForm.controls.postPortalDelta.setValidators([NumericalPrecisionTwo,Validators.required]);
        this.beamImagingForm.controls.postPortalOpenmu.setValidators([NumericalPrecisionTwo,Validators.required,this.NumericalRange]);
        this.beamImagingForm.controls.postPortalRaditionMode.markAsUntouched();
        this.beamImagingForm.controls.postPortalDelta.markAsUntouched();
        this.beamImagingForm.controls.postPortalOpenmu.markAsUntouched();
    }else{
      this.beamImagingForm.controls.postPortalRaditionMode.setValue(null);
        this.beamImagingForm.controls.postPortalDelta.setValue(null);
        this.beamImagingForm.controls.postPortalOpenmu.setValue(null);
        this.beamImagingForm.controls.postPortalRaditionMode.disable();
        this.beamImagingForm.controls.postPortalDelta.disable();
        this.beamImagingForm.controls.postPortalOpenmu.disable();
        this.beamImagingForm.controls.postPortalRaditionMode.clearValidators();
        this.beamImagingForm.controls.postPortalDelta.clearValidators();
        this.beamImagingForm.controls.postPortalOpenmu.clearValidators();
    }
  }

  postPortalDoubleExposureChange(event : any):void{
    if(!this.beamImagingForm.dirty){
      return;
    }
    if(event !=undefined && event!=null && this.beamImagingForm.controls.postPortalDoubleExposure.dirty){
      this.postPortalDoubleExposure=event;
      this.setValidatorPostPortalDoubleExposure();
    }
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

  submitEdit():void{
    var updateBeamDto:BeamDto=this.beam;
    if(!this.imagingPositionAble){
      updateBeamDto.portImageBeams=null;
    }else{
      if(!this.protralPreAble && !this.protralDurAble && !this.protralPostAble){
        this._message.error("未选择在治疗前、中、后任一个，成像位置和SID值将不会保存");
        return;
      }
      var protralList:PortImageBeamDto[]=[];
      var protral=new PortImageBeamDto();
      var protralDur=new PortImageBeamDto();
      var protralPost=new PortImageBeamDto();
      protral.referencedTreatmentBeamId=this.beam.id;
      protralDur.referencedTreatmentBeamId=this.beam.id;
      protralPost.referencedTreatmentBeamId=this.beam.id;
      if(this.beamImagingForm.controls.imagingPositionX.value!=null){
        protral.detectorXShift=this.beamImagingForm.controls.imagingPositionX.value;
        protralDur.detectorXShift=this.beamImagingForm.controls.imagingPositionX.value;
        protralPost.detectorXShift=this.beamImagingForm.controls.imagingPositionX.value;
      }
      if(this.beamImagingForm.controls.imagingPositionY.value!=null){
        protral.detectorYShift=this.beamImagingForm.controls.imagingPositionY.value;
        protralDur.detectorYShift=this.beamImagingForm.controls.imagingPositionY.value;
        protralPost.detectorYShift=this.beamImagingForm.controls.imagingPositionY.value;
      }
      if(this.beamImagingForm.controls.rtImagingSid.value!=null){
        protral.sid=this.beamImagingForm.controls.rtImagingSid.value;
        protralDur.sid=this.beamImagingForm.controls.rtImagingSid.value;
        protralPost.sid=this.beamImagingForm.controls.rtImagingSid.value;
      }
      
      if(this.protralPreAble){
        protral.portType =new PortalImageTypes();
        protral.portType.id=0;
        protral.portType.name="Pre";
        protral.mu=this.beamImagingForm.controls.prePortalMu.value;
        if(this.prePortalDoubleExposure){
          protral.doublePosure= new PortalExposureTypes();
          protral.doublePosure.name = "Double";
          protral.doublePosure.id=1;
         
          if (this.beamImagingForm.controls.prePortalRaditionMode.value != null) {
            var energyNumber=this.getEnergyFromBeamModeString(this.beamImagingForm.controls.prePortalRaditionMode.value);
            if(energyNumber!=null){
              protral.machineEnergy = energyNumber;
              protral.isFlat = this.getIsFlatFromBeamModeString(this.beamImagingForm.controls.prePortalRaditionMode.value);
            }
          }
          if(this.beamImagingForm.controls.prePortalDelta.value!=null){
            protral.portImageDelta=this.beamImagingForm.controls.prePortalDelta.value;
          }
          if(this.beamImagingForm.controls.prePortalOpenmu.value!=null){
            protral.portImageOpenMu=this.beamImagingForm.controls.prePortalOpenmu.value;
          }
          
        }else{
           //beamMode
          protral.portImageDelta=null;
          protral.portImageOpenMu=null;
        }
        protralList.push(protral);
      }
      if(this.protralDurAble){
        protralDur.portType =new PortalImageTypes();
        protralDur.portType.name="During";
        protralDur.portType.id=1;
        if(this.beamImagingForm.controls.duringPortalMu.value!=null){
          protralDur.mu=this.beamImagingForm.controls.duringPortalMu.value;
        }
        //beamMode
        protralDur.portImageDelta=null;
        protralDur.portImageOpenMu=null;
        protralList.push(protralDur);
      }
      if(this.protralPostAble){
        protralPost.portType =new PortalImageTypes();
        protralPost.portType.name="Post";
        protralPost.portType.id=2;
        if(this.beamImagingForm.controls.postPortalMu.value!=null){
          protralPost.mu=this.beamImagingForm.controls.postPortalMu.value;
        }
        
        if(this.postPortalDoubleExposure){
          protralPost.doublePosure= new PortalExposureTypes();
          protralPost.doublePosure.name = "Double";
          protralPost.doublePosure.id=1;
         
          if(this.beamImagingForm.controls.postPortalRaditionMode.value!=null){
            var energyNumber=this.getEnergyFromBeamModeString(this.beamImagingForm.controls.postPortalRaditionMode.value);
            if(energyNumber!=null){
              protralPost.machineEnergy = energyNumber;
              protralPost.isFlat = this.getIsFlatFromBeamModeString(this.beamImagingForm.controls.postPortalRaditionMode.value);
            }
             
          }
          if(this.beamImagingForm.controls.postPortalDelta.value){
            protralPost.portImageDelta=this.beamImagingForm.controls.postPortalDelta.value;
          }
          if(this.beamImagingForm.controls.postPortalOpenmu.value){
            protralPost.portImageOpenMu=this.beamImagingForm.controls.postPortalOpenmu.value;
          }
          
        }else{
           //beamMode
           protralPost.portImageDelta=null;
           protralPost.portImageOpenMu=null;
        }
        protralList.push(protralPost);
      }
      updateBeamDto.portImageBeams=protralList;
    }

    this._beamService.updatePortImageBeam(updateBeamDto).subscribe(
      data => {
        if (data) {
          this.confirmaction.emit(true);
          this._message.success(this.l('update beam successfully!'));
          this.isEditBeamImaging=false;
        }
        else{
          this._message.error(this.l('update beam failed'))
        }
      }
    )
  }

}
