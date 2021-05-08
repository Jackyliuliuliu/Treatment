import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';



@Component({
    selector: 'app-copymodal',
    templateUrl: './copymodal.component.html',
})

export class CopyModalComponent extends AppComponentBase implements OnInit {

    isCopyViewVisible:boolean;

    constructor(
        injector: Injector,
        ) {
        super(injector);
    }

    ngOnInit() {}

    showCopyModal(): void {
        this.message.info("on work...");
       // this.isCopyViewVisible = true;
    }
    
    userViewCancel(): void {
        console.log('Button cancel clicked!');
        //this.isCopyViewVisible = false;
    }
}