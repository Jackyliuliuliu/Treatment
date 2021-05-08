import { Component, OnInit } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { LicenseOutput, LicenseServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-license',
    templateUrl:'./license.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./license.component.less']
})

export class LicenseComponent implements OnInit{
    isVisible: boolean;
    allLicense: LicenseOutput[] = [];

    constructor(private _licenseServiceProxy: LicenseServiceProxy){

    }

    ngOnInit(): void {
        this._licenseServiceProxy.getAllLicense().pipe().subscribe((result: LicenseOutput[]) => {
            this.allLicense = result;
        })
    }

    handleCancel(){
        this.isVisible = false;
    }

    handleOk(){
        this.isVisible = false;
    }
}