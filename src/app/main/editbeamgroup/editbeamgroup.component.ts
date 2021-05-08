import { Component, OnInit, Input, Output, EventEmitter, Injector } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd';
import { AppComponentBase } from '@shared/app-component-base';
import { BeamGroupDto, BeamGroupServiceProxy, MachineOutput, RadiationType, TechniqueType, PresciprionOutput, ToleranceDto, ToleranceServiceProxy, BeamGroupStatusDto, SetupDto, PatientPosition, PatientSetupDto, BeamGroupImageDto, FixationDeviceImageDto, BeamsTreatmentScheduleServiceProxy, TreatmentScheduleSessionDto } from '@shared/service-proxies/service-proxies';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { NumericalPrecisionTwo,checkBackslash } from '@shared/validator/formControlValidators';

@Component({
  selector: 'app-editbeamgroup',
  templateUrl: './editbeamgroup.component.html',
  styleUrls: ['./editbeamgroup.component.css']
})
export class EditbeamgroupComponent extends AppComponentBase implements OnInit {
  @Input()
  beamGroupID: string;
  @Input()
  patientID: number;
  @Input()
  beamGroupNode: TreeNode;
  @Input()
  beamGroupList: TreeNode[];
  @Input()
  isEditPermission: boolean;
  @Output()
  public confirmactionBeamgroup = new EventEmitter<boolean>();

  isEditBeamgroup: boolean = false;
  isSaving: boolean;
  isApproved: boolean;
  isTmsCreated:boolean;
  beamGroupForm: FormGroup;
  beamGroupDto: BeamGroupDto;
  machineList: MachineOutput[] = [];
  allMachineInfoList: MachineOutput[] = [];
  patientPositionList: any[] = [];
  gatingModelList: any[] = [];
  PresciprionInfoList: PresciprionOutput[] = [];
  coureseList: string[] = [];
  tolerances: ToleranceDto[] = [];
  toleranceDetails:ToleranceDto;
  techniqueTypeInfoList: TechniqueType[] = [];
  radiationTypeInfoList: RadiationType[] = [];
  
  fractionChangeNumber: boolean;
  fractionNumberChangeNumber: boolean;
  totalDoseChangeNumber: boolean;
  isGatingControl: boolean = false;

  initialBeamGroupName: string;
  unmodifiedSessionNum: number;

  constructor(
    injector: Injector,
    private formbuilder: FormBuilder,
    private _toleranceService: ToleranceServiceProxy,
    private _beamGroupService: BeamGroupServiceProxy,
    private nzmessage: NzMessageService,
    private _beamsTreatmentScheduleServiceProxy: BeamsTreatmentScheduleServiceProxy,) {
    super(injector);
  }

  ngOnChanges(): void {
    
    this.initBeamGroupForm();
  }

  ngOnInit(): void {
    

  }

  editBeamGroup(): void {
    if(this.beamGroupNode.isApprove){
      this.message.error("已批准的射野组不允许编辑！");
      this.isEditBeamgroup = false;
      return;
    }else{
      this.isTmsCreated=true;
      this.fractionChangeNumber = false;
      this.fractionNumberChangeNumber = false;
      this.totalDoseChangeNumber = false;
      this.initData();
    }
  }

  cancelEditBeamgroup(): void {
    this.isEditBeamgroup = false;
    this.clearFormError();
  }

  clearFormError(): void {
    for (const field in this.FormErrors) {
      this.FormErrors[field] = '';
    }
  }

