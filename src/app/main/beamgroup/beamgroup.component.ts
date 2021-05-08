import { Component, Injector, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { BeamGroupDto, BeamGroupServiceProxy, BeamDto, MachineOutput, RadiationType, TechniqueType, PresciprionOutput, ToleranceDto, ToleranceServiceProxy, 
    BeamGroupStatusDto, SetupDto, PatientPosition, PatientSetupDto, BeamGroupImageDto, FixationDeviceImageDto } from '@shared/service-proxies/service-proxies';
import { FormGroup, FormBuilder, Validators, FormControl, ValidationErrors } from '@angular/forms';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { UserConfrimComponent } from '../userconfirm/userconfirm.component';
import { Observable, Observer } from 'rxjs';




@Component({
    selector: 'app-beamgroup',
    templateUrl: './beamgroup.component.html',
    styleUrls: ['./beamgroup.component.less'],
})

export class BeamGroupComponent extends AppComponentBase implements OnInit, OnChanges {


    beamGroupForm: FormGroup;
    listOfBeam: any[] = [];
    beamGroupDto: BeamGroupDto;//用于缓存初始化信息
    selectedBeamGroupId: number;
    beamModedes: string;
    completedSessionNum: number;
    approveStatus: string;
    approver: string;
    isApproved: boolean;
    approveDate: string;
    //用于处方数据绑定
    PresciprionInfoList: PresciprionOutput[] = [];
    selectedPresciprion: PresciprionOutput;
    rxPrescription: string;
    presciptionRadiationType: string;
    presciptionTechniqueType: string;
    target: string;
    courseName: string;
    //setup img 数据绑定
    ReferencedSetupImageLoading:boolean = true;
    imgList: any[] = [];
    deleteImgList: any[] = [];
    selectedImg: string | ArrayBuffer | null;
    selectedImgNum: number;
    totolImgNum: number;
    selectedImgDes: string;
    isLeftBtnEnable: boolean;
    isRightBtnEnable: boolean;

    //Fixation device img数据绑定
    FixationDeviceLoading:boolean = true;
    fixationDeviceImgList: any[] = [];
    deletedFixationDeviceImgList: any[] = [];
    slecetedFixationDeviceImg: string | ArrayBuffer | null;
    slecetedFixationDeviceImgNum: number;
    fixationDeviceTotalImgNum: number;
    selectedfixationDeviceImgDes: string;
    isfixationDeviceLeftBtnEnable: boolean;
    isfixationDeviceRightBtnEnable: boolean;

    //setup info
    patientPosition: string;
    patientSetupLable: string;
    patientAdditionalPosition: string;
    refToleranceTableId: number;
    patientSetUpNumber: number;
    //offset info
    offsetList: any[] = [];

    //motion synchronization 
    respiratoryGating: string;
    signalSource: string;
    compensationTechnique: string;
    signalSourceID: number;
    techniquedeScription: string;
    isTechInitFin: boolean;
    //isTechInMachineFin:boolean;
    isDisEnableCheck: boolean;
    isMachineValid: boolean;
    isBeamConfirmSelected: boolean;
    isCreateByTms: boolean;
    isSaving: boolean;

    
    gatingModelList: any[] =  [{ label: "振幅", value: 0 }, { label: "时相", value: 1 }];
    selectedGatingModel: any;
    coureseList: any[] = [];
    precriptionList: any[] = [];
    protocolList: any[] = [];
    BeamGroupInfoLoading:boolean=false;

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private _beamGroupService: BeamGroupServiceProxy,
        private nzmessage: NzMessageService,
        private _modalService: NzModalService,) {
        super(injector);
    }

    @Input()
    beamGroupID: string;
    @Input()
    patientID:number;
    @Output()
    UpdateBeamGroupEvent = new EventEmitter<string>();
    @Output()
    BeamGroupApproveChangeEvent = new EventEmitter<BeamGroupResult>();
    @Output()
    BeamGroupActiveChangeEvent = new EventEmitter<boolean>();

    isInit:boolean;

     ngOnChanges(changes: import("@angular/core").SimpleChanges):void  {
        this.isTechInitFin = false;
        
        //在这个钩子函数里利用id进行组件的初始化
        for (let propName in changes) {
            let changedProp = changes[propName];
            if (propName.lastIndexOf("beamGroupID") > -1) {
                this.selectedBeamGroupId = changedProp.currentValue;           
                if (this.selectedBeamGroupId === null || this.selectedBeamGroupId === undefined) { continue; }   
                this.resetBeamGroupInfo();
                this.getBeamGroupInfo(this.selectedBeamGroupId);
            }

            if (propName.lastIndexOf("patientID") > -1) {
                this.patientID = changedProp.currentValue;
                if (this.patientID !== null && this.patientID !== undefined && !Number.isNaN(this.patientID)) {
                    this.checkHasBeamGroup()               
                }
            }
        }
    }


    ngOnInit(): void {
        this.isTechInitFin = false;
    }

    getBeamGroupInfo(id: number): void {
        if (id === null || id === undefined) { return }
        this.initBasicData(id);
        this.initSetUpImg(id);  
        this.initFixationDeviceImg(id);
    }

    initBasicData(id: number):void{
        try {
            this._beamGroupService.getBeamGroupInfoByIndex(id)
            .pipe()
            .subscribe((result: BeamGroupDto) => {
                this.beamGroupDto = result;
                this.BeamGroupInfoLoading=true;
                this.initViewData(this.beamGroupDto);
                this.getBeamListInfo(this.beamGroupDto);
                this.getOffSetInfo(this.beamGroupDto);
                this.BeamGroupInfoLoading=false;
            })
        }
        catch (error) {
            console.log(error)
        }
            
    }

    updatePositionImaging():void{
        if(this.beamGroupID!=null){
            this.initSetUpImg(parseInt(this.beamGroupID));
        }
    }
    updateDeviceSequence():void{
        if(this.beamGroupID!=null){
            this.initFixationDeviceImg(parseInt(this.beamGroupID));
        }
    }
    updateOffset(){
        try {
            this._beamGroupService.getBeamGroupInfoByIndex(this.beamGroupDto.id)
            .pipe()
            .subscribe((result: BeamGroupDto) => {
                this.beamGroupDto = result;
                this.getOffSetInfo(this.beamGroupDto);
            })
        }
        catch (error) {
            console.log(error)
        }
    }
     checkHasBeamGroup(): void {
        try {
            this._beamGroupService.getBeamGroupNum(this.patientID)
                .toPromise()
                .then((ret: number) => {
                    if (ret > 0) {
                        this.GetAllPrescriptionInfo(this.patientID);
                    }
                    else{
                        this.resetBeamGroupInfo();
                    }
                })
        }
        catch (error) {
            console.log(error);
        }
    }

    GetAllPrescriptionInfo(patientID: number): void {
        try {
            if (patientID === null || patientID === undefined ||  Number.isNaN(patientID)) { return; }
            this._beamGroupService.getAllPrescriptionByPatientId(this.patientID)
            .pipe()
            .subscribe((result:PresciprionOutput[])=>{
                this.PresciprionInfoList = result;
            })
        }
        catch (error) {
            console.log(error)
        }
    }

   

    getOffSetInfo(beamGroupDot: BeamGroupDto): void {
        try {
            if (beamGroupDot === null || beamGroupDot === undefined) { return; }
            if (beamGroupDot.beams != null && beamGroupDot.beams !== undefined && beamGroupDot.beams.length > 0) {
                var temp = [];
                for (let i = 0; i < beamGroupDot.beams.length; i++) {
                    var beamDto = beamGroupDot.beams[i] as BeamDto;
                    var x = beamDto.isocenter.x.toFixed(2);
                    var y = beamDto.isocenter.y.toFixed(2);
                    var z = beamDto.isocenter.z.toFixed(2);
                    var isocenter = "(" + `${x}` + ", " + `${y}` + ", " + `${z}` + ")";           
                    var lat = beamDto.patientSetUp !== null && beamDto.patientSetUp !== undefined && beamDto.patientSetUp.tableTopLateralSetupDisplacement !== null ? beamDto.patientSetUp.tableTopLateralSetupDisplacement : 0;//z方向
                    var lng = beamDto.patientSetUp !== null && beamDto.patientSetUp !== undefined && beamDto.patientSetUp.tableTopLongitudinalSetupDisplacement !== null ? beamDto.patientSetUp.tableTopLongitudinalSetupDisplacement : 0;//x方向
                    var vrt = beamDto.patientSetUp !== null && beamDto.patientSetUp !== undefined && beamDto.patientSetUp.tableTopVerticalSetupDisplacement !== null ? beamDto.patientSetUp.tableTopVerticalSetupDisplacement : 0;//y方向
                    var offsetItem = {
                        offsetNum: `${i + 1}`,
                        isoCenter: `${isocenter}`,
                        relatedName: `${beamDto.name}`,
                        VRT:`${vrt}`,
                        LAT:`${lat}`,
                        LNG:`${lng}`,
                        beams:[],
                    }
                    offsetItem.beams.push(beamDto.id);
                    //需要分组，如果isoCente相同的为一组。
                    var index = temp.findIndex(item => item.isoCenter === offsetItem.isoCenter);
                    if (index === -1) {
                        temp.push(offsetItem);
                    }
                    else {
                        temp[index].relatedName = temp[index].relatedName + "," + offsetItem.relatedName;
                        temp[index].beams.push(beamDto.id);
                    }                 
                }
                this.offsetList = temp;
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    getBeamListInfo(beamGroupDot: BeamGroupDto): void {
        try {
            if (beamGroupDot === null || beamGroupDot === undefined) { return; }
            if (beamGroupDot.beams === null || beamGroupDot.beams === undefined || beamGroupDot.beams.length === 0) {
                this.isDisEnableCheck = true;
                return;
            }
            this.isDisEnableCheck = false;
            var temp = [];
            
            for (let i = 0; i < beamGroupDot.beams.length; i++) {
                var beamDto = beamGroupDot.beams[i] as BeamDto;
                if (beamDto === null || beamDto === undefined) { continue; }
                var beamitem = {
                    beamNumber: `${i + 1}`,
                    beamName: `${beamDto.name}`,
                    radiationType: `${beamDto.beamRadiationType != null ? beamDto.beamRadiationType : ''}`,
                    beamDescription: `${beamDto.description !== null ? beamDto.description : ''}`,
                    machineName: `${beamDto.machineName !== null && beamDto.machineName !== "" ? beamDto.machineName : beamGroupDot.machineName}`,
                    doseRate: `${beamDto.doseRateSet != null ? beamDto.doseRateSet : ''}`,
                    beamMu: `${beamDto.beamMu != null ? beamDto.beamMu.toFixed(2) : ''}`,
                    gantryStart: `${beamDto.gantryAngle != null ? beamDto.gantryAngle.toFixed(2) : ''}`,
                    gantryEnd: `${beamDto.arcStopGantryAngle != null ? beamDto.arcStopGantryAngle.toFixed(2) : ''}`,
                    tolerance: `${beamDto.rtToleranceTables != null ? beamDto.rtToleranceTables.toleranceTableLabel : ''}`
                }
                temp.push(beamitem);
            }
            this.listOfBeam = temp;
        }
        catch (error) {
            console.log(error)
        }
    }

    async initViewData(beamGroupDto: BeamGroupDto): Promise<boolean|undefined> {
        if (beamGroupDto === null || beamGroupDto === undefined) {
            return;
        }
        this.isCreateByTms = beamGroupDto.isCreateByTms;
        this.isDisEnableCheck = beamGroupDto.isCheck;
        this.isBeamConfirmSelected=beamGroupDto.isCheck;
        this.completedSessionNum = beamGroupDto.completedSessionNum;
        if (beamGroupDto.fractionDose === null || beamGroupDto.fractionDose === undefined || beamGroupDto.fractionDose === 0) {
            if (beamGroupDto.fractionNumber !== null && beamGroupDto.fractionNumber !== undefined && beamGroupDto.fractionNumber !== 0) {
                if (beamGroupDto.totalDose !== null && beamGroupDto.totalDose !== undefined && beamGroupDto.totalDose !== 0) {
                    this.beamGroupDto.fractionDose = beamGroupDto.totalDose / beamGroupDto.fractionNumber;
                }
            }
        }

        this.approveStatus=this.beamGroupDto.isApproved ? "是" : "否";
        this.isApproved=this.beamGroupDto.isApproved;
        this.approver=this.beamGroupDto.approver;
        this.approveDate=this.beamGroupDto.approveDate;
        this.isMachineValid = beamGroupDto.isMachineValide;
        if(beamGroupDto.isGating){
           var model=this.gatingModelList.find(item => item.value == beamGroupDto.gatingModel);
           if(model!=undefined && model!=null){
              this.selectedGatingModel = model.label;
           }
        }
        if (beamGroupDto.setupList != null && beamGroupDto.setupList !== undefined && beamGroupDto.setupList.length > 0) {
            var setupInfo = beamGroupDto.setupList[0];
            if(setupInfo !=undefined && setupInfo!=null){
                if(setupInfo.patientPosition!=undefined && setupInfo.patientPosition!=null){
                    this.patientPosition = setupInfo.patientPosition.name;
                }
                this.patientSetUpNumber = setupInfo.patientSetupNumber;
                this.patientSetupLable = setupInfo.patientSetupLable;
                this.patientAdditionalPosition = setupInfo.patientAdditionalPosition;
                this.refToleranceTableId = setupInfo.refToleranceTableId;
            }
            
        }else { 
            this.patientPosition = "HFS"; 
        }
        this.selectedPresciprion = this.PresciprionInfoList.find(item => item.index === beamGroupDto.relatedPrescriptionId);
        if(this.selectedPresciprion!=undefined){
            //add new 
           this.courseName=this.selectedPresciprion.courseName==undefined ? null :this.selectedPresciprion.courseName;
           this.rxPrescription=this.selectedPresciprion.rxDescription;
           this.presciptionTechniqueType=this.selectedPresciprion.techniqueType;
           this.target=this.selectedPresciprion.target;
        }
    }

    
    beamsDtoconverter(): BeamDto[] {
        var ret = this.beamGroupDto.beams;
        this.offsetList.forEach(item => {
            if (item.beams !== null && item.beams !== undefined) {
                item.beams.forEach(beamid => {
                    var index = ret.findIndex(beam => beam.id === beamid);
                    if (index > -1) {
                        if (ret[index].patientSetUp === null || ret[index].patientSetUp === undefined) {
                            ret[index].patientSetUp = new PatientSetupDto();
                        }
                        ret[index].patientSetUp.tableTopLateralSetupDisplacement = item.VRT;
                        ret[index].patientSetUp.tableTopLongitudinalSetupDisplacement = item.LAT;
                        ret[index].patientSetUp.tableTopVerticalSetupDisplacement = item.LNG;
                    }
                })
            }
        });
        return ret;
    }

    changeBeamConfirmSelected(event:any):void{
      if(event){
        this.isBeamConfirmSelected=true;
      }else{
          this.isBeamConfirmSelected=false;
      }
    }

    resetBeamGroupInfo(): void {
        
        this.listOfBeam = [];
        this.beamGroupDto = null;
        this.beamModedes = '';
        this.completedSessionNum = undefined;
        this.approveStatus = null;
        this.approver = null;
        this.approveDate = null;
        this.selectedPresciprion=null;
        this.courseName=null;
        this.rxPrescription=null;
        this.presciptionTechniqueType=null;
        this.target=null;
        this.patientPosition = '';
        this.patientSetupLable = '';
        this.patientSetUpNumber = undefined
        this.patientAdditionalPosition = '';
        this.refToleranceTableId = undefined;
        this.respiratoryGating = '';
        this.signalSource = '';
        this.compensationTechnique = '';
        this.signalSourceID = undefined;
        this.techniquedeScription = '';
        this.imgList = [];
        this.deleteImgList = [];
        this.totolImgNum = undefined;
        this.selectedImg = undefined;
        this.selectedImgNum = undefined;
        this.selectedImgDes = '';
        this.isLeftBtnEnable=false;
        this.isRightBtnEnable = false;
        this.fixationDeviceImgList = [];
        this.deletedFixationDeviceImgList = [];
        this.slecetedFixationDeviceImg = undefined;
        this.slecetedFixationDeviceImgNum = undefined;
        this.fixationDeviceTotalImgNum = undefined;
        this.selectedfixationDeviceImgDes = '';
        this.isfixationDeviceLeftBtnEnable = false;
        this.isfixationDeviceRightBtnEnable = false;
        this.selectedGatingModel = undefined;
        this.offsetList=[];
        }

    initFixationDeviceImg(id:number): void {
        this.FixationDeviceLoading=true;
        this._beamGroupService.getFixationDeviceImages(id).subscribe((ret) => {
            if (ret === null || ret === undefined || ret.length === 0) {
                this.fixationDeviceImgList=null;
                this.fixationDeviceTotalImgNum = null;
                this.slecetedFixationDeviceImg = null;
                this.selectedfixationDeviceImgDes = null;
                this.slecetedFixationDeviceImgNum=null;
                this.isfixationDeviceLeftBtnEnable = true;
                this.isfixationDeviceRightBtnEnable = true;
                this.FixationDeviceLoading=false;
            }else{
                var deviceTemp = [];
                ret.forEach(item => {
                    var image = {
                        id: item.id,
                        beamGroupId: item.beamGroupId,
                        fixationImg: window.atob(item.fixationImage),
                        deviceDes: item.descripiton,
                    }
                    deviceTemp.push(image);
                });
                this.fixationDeviceImgList = deviceTemp;
                this.fixationDeviceTotalImgNum = this.fixationDeviceImgList.length;
                this.slecetedFixationDeviceImg = this.fixationDeviceImgList[0].fixationImg;
                this.selectedfixationDeviceImgDes = this.fixationDeviceImgList[0].deviceDes != null ? this.fixationDeviceImgList[0].deviceDes : '';
                this.slecetedFixationDeviceImgNum = 1;
                if (this.slecetedFixationDeviceImgNum <= 1) {
                    this.isfixationDeviceLeftBtnEnable = true;
                }
                if (this.slecetedFixationDeviceImgNum >= this.fixationDeviceImgList.length) {
                    this.isfixationDeviceRightBtnEnable = true;
                }
                this.FixationDeviceLoading=false;  
                }
            
        })     
        
    }


    ///初始化setup image
    initSetUpImg(id: number): void {
        this.ReferencedSetupImageLoading=true;
        this.imgList=null;
        this._beamGroupService.getBeamGroupImages(id).subscribe((ret) => {
            if (ret === null || ret === undefined || ret.length === 0) {
                this.imgList = null;
                this.totolImgNum = null;
                this.selectedImg = null;
                this.selectedImgDes = null;
                this.selectedImgNum = null;
                this.isLeftBtnEnable = true;
                this.isRightBtnEnable = true;

                this.ReferencedSetupImageLoading=false;
            }else{
                var temp = [];
                ret.forEach(item => {
                    var image = {
                        id: item.id,
                        beamGroupId: item.beamGroupId,
                        filePath: window.atob(item.imageFilePath),
                        imageDes: item.imageName,
                    }
                    temp.push(image);
                });
                this.imgList = temp;
                this.totolImgNum = this.imgList.length;
                this.selectedImg = this.imgList[0].filePath;
                this.selectedImgDes = this.imgList[0].imageDes != null ? this.imgList[0].imageDes : '';
                this.selectedImgNum = 1;
                if (this.selectedImgNum <= 1) {
                    this.isLeftBtnEnable = true;
                }
                if (this.selectedImgNum >= this.imgList.length) {
                    this.isRightBtnEnable = true;
                }
                this.ReferencedSetupImageLoading=false;
                }
        })
        
    }

    fixationDeviceImageLeftClick(): void {
        if (this.slecetedFixationDeviceImgNum <= 0) { return }
        this.slecetedFixationDeviceImgNum = this.slecetedFixationDeviceImgNum - 1;
        if (this.slecetedFixationDeviceImgNum <= 0) {
            this.slecetedFixationDeviceImgNum = this.slecetedFixationDeviceImgNum + 1;
            return;
        }
        this.slecetedFixationDeviceImg = this.fixationDeviceImgList[this.slecetedFixationDeviceImgNum - 1].fixationImg;
        this.selectedfixationDeviceImgDes = this.fixationDeviceImgList[this.slecetedFixationDeviceImgNum - 1].deviceDes != null ? this.fixationDeviceImgList[this.slecetedFixationDeviceImgNum - 1].deviceDes : '';
        if (this.slecetedFixationDeviceImgNum <= 1) {
            this.isfixationDeviceLeftBtnEnable = true;
        }
        else {
            this.isfixationDeviceLeftBtnEnable = false;
        }
        if (this.slecetedFixationDeviceImgNum >= this.fixationDeviceImgList.length) {
            this.isfixationDeviceRightBtnEnable = true;
        } else {
            this.isfixationDeviceRightBtnEnable = false;
        }
    }

    fixationDeviceImageRightClick(): void {
        if (this.slecetedFixationDeviceImgNum >= this.fixationDeviceImgList.length) { return; }
        this.slecetedFixationDeviceImgNum = this.slecetedFixationDeviceImgNum + 1;
        this.slecetedFixationDeviceImg = this.fixationDeviceImgList[this.slecetedFixationDeviceImgNum - 1].fixationImg;
        this.selectedfixationDeviceImgDes = this.fixationDeviceImgList[this.slecetedFixationDeviceImgNum - 1].deviceDes != null ? this.fixationDeviceImgList[this.slecetedFixationDeviceImgNum - 1].deviceDes : null;
        if (this.slecetedFixationDeviceImgNum > 1 && this.slecetedFixationDeviceImgNum <= this.fixationDeviceImgList.length) {
            this.isfixationDeviceLeftBtnEnable = false;//false代表button使能，true不使能
        }
        else {
            this.isfixationDeviceLeftBtnEnable = true;
        }

        if (this.slecetedFixationDeviceImgNum >= this.fixationDeviceImgList.length) {
            this.isfixationDeviceRightBtnEnable = true;
        } else {
            this.isfixationDeviceRightBtnEnable = false;
        }
    }
    leftClick(): void {
        if (this.selectedImgNum <= 0) { return }
        this.selectedImgNum = this.selectedImgNum - 1;
        if (this.selectedImgNum <= 0) {
            this.selectedImgNum = this.selectedImgNum + 1;
            return;
        }
        this.selectedImg = this.imgList[this.selectedImgNum - 1].filePath;

        this.selectedImgDes = this.imgList[this.selectedImgNum - 1].imageDes != null ? this.imgList[this.selectedImgNum - 1].imageDes : '';
        if (this.selectedImgNum <= 1) {
            this.isLeftBtnEnable = true;
        }
        else {
            this.isLeftBtnEnable = false;
        }
        if (this.selectedImgNum >= this.imgList.length) {
            this.isRightBtnEnable = true;
        } else {
            this.isRightBtnEnable = false;
        }
    }

    rightClick(): void {
        if (this.selectedImgNum >= this.imgList.length) { return; }
        this.selectedImgNum = this.selectedImgNum + 1;
        this.selectedImg = this.imgList[this.selectedImgNum - 1].filePath;
        this.selectedImgDes = this.imgList[this.selectedImgNum - 1].imageDes != null ? this.imgList[this.selectedImgNum - 1].imageDes : null;
        if (this.selectedImgNum > 1 && this.selectedImgNum <= this.imgList.length) {
            this.isLeftBtnEnable = false;//false代表button使能，true不使能
        }
        else {
            this.isLeftBtnEnable = true;
        }

        if (this.selectedImgNum >= this.imgList.length) {
            this.isRightBtnEnable = true;
        } else {
            this.isRightBtnEnable = false;
        }
    }

    async approveBeamGroup(): Promise<boolean|undefined> {
        console.log('approve BeamGroup start!');

        if (this.listOfBeam === null && this.listOfBeam.length <= 0) {
            this.message.warn(this.l("beamGroup without beam can not approve"));
            return;
        }
        if (this.isApproved) {
            this.nzmessage.warning(this.l("this beam group has been approved"));
            return;
        }
        
        if(!this.isBeamConfirmSelected){
            this.message.warn(this.l("uncheck beamGroup can not approve"));
            return;
        }
        if (!this.beamGroupDto.isActive) {
            this.message.warn(this.l("unactive beamgroup can not approve"))
            return;
        }
       
        if (!this.isMachineValid) {
            this.message.warn(this.l("unvalid machine is not allowed to approve."));
            return;
        }
       
        let userConfirmModal = this._modalService.create(
            {
                nzContent: UserConfrimComponent,
                nzMaskClosable: false,
                nzFooter: null,
                nzClosable: false,
                nzWidth: 0,
            }
        );
        userConfirmModal.afterClose.subscribe(async (result: any) => {
            if (result === null || result === undefined) { return; }
            if (result.isAvailable) {
                this.approveBeamGroupExcute(result.approver);
              }
        });
    }

    approveBeamGroupExcute(approver: string): void {
        try {
            this._beamGroupService.approveBeamGroup(this.beamGroupDto.id, approver)
                .pipe()
                .subscribe((result: boolean) => {
                    var isApprove = result;
                    if (isApprove) {
                        this.nzmessage.success(this.l("approve beamgroup success"));
                        var beamgroupResult = new BeamGroupResult();
                        beamgroupResult.isApprove = true;
                        beamgroupResult.isMachineVliad = this.isMachineValid;
                        this.BeamGroupApproveChangeEvent.emit(beamgroupResult);
                        this.getBeamGroupStatus();
                    } else {
                        this.message.error(this.l("approve beamgroup failed"));
                    }
                });
        }
        catch (error) {
            console.log(error);
        }
    }

    unapproveBeamGroup(): void {
        if (this.listOfBeam === null || this.listOfBeam.length <= 0) {
            this.message.warn(this.l("beamGroup without beam can not unapprove"));
            return;
        }
        if (!this.isApproved) {
            this.message.warn(this.l("this beamgroup has been unapproved."));
            return;
        }
        if(!this.isBeamConfirmSelected){
            this.message.warn(this.l("uncheck beamGroup can not unapprove"));
            return;
        }
        let userConfirmModal = this._modalService.create(
            {
                nzContent: UserConfrimComponent,
                nzMaskClosable: false,
                nzFooter: null,
                nzClosable: false,
                nzWidth: 0,
            }
        );
        userConfirmModal.afterClose.subscribe((result: any) => {
            if (result === null || result === undefined) { return; }
            if (result.isAvailable) {
                this.unapproveBeamGroupExcute();
            }
        })
    }

    unapproveBeamGroupExcute(): void {
        try {
            this._beamGroupService.unApproveBeamGroup(this.beamGroupDto.id)
                .pipe()
                .subscribe((result: boolean) => {
                    var isUnApprove = result;
                    if (isUnApprove) {
                        this.nzmessage.success(this.l("unapprove beamgroup success"));
                        var beamgroupResult = new BeamGroupResult();
                        beamgroupResult.isApprove = false;
                        beamgroupResult.isMachineVliad = this.isMachineValid;
                        this.BeamGroupApproveChangeEvent.emit(beamgroupResult);
                        this.getBeamGroupStatus();
                    }
                    else {
                        this.message.error(this.l("unapprove beamgroup failed"));
                    }
                })
        }
        catch (error) {
            console.log(error);
        }
    }

    activeBeamGroup(): void {
        console.log('active BeamGroup start!');
        if (this.beamGroupDto.isActive) {
            this.nzmessage.warning(this.l("this beam group has been actived."))
            return;
        }

        let userConfirmModal = this._modalService.create(
            {
                nzContent: UserConfrimComponent,
                nzMaskClosable: false,
                nzFooter: null,
                nzClosable: false,
                nzWidth: 0,
            }
        );
        userConfirmModal.afterClose.subscribe((result: any) => {
            if (result === null || result === undefined) { return; }
            if (result.isAvailable) {
                this.activeBeamGroupExcute();
            }
        })
    }

    activeBeamGroupExcute() {
        try {
            this._beamGroupService.activeBeamGroup(this.beamGroupDto.id)
                .pipe()
                .subscribe((result: boolean) => {
                    var ret = result;
                    if (ret) {
                        this.BeamGroupActiveChangeEvent.emit(true);
                        this.beamGroupDto.isActive = true;
                        this.nzmessage.success(this.l("active beam group success"));
                    }
                    else {
                        this.message.error(this.l("active beam group failed"));
                    }
                })
        }
        catch (error) {
            console.log(error)
        }
    }

    unActiveBeamGroup(): void {
        console.log('unactive BeamGroup start!');
        if (!this.beamGroupDto.isActive) {
            this.nzmessage.warning(this.l("this beam group has been unactived."));
            return;
        }
        let userConfirmModal = this._modalService.create(
            {
                nzContent: UserConfrimComponent,
                nzMaskClosable: false,
                nzFooter: null,
                nzClosable: false,
                nzWidth: 0,
            }
        );
        userConfirmModal.afterClose.subscribe((result: any) => {
            if (result === null || result === undefined) { return; }
            if (result.isAvailable) {
                this.unActiveBeamGroupExcute();
            }
        })
    }

    unActiveBeamGroupExcute() {
        try {
            // var beamGroupID = parseInt(this.beamGroupNode.id);
            this._beamGroupService.inActiveBeamGroup(this.beamGroupDto.id)
                .pipe()
                .subscribe((result: boolean) => {
                    var ret = result
                    if (ret) {
                        this.BeamGroupActiveChangeEvent.emit(false);
                        this.beamGroupDto.isActive = false;
                        this.nzmessage.success(this.l("unactive beam group success"));
                    } else {
                        this.message.error(this.l("unactive beam group failed"));
                    }
                })
        }
        catch (error) {
            console.log(error)
        }
    }

    getBeamGroupStatus(): void {
        try {
            this._beamGroupService.getBeamGroupStatus(this.selectedBeamGroupId)
                .pipe()
                .subscribe((result: BeamGroupStatusDto) => {
                    var statusDto = result;
                    if (statusDto === null || statusDto === undefined) { return; }
                    this.approveStatus=statusDto.isApprove ? "是" : "否";
                    this.approver=statusDto.approvedUserName;
                    this.approveDate=statusDto.approvedDateTime;
                    this.isApproved = statusDto.isApprove;
                })
        }
        catch (error) {
            console.log(error)
        }
    }

   
}

export class BeamGroupResult {
    isApprove: boolean | undefined;
    isMachineVliad: boolean | undefined;
    beamGroupName: boolean | undefined;
}