import { Component, Injector } from "@angular/core";
import { NzModalRef } from "ng-zorro-antd";
import { AppComponentBase } from "@shared/app-component-base";
import { BeamsTreatmentRecordServiceProxy } from "@shared/service-proxies/service-proxies";
import { ReportPrint } from '@shared/report-print/report-print';

@Component({
    selector: 'record-print-modal',
    templateUrl: './record-print-modal.component.html',
    styleUrls: ['./record-print-modal.component.less']
})

export class RecordPrintModalComponent extends AppComponentBase {
    constructor(
        injector: Injector,
        private _modal: NzModalRef,
        private _treatmentRecordService: BeamsTreatmentRecordServiceProxy) {
        super(injector);
    }

    beagroupList: Array<{ id: number, value: string }> = new Array<{ id: number, value: string }>();

    selectedBeamGroupId: number;

    cancel() {
        this._modal.close();
    }

    print() {
        if (this.selectedBeamGroupId !== undefined) {
            const newWindow = window.open();
            this._treatmentRecordService.printBeamGroupRecord(this.selectedBeamGroupId).subscribe(
                (ret) => {
                    const print = new ReportPrint();
                    print.DisplayPrintPreview(ret, newWindow);
                    this._modal.close();
                });
        } else {
            this._modal.close();
        }
    }
}
