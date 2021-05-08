import { Component, OnInit, Injector, EventEmitter, Output } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { NzModalRef } from 'ng-zorro-antd';

@Component({
    selector: 'app-confirmwindow',
    templateUrl: './confirmwindow.component.html',
    styleUrls: ['./confirmwindow.component.less'],
})


export class ConfirmWindowComponent extends AppComponentBase implements OnInit {
    isConfirmViewVisible: boolean;

    constructor(
        injector: Injector,
        private _modal: NzModalRef) {
        super(injector);
    }

    ngOnInit() {
        this.isConfirmViewVisible = true;
    }

    confirmViewCancel(): void {
        this.isConfirmViewVisible = false;
        this._modal.destroy(false);
    }

    confirmViewOK(): void {
        this.isConfirmViewVisible = false;
        this._modal.destroy(true);
    }
}