  initBeamGroupForm(): void {


    //判断是否为tms创建-初始化不同参数的表单，修改页面代码
    this.beamGroupForm = this.formbuilder.group({
      beamgroupname: ['', [Validators.required, Validators.maxLength(64) , checkBackslash]],
      machine: ['', [Validators.required]],
      radiationtype: ['', [Validators.required]],
      techniquetype: ['', [Validators.required]],
      tolerance: [null, null],
      description: ['', [Validators.maxLength(1024) ,checkBackslash]],
      chooseTolerance: [null, null],

      fractiondose: ['', [Validators.required, NumericalPrecisionTwo]],
      fractions: [null, null],
      totoaldose: ['', [Validators.required, NumericalPrecisionTwo]],

      relatedprescription: [null, null],
      relatedcourse: ['', null],
      patientposition: ['', [Validators.required]],
      isgatingControl: [false, null],
      gatingModelControl: ['', null],
    });
    this.beamGroupForm.controls.isgatingControl.valueChanges.subscribe((value)=>this.changeGatingStatus(value));
    this.beamGroupForm.controls.relatedprescription.valueChanges.subscribe((event)=>this.changePrescription(event));
    this.beamGroupForm.controls.fractions.valueChanges.subscribe(value=>this.fractionNumberModelChange(value));
    this.beamGroupForm.controls.fractiondose.valueChanges.subscribe(value=>this.fractiondoseModelChange(value));
    this.beamGroupForm.controls.totoaldose.valueChanges.subscribe(value=>this.totalModelChange(value));
    this.beamGroupForm.controls.tolerance.valueChanges.subscribe(event=>this.changeTolerance(event));
    this.beamGroupForm.controls.chooseTolerance.valueChanges.subscribe(data=>this.changeChooseSameTolerance(data));
    this.beamGroupForm.controls.techniquetype.valueChanges.subscribe(data=>this.techniquetypeSelcetedChanged());
    this.beamGroupForm.controls.machine.valueChanges.subscribe(data=>this.machineNameSelcetedChanged(data));
    this.beamGroupForm.valueChanges.subscribe(data => this.onValueChanged(data));
    this.onValueChanged();
  }
  
  
 
  initData(): void {
    if (this.beamGroupID === null || this.beamGroupID === undefined) {
      this.message.error("射野组信息获取失败");
      this.isEditBeamgroup = false;
      return;
    } else {
      this._beamGroupService.getBeamGroupInfoByIndex(parseInt(this.beamGroupID))
        .pipe()
        .subscribe(
          (result: BeamGroupDto) => {
            if(result!=undefined && result !=null){
              this.initViewData(result);
              this.beamGroupDto = result;
            }
          }
        )
    }
    this.isEditBeamgroup = true;
  }
  

  async initViewData(beamGroup: BeamGroupDto): Promise<boolean | undefined> {
    this.machineList = [];
    this.allMachineInfoList = [];
    this.patientPositionList = [];
    this.gatingModelList = [];
    this.PresciprionInfoList = [];
    this.coureseList = [];
    this.tolerances = [];
    this.techniqueTypeInfoList = [];
    this.radiationTypeInfoList = [];
    this.isGatingControl = false;
    this.beamGroupForm.reset();
    if (beamGroup === null || beamGroup === undefined) {
      this.message.error("射野组信息获取失败");
      this.isEditBeamgroup = false;
      return;
    } else {
      this.addDefaultListValue();
      this.initialBeamGroupName=beamGroup.name;
      this.beamGroupForm.controls.beamgroupname.setValue(beamGroup.name);
      this.beamGroupForm.controls.radiationtype.setValue(beamGroup.radiationType);
      this.beamGroupForm.controls.techniquetype.setValue(beamGroup.techniqueType);
      this.beamGroupForm.controls.description.setValue(beamGroup.description);
      this.beamGroupForm.controls.fractions.setValidators([Validators.required, Validators.min(this.unmodifiedSessionNum)]);
      this.beamGroupForm.controls.fractions.setValue(beamGroup.fractionNumber);
      this.beamGroupForm.controls.totoaldose.setValue(beamGroup.totalDose);
      
      if (beamGroup.fractionDose === null || beamGroup.fractionDose === undefined || beamGroup.fractionDose === 0) {
        if (beamGroup.fractionNumber !== null && beamGroup.fractionNumber !== undefined && beamGroup.fractionNumber !== 0) {
          if (beamGroup.totalDose !== null && beamGroup.totalDose !== undefined && beamGroup.totalDose !== 0) {
            beamGroup.fractionDose = beamGroup.totalDose / beamGroup.fractionNumber;
          }
        }
      }
      this.beamGroupForm.controls.fractiondose.setValue(beamGroup.fractionDose);
      if (beamGroup.setupList != undefined && beamGroup.setupList != null && beamGroup.setupList.length > 0) {
        var setupInfo = beamGroup.setupList[0];
        if (setupInfo.patientPosition != undefined && setupInfo.patientPosition != null) {
          this.beamGroupForm.controls.patientposition.setValue(setupInfo.patientPosition.name);
        }
      }
      if (beamGroup.isGating) {
        this.beamGroupForm.controls.isgatingControl.setValue(true);
        this.isGatingControl = true;
        if(beamGroup.gatingModel == 0 || beamGroup.gatingModel==1){
          var gating=this.gatingModelList.find(item=>item.value == beamGroup.gatingModel);
          if(gating!=undefined && gating!=null){
            this.beamGroupForm.controls.gatingModelControl.setValue(gating.label);
          }
          
        }
      }
      this.getToleranceList();
      this.GetAllPrescriptionInfo(beamGroup);
      var ret = await this.getAllMachineInfo();
      this.beamGroupForm.controls.machine.setValue(this.getMachineOrNew());
      if(!this.beamGroupNode.isCreateByTms){
        this.isTmsCreated=false;
        this.updateFormByUnTmsAccess();
      }
    }
  }

