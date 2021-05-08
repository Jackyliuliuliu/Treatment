import { Component, Injector, Input, Output,EventEmitter, ViewChild } from "@angular/core";
import { NzModalRef } from "ng-zorro-antd";
import { AppComponentBase } from "@shared/app-component-base";
import { ControlPointDto } from "@shared/service-proxies/service-proxies";
import { ControlPointInfo } from "@app/main/beamparameter/beamparameter.component";


@Component({
    selector: 'editApertureModal',
    templateUrl: './editAperture.component.html'
})

export class EditApertureModalComponent extends AppComponentBase {

   
    // @Input()
    // controlPointsData: ControlPointInfo;
    @Input()
    currentLeafShape:any;


    constructor(
        injector: Injector,
        private _modal: NzModalRef,
    ) {
        super(injector);
        console.log("init edit info");
      }
}

