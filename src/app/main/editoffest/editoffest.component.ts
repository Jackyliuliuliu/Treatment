import { Component, OnInit, Input, Injector, Output,EventEmitter } from '@angular/core';
import { TreeNode } from 'angular-tree-component/dist/defs/api';
import { NzMessageService } from 'ng-zorro-antd';
import { AppComponentBase } from '@shared/app-component-base';
import { BeamGroupDto, BeamGroupServiceProxy, BeamDto, PatientSetupDto } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'app-editoffest',
  templateUrl: './editoffest.component.html',
  styleUrls: ['./editoffest.component.css']
})
export class EditoffestComponent extends AppComponentBase implements OnInit {

  @Input()
  isEditPermission: boolean;
  @Input()
  patientID: number;
  @Input()
  beamGroupID: string;
  @Input()
  beamGroupList: TreeNode[];
  @Input()
  beamGroupNode: TreeNode;
  @Output()
  public confirmactionOffset = new EventEmitter<boolean>();

  isEditoffset: boolean;
  beamGroupDto: BeamGroupDto;
  offsetList: any[] = [];
  isgatingControl: boolean;
  gatingModelControl: string;
  gatingModelList: any[] = [{ label: "振幅", value: 0 }, { label: "时相", value: 1 }];

  constructor(
    injector: Injector,
    private nzmessage: NzMessageService,
    private _beamGroupService: BeamGroupServiceProxy,
  ) {
    super(injector);
  }

  ngOnInit() {

  }

  editOffset(): void {
    var beamGroupNode = this.beamGroupList.find(beamGroup => beamGroup.id == this.beamGroupID);
    if (beamGroupNode != null) {
      if (beamGroupNode.isApprove) {
        this.nzmessage.error("已批准射野组下的射野不允许编辑！");
        return;
      }
    }
    this.reset();
    this.initData();
  }

  reset() {
    this.offsetList = [];
    this.isgatingControl = false;
    this.gatingModelControl = "";
  }

  async initData(): Promise<boolean | undefined> {
    if (this.beamGroupID === null || this.beamGroupID === undefined) {
      this.nzmessage.error("射野组信息获取失败");
      this.isEditoffset = false;
      return;
    } else {
      this._beamGroupService.getBeamGroupInfoByIndex(parseInt(this.beamGroupID))
        .pipe()
        .subscribe(
          (result: BeamGroupDto) => {
            if (result != undefined && result != null) {
              this.beamGroupDto = result;
              if (this.beamGroupDto.isGating) {
                this.isgatingControl = true;
                if (this.beamGroupDto.gatingModel == 0 || this.beamGroupDto.gatingModel == 1) {
                  this.gatingModelControl = this.gatingModelList[this.beamGroupDto.gatingModel];
                }
              } else {
                this.isgatingControl = false;
                this.gatingModelControl = "";
              }
              this.getOffSetInfo(result);
              this.isEditoffset = true;
            }
          }
        )
    }
  }

  changeGatingStatus(value: any): void {
    if (value != undefined && value != null) {
      if (!value) {
        this.isgatingControl = false;

      } else {
        this.isgatingControl = true;
      }
      this.gatingModelControl = null;
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
            VRT: `${vrt}`,
            LAT: `${lat}`,
            LNG: `${lng}`,
            beams: [],
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

  cancelEdit(): void {
    this.isEditoffset = false;
  }

  submitEdit():any{
    var updateOffset = this.offsetList;
    if (updateOffset != undefined && updateOffset != null && updateOffset.length > 0) {
      updateOffset.forEach(item => {
        if (item.beams != undefined && item.beams != null && item.beams.length > 0 && this.beamGroupDto.beams != undefined
          && this.beamGroupDto.beams != null && this.beamGroupDto.beams.length > 0) {
          item.beams.forEach(beamTemp => {
            var beamDto = this.beamGroupDto.beams.find(item => item.id == beamTemp);
            if (beamDto.patientSetUp == null) {
              beamDto.patientSetUp = new PatientSetupDto();
            }
            beamDto.patientSetUp.tableTopLateralSetupDisplacement = item.LAT;
            beamDto.patientSetUp.tableTopLongitudinalSetupDisplacement = item.LNG;
            beamDto.patientSetUp.tableTopVerticalSetupDisplacement = item.VRT;
          })
        }
      })

     this._beamGroupService.updateOffset(this.beamGroupDto)
        .toPromise()
        .then((result: boolean) => {
          var ret = result as boolean;
          if (ret) {
            this.nzmessage.success(this.l("update beam group sucessfully"));
            this.isEditoffset = false;
            this.confirmactionOffset.emit(true);
          }
          else {
            this.message.error(this.l("update beam group failed"));
        }
      })
    }
  }

}