  updateFormByUnTmsAccess():void{
    if(this.beamGroupForm!=null && this.beamGroupForm.controls !=null){
      //只允许修改name，description，beamDose，tolerance，relate course/site/prescrition,fraction no, Iso ceneter ,gating
      this.beamGroupForm.controls.machine.disable();
      this.beamGroupForm.controls.machine.clearValidators();

      this.beamGroupForm.controls.radiationtype.disable();
      this.beamGroupForm.controls.radiationtype.clearValidators();

      this.beamGroupForm.controls.techniquetype.disable();
      this.beamGroupForm.controls.techniquetype.clearValidators();
      
      this.beamGroupForm.controls.totoaldose.disable();
      this.beamGroupForm.controls.totoaldose.clearValidators();

      this.beamGroupForm.controls.fractiondose.disable();
      this.beamGroupForm.controls.fractiondose.clearValidators();

      this.beamGroupForm.controls.patientposition.disable();
      this.beamGroupForm.controls.patientposition.clearValidators();
    }
  }

  newRaditionType(): RadiationType {
    if (this.beamGroupDto.radiationType != undefined && this.beamGroupDto.radiationType != null) {
      var radiationType = this.radiationTypeInfoList.find(item => item.id === this.beamGroupDto.radiationType.id);
      if (radiationType === null || radiationType === undefined) {
        var newRadiationType = new RadiationType();
        newRadiationType.name = this.beamGroupDto.radiationType.name;
        newRadiationType.id = this.beamGroupDto.radiationType.id;
        radiationType = newRadiationType;
      }
      return radiationType;
    }
    return null;
  }
  newTechniqueType(): TechniqueType {
    if (this.beamGroupDto.techniqueType != undefined && this.beamGroupDto.techniqueType != null) {
      var techniqueType = this.techniqueTypeInfoList.find(item => item.id === this.beamGroupDto.techniqueType.id);
      if (techniqueType === null || techniqueType === undefined) {
        var newTechniqueType = new TechniqueType();
        newTechniqueType.name = this.beamGroupDto.techniqueType.name;
        newTechniqueType.id = this.beamGroupDto.techniqueType.id;
        techniqueType = newTechniqueType;
      }
      return techniqueType;
    }
    return null;
  }

  newMachine(): MachineOutput {
    if (this.beamGroupDto.machineName != undefined && this.beamGroupDto.machineName != null) {
      var unvalidMachine = new MachineOutput();
      unvalidMachine.machineName = this.beamGroupDto.machineName;
      unvalidMachine.isActived = false;
      unvalidMachine.isApproved = false;
      unvalidMachine.radiationList = this.radiationTypeInfoList;
      unvalidMachine.techniqueTypeList = this.techniqueTypeInfoList;
      return unvalidMachine;
    }
    return null;
  }

  getMachineOrNew(): MachineOutput {
    var returndMachine: MachineOutput = null;
    if (this.beamGroupDto.machineName != undefined && this.beamGroupDto.machineName != null) {
      var machineIndex = this.machineList.findIndex(item => item.machineName.indexOf(this.beamGroupDto.machineName) > -1);
      if (machineIndex > -1) {
        returndMachine = this.machineList.find(item => item.machineName == this.beamGroupDto.machineName);
        this.addTechniqueAndRaditionToMachine(returndMachine);
      } else {
        var machine = this.allMachineInfoList.findIndex(item => item.machineName.indexOf(this.beamGroupDto.machineName) > -1);
        if (machine > -1) {
          returndMachine = this.allMachineInfoList.find(item => item.machineName == this.beamGroupDto.machineName);
          this.addTechniqueAndRaditionToMachine(returndMachine);
        } else {
          this.radiationTypeInfoList.push(this.newRaditionType());
          var technique=this.newTechniqueType()
          if ( technique !=null && (technique.name === "3DCRT" || technique.name === "SimpleArc")) {
            this.techniqueTypeInfoList.push(technique);
          }
          
          returndMachine = this.newMachine();
        }
        this.machineList.push(returndMachine);
      }
    }
    return returndMachine;
  }

