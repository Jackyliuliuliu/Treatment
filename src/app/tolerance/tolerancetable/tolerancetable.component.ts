import { Component, OnInit, Input, Injector } from '@angular/core';
import { ToleranceDto, EnumServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/app-component-base';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { Inject } from '@angular/compiler/src/core';

@Component({
  selector: 'app-tolerancetable',
  templateUrl: './tolerancetable.component.html',
  styleUrls: ['./tolerancetable.component.less']
})
export class TolerancetableComponent extends AppComponentBase implements OnInit {

  isVisible = false;

  @Input()
  toleranceInfo: ToleranceDto;


  toleranceTable = [];

  constructor(
    private enumService:EnumServiceProxy,
    private nzmessage: NzMessageService,
    injector: Injector,
  ) {
    super(injector);
  }

  ngOnInit() {
  }

  showModal(): void {

    if(this.toleranceInfo == null)
    {
      this.nzmessage.warning("公差信息获取失败");
      return;
    }

    this.enumService.getMap("TechniqueType").subscribe(
      data=>
      {

        try {
          var technique;
          for (let k in data) {
            if (data[k] == this.toleranceInfo.technique) {
              technique = k;
              throw new Error('get technique');
            }
          }

        } catch (error) {

        }

        this.toleranceTable=[
          {field:this.l('Tolerance Lable'),value:this.toleranceInfo.toleranceTableLabel},
          {field:this.l('Technique Tolerance'),value:technique},
          {field:this.l('Gantry Angle Tolerance(°)'),value:this.toleranceInfo.gantryAngle},
          {field:this.l('Patient Support Angle Tolerance(°)'),value:this.toleranceInfo.patientSupportAngle},
          {field:this.l('Collimator Angle Tolerance(°)'),value:this.toleranceInfo.beamLimitingDeviceAngle},
          {field:this.l('Table VRT Tolerance(cm)'),value:this.toleranceInfo.tableVRT},
          {field:this.l('Table LAT Tolerance(cm)'),value:this.toleranceInfo.tableLAT},
          {field:this.l('Table LNG Tolerance(cm)'),value:this.toleranceInfo.tableLNG},
          {field:this.l('JAW_X Tolerance(cm)'),value:this.toleranceInfo.beamLimitingDevicePosition_X},
          {field:this.l('JAW_Y Tolerance(cm)'),value:this.toleranceInfo.beamLimitingDevicePosition_Y},
          {field:this.l('JAW_ASYMX Tolerance(cm)'),value:this.toleranceInfo.beamLimitingDevicePosition_ASYMX},
          {field:this.l('JAW_ASYMY Tolerance(cm)'),value:this.toleranceInfo.beamLimitingDevicePosition_ASYMY},
          {field:this.l('MLCX Tolerance(cm)'),value:this.toleranceInfo.beamLimitingDevicePosition_MLCX},
        ];
      }
    )
    this.isVisible = true;
  }

  handleOk(): void {
    console.log('Button ok clicked!');
    this.isVisible = false;
  }

  handleCancel(): void {
    console.log('Button cancel clicked!');
    this.isVisible = false;
  }


}
