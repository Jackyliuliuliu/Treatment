import { Component, OnInit, Injector, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { FormGroup, FormBuilder, Validators ,FormControl} from '@angular/forms';
import { checkBackslash } from '@shared/validator/formControlValidators';
import { BeamGroupDto, BeamGroupServiceProxy, AddBeamGroupDto, MachineOutput, TechniqueType, RadiationType, ToleranceServiceProxy, ToleranceDto, CheckBeamGroupResult } from '@shared/service-proxies/service-proxies';


@Component({
    selector: 'app-createbeamgroup',
    templateUrl: './createbeamgroup.component.html',
    styleUrls: ['./createbeamgroup.component.less'],
})

export class CreatebeamgroupComponent extends AppComponentBase  implements OnInit {
    isCreateDgViewVisible = false;
    createBeamGroupForm: FormGroup;
    beamGroupDto: AddBeamGroupDto;
    beamGroupName: string;
    radiationType: RadiationType;
    techniqueType: TechniqueType;
    machineName: {} = {};
    description:string;
    allMachineInfoList: MachineOutput[]= []; 
    radiationTypeInfoList:RadiationType[]=[];
    techniqueTypeInfoList:TechniqueType[]=[];
    machineNameList: string[] = [];

    @Input()
    patientId: number;
    @Input()
    isEditPermission: boolean;

    @Output()
    addedBeamGroup = new EventEmitter<string>();

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private _beamGroupService: BeamGroupServiceProxy,
        private _toleranceService: ToleranceServiceProxy,) {
        super(injector);

    }

    ngOnInit() {
        this.initcreateBeamGroupForm();
    }

    initcreateBeamGroupForm(): void {
        this.createBeamGroupForm = this.fb.group({
            beamgroupname: ['', [Validators.required, Validators.maxLength(64) , checkBackslash]],
            machinename:['', [Validators.required]],
            radiationtype:['', [Validators.required]],
            techniquetype:['', [Validators.required]],
            description:[null, [Validators.maxLength(1024) , checkBackslash]],
            chooseTolerance:[false, null],
            tolerance:[null, null],
        });

    }


    CreateDgSubmitForm(): void {
        for (const i in this.createBeamGroupForm.controls) {
            this.createBeamGroupForm.controls[i].markAsDirty();
            this.createBeamGroupForm.controls[i].updateValueAndValidity();
        }
    }
    //使form初始化时校验通过
    resetForm(): void {
        
        this.createBeamGroupForm.reset();
        for (const key in this.createBeamGroupForm.controls) {
            this.createBeamGroupForm.controls[key].markAsPristine();
            this.createBeamGroupForm.controls[key].updateValueAndValidity();
        }
    }

    showCreateDgModal(): void {
        if(!this.isEditPermission){
            this.message.error("没有权限");
            return;
        }
        this.initSubscribe();
        this.reset();
        this.resetForm();
        this.getAllMachineInfo();
        //this.getAllTolerance();
        this.isCreateDgViewVisible = true;
    }

    createDgViewOk(): void {
        console.log('Button ok clicked!');
        this.addBeamGroup();

    }

    addBeamGroup(): void {
        try {
            this.beamGroupDto = new AddBeamGroupDto();
            this.beamGroupDto.name = this.beamGroupName;
            this.beamGroupDto.machineName = this.machineName !== null ? this.machineName["machineName"] : null;
            this.beamGroupDto.techniqueType = this.techniqueType.id;
            this.beamGroupDto.radiationType = this.radiationType.id;
            this.beamGroupDto.description = this.description;
            this.beamGroupDto.patientId = this.patientId;
            if(this.createBeamGroupForm.controls.tolerance.value != null)
            {
                this.beamGroupDto.toleranceId = this.createBeamGroupForm.controls.tolerance.value.id;
            }
            this.checkBeamGroupDuplicate(this.beamGroupDto);

        }
        catch (error) {
            console.log(error);
        }
    }

    checkBeamGroupDuplicate(beamGroupDto: AddBeamGroupDto): void {
        if (beamGroupDto === null || beamGroupDto === undefined) { return; }
        this._beamGroupService.checkBeamGoupDuplicate(beamGroupDto).pipe()
            .subscribe((ret: CheckBeamGroupResult) => {
                if (ret === null) { return; }
                if (ret.beamGroupNum >=100) {
                    this.message.warn("the beamgroup max number is 100");
                    return
                }
                if (ret.isDuplicate) {
                    this.message.warn("the beamgroup name can not dumplicate");
                    return;
                }
                this._beamGroupService.addBeamGroup(this.beamGroupDto)
                    .pipe()
                    .subscribe((result: BeamGroupDto) => {
                        var newBeamGroupDto = result;
                        this.addedBeamGroup.emit(newBeamGroupDto.id.toString());
                        this.isCreateDgViewVisible = false;
                    })
            })
    }


    getAllMachineInfo(): void {
        try {
            this._beamGroupService.getAllMachines()
                .pipe()
                .subscribe((result: MachineOutput[]) => {
                    var ret = result;
                    if (ret === null || ret === undefined) {
                        return;
                    }
                    var tempList = [];
                    this.allMachineInfoList = ret;
                    for (let i = 0; i < this.allMachineInfoList.length; i++) {
                        var machineitem = this.allMachineInfoList[i];
                        if (machineitem === null || machineitem === undefined) { continue; }
                        if (machineitem.isActived && machineitem.isApproved) {
                            tempList.push({
                                machineNumber: `${i}`,
                                machineName: `${machineitem.machineName}`
                            });
                        }
                    }
                    this.machineNameList = tempList;
                    this.machineName = this.machineNameList[0];
                })
        }
        catch (error) {
            console.log(error);
        }
    }
    machineNameSelcetedChanged(event: any) {
        if (event === null || event === undefined) {
            return;
        }
        if (this.allMachineInfoList === null || this.allMachineInfoList === undefined || this.allMachineInfoList.length === 0) {
            return;
        }
        if (event.machineNumber !== null && event.machineNumber !== undefined) {
            var machinenumber = parseInt(event.machineNumber);
        }
        this.radiationTypeInfoList=[];
        this.radiationTypeInfoList = this.allMachineInfoList[machinenumber].radiationList;
        if (this.radiationTypeInfoList !== null && this.radiationTypeInfoList !== undefined && this.radiationTypeInfoList.length > 0) {
            this.radiationType = this.radiationTypeInfoList[0]
        }else{
            this.radiationType=null;
        }
        //自己创建的beamgrou只包含两种类型
        this.techniqueTypeInfoList = [];
        this.allMachineInfoList[machinenumber].techniqueTypeList.forEach(item => {
            if (item.name === "3DCRT" || item.name === "SimpleArc") {
                this.techniqueTypeInfoList.push(item);
            }
        });
        // this.techniqueTypeInfoList = this.allMachineInfoList[machinenumber].techniqueTypeList;
        if (this.techniqueTypeInfoList != null && this.techniqueTypeInfoList !== undefined && this.techniqueTypeInfoList.length > 0) {
            this.techniqueType = this.techniqueTypeInfoList[0];
        }else{
            this.techniqueType=null;
        }
    }
    createDgViewCancel(): void {
        console.log('Button cancel clicked!');
        this.reset();
        this.isCreateDgViewVisible = false;
        this.resetForm();
    }
    reset():void{
        this.beamGroupName="";
        this.radiationType = null;
        this.techniqueType = null;
        this.machineName="";
        this.description="";
        this.radiationTypeInfoList = [];
        this.techniqueTypeInfoList = [];

        //由于在getAllTolerance中会连续对两者进行赋值，不需要在此赋值
        // this.createBeamGroupForm.controls.chooseTolerance.setValue(false);
        // this.createBeamGroupForm.controls.tolerance.setValue(null);
    }

    tolerances = [];

    getAllTolerance()
    {
        this._toleranceService.getAllTolerance().subscribe(
            data=>
            {
            var toleranceListall:ToleranceDto[] = data;
             //根据技术类型筛选出toleranceListofTechnique
             var toleranceListofTechnique: ToleranceDto[] = [];
             toleranceListall.forEach(
                 tolerance=>{
                     //这边后续可能需要处理的bug：在后续点击tolerance勾选框时，可能techniqueType还未加载成功导致其值为null，为了安全起见，后续最后在techniqueType加载完成后再使能Tolerance勾选框
                     if(tolerance.technique == this.techniqueType.id)
                     {
                         toleranceListofTechnique.push(tolerance);
                     }
                 }
             )
             this.tolerances = toleranceListofTechnique;
             console.log(this.tolerances);

            }
        )
    }

    initSubscribe()//当Tolerance不选时，将tolerance置为null
    {
        this.createBeamGroupForm.controls.chooseTolerance.valueChanges.subscribe(
            data=>{
                if(!data)
                {
                    this.createBeamGroupForm.controls.tolerance.setValue(null);  
                }
                else
                {
                    this.getAllTolerance();
                    console.log(data);
                }
            }
        )
    }


    techniquetypeSelcetedChanged(any:any)
    {
        this.createBeamGroupForm.controls.chooseTolerance.setValue(false);
    }
}