  addTechniqueAndRaditionToMachine(machine: MachineOutput): void {
    if (this.beamGroupDto.radiationType != undefined && this.beamGroupDto.radiationType != null) {
      if (machine.radiationList == null || machine.radiationList.length < 1) {
        this.radiationTypeInfoList.push(this.newRaditionType());
        machine.radiationList = this.radiationTypeInfoList;
      } else {
        if ((this.radiationTypeInfoList == undefined || this.radiationTypeInfoList == null || this.radiationTypeInfoList.length < 1)) {
          this.radiationTypeInfoList = machine.radiationList;
        }
      }
    }
    if (this.beamGroupDto.techniqueType != undefined && this.beamGroupDto.techniqueType != null) {
      if (machine.techniqueTypeList == null || machine.techniqueTypeList.length < 1) {
        var technique= this.newTechniqueType()
        if(technique!=null && (technique.name === "3DCRT" || technique.name === "SimpleArc")){
          this.techniqueTypeInfoList.push(technique);
        }
        machine.techniqueTypeList = this.techniqueTypeInfoList;
      } else {
        if ((this.techniqueTypeInfoList == undefined || this.techniqueTypeInfoList == null || this.techniqueTypeInfoList.length < 1)) {
          if(machine.techniqueTypeList!=undefined && machine.techniqueTypeList!=null){
            var technique=machine.techniqueTypeList.find(item=> item.name=="3DCRT");
            if(technique!=undefined &&  technique!=null){
              this.techniqueTypeInfoList.push(technique);
            }
            var techniqueSimpleArc=machine.techniqueTypeList.find(item=> item.name=="SimpleArc");
            if(techniqueSimpleArc!=undefined &&  techniqueSimpleArc!=null){
              this.techniqueTypeInfoList.push(techniqueSimpleArc);
            }
          }
        }
      }
    }
  }

  addDefaultListValue(): void {
    this.getpatientPositionList();
    this.gatingModelList = [{ label: "振幅", value: 0 }, { label: "时相", value: 1 }];
    //this.coureseList = [{ label: "疗程1", value: 0 }, { label: "疗程2", value: 1 }];
    //this.getPresciprionInfoList();
  }

  getpatientPositionList(): void {
    var retHFS = new PatientPosition();
    retHFS.id = 0;
    retHFS.name = "HFS";
    var retHFP = new PatientPosition();
    retHFP.id = 1;
    retHFP.name = "HFP";
    var retFFS = new PatientPosition();
    retFFS.id = 1;
    retFFS.name = "FFS";
    var retFFP = new PatientPosition();
    retFFP.id = 1;
    retFFP.name = "FFP";
    this.patientPositionList.push(retHFS);
    this.patientPositionList.push(retHFP);
    this.patientPositionList.push(retFFS);
    this.patientPositionList.push(retFFP);
  }

  getPresciprionInfoList(): void {
    var lungPrescript = new PresciprionOutput();
    lungPrescript.index = 0;
    lungPrescript.siteName = "Lung";
    lungPrescript.courseName = "疗程1";
    var breastPrescript = new PresciprionOutput();
    breastPrescript.index = 1;
    breastPrescript.siteName = "Breast";
    breastPrescript.courseName = "疗程2";
    this.PresciprionInfoList.push(lungPrescript);
    this.PresciprionInfoList.push(breastPrescript);
  }

  async getToleranceList() : Promise<boolean> {
    try{
      if(this.beamGroupDto !=undefined && this.beamGroupDto!=null){
        this._toleranceService.getAllTolerance().subscribe(
          data => {
            if (data != null) {
              var toleranceListall: ToleranceDto[] = data;
              if (this.beamGroupDto.toleranceId == null) {
                this.beamGroupForm.controls.chooseTolerance.setValue(false);
              }
              else {
                toleranceListall.forEach(tolerance => {
                  if (tolerance.id == this.beamGroupDto.toleranceId  && tolerance.technique == this.beamGroupDto.techniqueType.id) {
                    this.beamGroupForm.controls.chooseTolerance.setValue(true);
                    this.beamGroupForm.controls.tolerance.setValue(tolerance);
                    this.toleranceDetails=tolerance;
                    this.getTolerancesByTechnique(this.beamGroupDto.techniqueType.name);
                  }
                });
              }
            }
          }
        )
        return true;
      }else{
        return false;
      }
    }catch(error){
      console.log(error);
    }
  }

