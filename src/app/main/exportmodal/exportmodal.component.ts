import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';



@Component({
    selector: 'app-exportmodal',
    templateUrl: './exportmodal.component.html',
    styleUrls: ['./exportmodal.component.less'],
})

export class ExportModalComponent extends AppComponentBase implements OnInit {
    constructor(
        injector: Injector,
        ) {
        super(injector);
    }

    ngOnInit() {}

    showExportModal(): void {
        this.message.info("on work...");
       // this.isCopyViewVisible = true;
    }
}