   getTolerancesByTechnique(technique :any): void{
   try{
      if (technique == null || technique == undefined) { 
        return;
      }else{
        var techniqueName=null;
        if(technique.id!=undefined){
          techniqueName=technique.name;
        }else{
          techniqueName=technique;
        }
        var techniqueId=-1;
        if(this.techniqueTypeInfoList!=undefined && this.techniqueTypeInfoList!=null && this.techniqueTypeInfoList.length>0){
          var techniqueTemp=this.techniqueTypeInfoList.find(item=>item.name==techniqueName);
          if(techniqueTemp!=undefined && techniqueTemp!=null){
            techniqueId=techniqueTemp.id;
            if(techniqueId!=-1){
              this._toleranceService.getAllTolerance().subscribe(
                data => {
                  if (data != undefined && data!=null && data.length>0) {
                  data.forEach(tolerance=>{
                      if (null == technique || undefined == technique)
                      {
                        this.tolerances.push(tolerance);
                      }
                      else if (tolerance.technique == techniqueId) {
                        this.tolerances.push(tolerance);
                      }
                    })
                  }
                }
              );
            }
          }
        }
      }
     
    }catch(error){
      console.log(error);
    }
  }

  GetAllPrescriptionInfo(beamGroup: BeamGroupDto): void {
    try {
      if (this.patientID === null || this.patientID === undefined || Number.isNaN(this.patientID)) { return; }
      this._beamGroupService.getAllPrescriptionByPatientId(this.patientID)
        .pipe()
        .subscribe((result: PresciprionOutput[]) => {
          this.PresciprionInfoList = result;
          var selectedPrescriptionItem = this.PresciprionInfoList.find(item => item.index === beamGroup.relatedPrescriptionId);
          if (selectedPrescriptionItem != undefined && selectedPrescriptionItem != null) {
            this.beamGroupForm.controls.relatedprescription.setValue(selectedPrescriptionItem.index);
            this.beamGroupForm.controls.relatedcourse.setValue(selectedPrescriptionItem.courseName);
            this.coureseList.push(selectedPrescriptionItem.courseName);
          }
        })
    }
    catch (error) {
      console.log(error)
    }
  }

  async getAllMachineInfo(): Promise<boolean> {
    try {
      return await this._beamGroupService.getAllMachines()
        .toPromise()
        .then((result: MachineOutput[]) => {
          if (result === null || result === undefined) { return false; }
          this.allMachineInfoList = result;
          for (let i = 0; i < result.length; i++) {
            var machineitem = result[i];
            if (machineitem === null || machineitem === undefined) { continue; }
            if (machineitem.isActived && machineitem.isApproved) {
              this.machineList.push(machineitem);
            }
          }
          return true;
        })
    }
    catch (error) {
      console.log(error);
    }
  }

  machineNameSelcetedChanged(event:any) :void{
    
      if (event === null || event === undefined || !this.beamGroupForm.controls.machine.dirty) { return; }
      if (this.machineList === null || this.machineList === undefined || this.machineList.length === 0) {
        return;
      }
      this.radiationTypeInfoList=[];
      this.techniqueTypeInfoList=[];
      this.tolerances=[];
      this.beamGroupDto.isMachineValide = true;
      //对于dicom导入的machine不作处理，只显示，但dicom导入的machine会在赋值初期把值放入machineList中
      var newSelectedMachine = this.machineList.find(item => item.machineName == event);
      if (newSelectedMachine != null && newSelectedMachine != undefined) {
        this.radiationTypeInfoList=newSelectedMachine.radiationList;
        if(this.radiationTypeInfoList !=undefined && this.radiationTypeInfoList!=null && this.radiationTypeInfoList.length>0){
          this.beamGroupForm.controls.radiationtype.setValue(this.radiationTypeInfoList[0]);
        }else{
          this.beamGroupForm.controls.radiationtype.setValue(null);
        }
        if(newSelectedMachine.techniqueTypeList!=undefined && newSelectedMachine.techniqueTypeList!=null && newSelectedMachine.techniqueTypeList.length>0){
          newSelectedMachine.techniqueTypeList.forEach(item => {
            if (item!=null && (item.name === "3DCRT" || item.name === "SimpleArc")) {
              this.techniqueTypeInfoList.push(item);
            }
            if(this.techniqueTypeInfoList!=null && this.techniqueTypeInfoList.length>0){
            this.beamGroupForm.controls.techniquetype.setValue(this.techniqueTypeInfoList[0]);
            }else{
            this.beamGroupForm.controls.techniquetype.setValue(null);
            }
            
          });
        }else{
          this.beamGroupForm.controls.techniquetype.setValue(null);
        }
        this.getTolerancesByTechnique(this.beamGroupForm.controls.techniquetype.value);
      }

  }

  changeChooseSameTolerance(value:boolean):void{
    if (!value) {
      this.beamGroupForm.controls.tolerance.setValue(null);
      this.toleranceDetails=null;
    }else{
      this.getTolerancesByTechnique(this.beamGroupForm.controls.techniquetype.value);
    }
  }

  changeTolerance(event:any):void{
    if(!this.beamGroupForm.controls.tolerance.dirty){return;}
    if(event){
      var tolerance=this.tolerances.find(item=>item.id=event);
      if(tolerance!=null){
        this.toleranceDetails=tolerance ;
      }
    }
    
  }
  changePrescription(event:any) :void{
    
      if(!this.beamGroupForm.controls.relatedprescription.dirty){return;}
      this.coureseList = [];
      if (event != undefined && event != null) {
        var prescriptionNumber=parseInt(event);
        var selectedPrescriptionItem = this.PresciprionInfoList.find(item => item.index === prescriptionNumber);
        this.beamGroupForm.controls.relatedcourse.setValue(selectedPrescriptionItem.courseName);
        this.coureseList.push(selectedPrescriptionItem.courseName);
      }
    
  }

  techniquetypeSelcetedChanged():void {
    
    if(!this.beamGroupForm.controls.techniquetype.dirty){
      return;
    }
    this.tolerances=[];
    this.beamGroupForm.controls.chooseTolerance.setValue(false);
   
  }

  fractiondoseModelChange(value:any) :void{
    
    if (!this.fractionChangeNumber) {
      this.fractionChangeNumber = true;
      return;
    }
    if (this.beamGroupForm.controls.fractions.value == null || this.beamGroupForm.controls.fractions.value == 0 ||
      value == null || value == 0) {
      return;
    } else {
      var fractions = parseInt(this.beamGroupForm.controls.fractions.value.toString());
      var fractionDose = parseInt(value.toString());
      if (fractions > 0 && fractionDose > 0) {
        var total = fractionDose * fractions;
        this.totalDoseChangeNumber = false;
        this.beamGroupForm.controls.totoaldose.setValue(total);

      }
    }
  }

  fractionNumberModelChange(value:any) :void{
    
      if (!this.fractionNumberChangeNumber) {
        this.fractionNumberChangeNumber = true;
        return;
      }
      if (value == null || value == 0 || this.beamGroupForm.controls.fractiondose.value == null || this.beamGroupForm.controls.fractiondose.value == 0) {
        return;
      }
      else {
        var fractions = parseInt(value.toString());
        var fractionDose = parseInt(this.beamGroupForm.controls.fractiondose.value.toString());
        if (fractions > 0 && fractionDose > 0) {
          var total = fractionDose * fractions;
          this.totalDoseChangeNumber = false;
          this.beamGroupForm.controls.totoaldose.setValue(total);
  
        }
      }
    
  }

  totalModelChange(value:any) :void{
   
    if (!this.totalDoseChangeNumber) {
      this.totalDoseChangeNumber = true;
      return;
    }
    if (value == null || value == 0 || this.beamGroupForm.controls.fractions.value == null || this.beamGroupForm.controls.fractions.value == 0) {
      return;
    }
    else {
      var total = parseInt(value.toString());
      var number = parseInt(this.beamGroupForm.controls.fractions.value.toString());
      if (total > 0 && number > 0) {
        var fractionDose = total / number;
        this.fractionChangeNumber = false;
        this.beamGroupForm.controls.fractiondose.setValue(fractionDose);
      }

    }
  }

  changeGatingStatus(value:any) :void{
    
      if(!this.beamGroupForm.controls.isgatingControl.dirty){
        return;
    }
    if (value != undefined && value != null) {
      if (!value) {
        this.isGatingControl = false;
        this.beamGroupForm.controls.gatingModelControl.setValue(null);
      } else {
        this.isGatingControl = true;
        this.beamGroupForm.controls.gatingModelControl.setValue(this.gatingModelList[0].label);
      }
      
    }
  }


  public FormErrors = {
    beamgroupname: "",
    machine: "",
    radiationtype: "",
    techniquetype: "",
    description: "",
    fractiondose: "",
    fractions: "",
    totoaldose: "",
    patientposition: ""
  }

  public ValidationMessages = {
    beamgroupname: {
      required: "射野组名称为必填项",
      maxlength: "射野组名称最长不超过64个字符",
      check: "禁止输入反斜杠"
    },
    machine: {
      required: "机器名称为必填项"
    },
    radiationtype: {
      required: "照射类型为必填项"
    },
    techniquetype: {
      required: "技术类型为必填项"
    },
    description: {
      maxlength: "描述最长不超过1024个字符",
      check: "禁止输入反斜杠"
    },
    fractiondose: {
      required: "分次剂量为必填项",
      precisionTwo: "请输入精度为小数点后两位的正数"
    },
    fractions: {
      required: "分次数为必填项",
      min:"不小于已治疗session个数"
    },
    totoaldose: {
      required: "总剂量为必填项",
      precisionTwo: "请输入精度为小数点后两位的正数"
    },
    patientposition: {
      required: "摆位体位为必填项",
    }
  }
  onValueChanged(data?: any) {
    if (!this.beamGroupForm || !this.beamGroupForm.dirty) {
      return;
    }
    for (const field in this.FormErrors) {
      this.FormErrors[field] = '';
      const control = this.beamGroupForm.get(field);
      if (control && control.dirty && control.invalid) {
        const message = this.ValidationMessages[field];
        for (const key in control.errors) {
          this.FormErrors[field] += message[key] + '';
        }
      }
    }
  }

  submitEditBeamgroup(): void {
    try {
      this.isSaving = true;

      this.updateBeamGroupInfo().then((result: boolean) => {
        var ret = result as boolean;
        if (ret) {
          this.nzmessage.success(this.l("update beam group sucessfully"));
          this.isEditBeamgroup = false;
          this.clearFormError();
          this.confirmactionBeamgroup.emit(true);
        }
        else {
          this.message.error(this.l("update beam group failed"));
        }
        this.isSaving = false;
      });
    } catch (error) {
      console.log(error);
      this.isSaving = false;
    }
  }
  isNameDuplicate(name:string):boolean{
     if( name!=null){
        var beamGroupTemp=this.beamGroupList.find(temp=>temp.name==name);
        if(beamGroupTemp!=null){
          return true;
        }
        else{
          return false;
        }
     }
    
  }

  async updateBeamGroupInfo(): Promise<boolean> {

    var beamGroupDtoUpdate = this.beamGroupDto;

    //检查name不重复
    if (this.beamGroupForm.controls.beamgroupname.value != undefined && this.beamGroupForm.controls.beamgroupname.value != null) {     
      beamGroupDtoUpdate.name = this.beamGroupForm.controls.beamgroupname.value;
      if(this.initialBeamGroupName != beamGroupDtoUpdate.name){
        var duplicate=this.isNameDuplicate(beamGroupDtoUpdate.name);
        if(duplicate){
          this.message.error("射野组名称重复");
          return;
        }
      }
      
    }

    if (this.beamGroupForm.controls.machine.value != undefined && this.beamGroupForm.controls.machine.value != null && this.isTmsCreated) {
      beamGroupDtoUpdate.machineName = this.beamGroupForm.controls.machine.value.machineName;
    }
    if (this.beamGroupForm.controls.radiationtype.value != undefined && this.beamGroupForm.controls.radiationtype.value != null && this.isTmsCreated) {
      beamGroupDtoUpdate.radiationType = this.beamGroupForm.controls.radiationtype.value;
    }
    if (this.beamGroupForm.controls.techniquetype.value != undefined && this.beamGroupForm.controls.techniquetype.value != null && this.isTmsCreated) {
      beamGroupDtoUpdate.techniqueType = this.beamGroupForm.controls.techniquetype.value;
    }
    if (this.beamGroupForm.controls.chooseTolerance.value && this.tolerances.length > 0) {
      beamGroupDtoUpdate.toleranceId =this.beamGroupForm.controls.chooseTolerance.value;
      
      
    } else {
      beamGroupDtoUpdate.toleranceId = null;
    }

    if (this.beamGroupForm.controls.description.value != undefined) {
      beamGroupDtoUpdate.description = this.beamGroupForm.controls.description.value;
    }
    if (this.beamGroupForm.controls.fractiondose.value == undefined || this.beamGroupForm.controls.fractiondose.value == null || this.beamGroupForm.controls.fractiondose.value == 0) {
      beamGroupDtoUpdate.fractionDose = 1;
    } else if(this.isTmsCreated){
      beamGroupDtoUpdate.fractionDose = this.beamGroupForm.controls.fractiondose.value;
    }
    if (this.beamGroupForm.controls.fractions.value == undefined || this.beamGroupForm.controls.fractions.value == null || this.beamGroupForm.controls.fractions.value == 0) {
      beamGroupDtoUpdate.fractionNumber = 1;
    } else {
      beamGroupDtoUpdate.fractionNumber = this.beamGroupForm.controls.fractions.value;
    }
    if (this.beamGroupForm.controls.totoaldose.value == undefined || this.beamGroupForm.controls.totoaldose.value == null || this.beamGroupForm.controls.totoaldose.value == 0) {
      beamGroupDtoUpdate.totalDose = 1;
    } else {
      beamGroupDtoUpdate.totalDose = this.beamGroupForm.controls.totoaldose.value;
    }
    if (this.beamGroupForm.controls.relatedprescription.value != undefined) {
      beamGroupDtoUpdate.relatedPrescriptionId = this.beamGroupForm.controls.relatedprescription.value;
    }
    if (this.beamGroupForm.controls.relatedcourse.value != undefined && beamGroupDtoUpdate.relatedPrescriptionId!=null) {
      if (beamGroupDtoUpdate.relatedRx == undefined || beamGroupDtoUpdate.relatedRx == null) {
        beamGroupDtoUpdate.relatedRx = new PresciprionOutput();
      }
      beamGroupDtoUpdate.relatedRx.courseName = this.beamGroupForm.controls.relatedcourse.value;
    }else{
      beamGroupDtoUpdate.relatedRx=null;
    }
    if (this.beamGroupForm.controls.patientposition.value != undefined && this.beamGroupForm.controls.patientposition != null && this.isTmsCreated) {
      var stringName = this.beamGroupForm.controls.patientposition.value;
      this.patientPositionList.forEach(item => {
        if (item.name == this.beamGroupForm.controls.patientposition.value) {
          beamGroupDtoUpdate.setupList[0].patientPosition = item;
        }
      });

    }
    if (this.beamGroupForm.controls.isgatingControl.value != undefined) {
      if (this.beamGroupForm.controls.isgatingControl.value == null || this.beamGroupForm.controls.isgatingControl.value == false) {
        beamGroupDtoUpdate.isGating = false;
      } else {
        beamGroupDtoUpdate.isGating = true;
      }

    }
    if (beamGroupDtoUpdate.isGating) {
      if (this.beamGroupForm.controls.gatingModelControl.value != undefined) {
        var modelItem=this.gatingModelList.find(item=> item.label == this.beamGroupForm.controls.gatingModelControl.value);
        if(modelItem!=undefined && modelItem!=null){
          var numberItem=parseInt(modelItem.value);
          if(numberItem!=null){
            beamGroupDtoUpdate.gatingModel = numberItem;
          }
        }
      }
    } else {
      beamGroupDtoUpdate.gatingModel = null;
    }

    return await this._beamGroupService.updateBeamGroup(beamGroupDtoUpdate)
      .toPromise()
      .then((result: boolean) => {
        var ret = result as boolean;
        return ret;
      });
  }

  getUnmodifiedSessionNumber(): void {
    try {
      if (this.beamGroupID === null || this.beamGroupID === undefined) { return; }
      this._beamsTreatmentScheduleServiceProxy.getSessionsByBeamGroupId(parseInt(this.beamGroupID)).subscribe(
        (result: TreatmentScheduleSessionDto[]) => {
          if (result === null || result === undefined) { return; }
          var num = 0;
          result.forEach(item => {
            if (item.status.name === 'UnCompleted') {
              num = num + 1;
            }
          });
          this.unmodifiedSessionNum = result.length - num;//不可修改session的个数是除未完成的session以外所有的session
        });
    }
    catch (error) {
      console.log(error)
    }
  }

}
