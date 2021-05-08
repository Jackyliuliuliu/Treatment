import { Component, Injector, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { Router, ActivatedRoute } from '@angular/router';
import { CurrentPatientService } from '@shared/service-proxies/current-patient.service';
import { CurrentModuleService } from '@shared/service-proxies/current-module.service';
import { LicenseComponent } from '@app/license/license.component';

@Component({
    selector: 'app-module-navigation',
    templateUrl: './module-navigation.component.html',
    styleUrls: ['./module-navigation.component.less']
})
export class ModuleNavigationComponent extends AppComponentBase implements OnInit {
    moduleMap: any;
    currentPatientId: number;
    @Input() moduleSelectedIndex: number;
    @Input() isShowPatientCard: true;
    @Output() moduleSelectedIndexChange = new EventEmitter();
    menuVal = 'RVS';

    @ViewChild('LicenseView')
    licenseView: LicenseComponent

    constructor(
        injector: Injector,
        private _router: Router,
        private _activatedRouter: ActivatedRoute,
        private _currentPatientService: CurrentPatientService
    ) {
        super(injector);
        this.currentPatientId = this._activatedRouter.queryParams['_value']['vPId'];
    }

    changeModule(data: string): void {
      this.menuVal = data;
      // console.log(data);
    }

    ngOnInit(): void {
        this.moduleMap = [
            // { Name: this.l('Beam Definition'), NavigatePath: 'beamdefinition'},
            // { Name: this.l('Treatment Schedule'), NavigatePath: 'treatment-schedule'},
            // { Name: this.l('Treatment Summary'), NavigatePath: 'treatment-summary'},
            // { Name: this.l('Machine Treatment Schedule'), NavigatePath: 'machine-treatment-schedule'},

            { Name: "射野管理", NavigatePath: 'beamdefinition'},
            { Name: "治疗排程", NavigatePath: 'treatment-schedule'},
            { Name: "治疗记录", NavigatePath: 'treatment-summary'},
            { Name: "机器治疗记录", NavigatePath: 'machine-treatment-schedule'},

            // { Name:'User Management',NavigatePath:'user-management'},
            // { Name:'Instution Management',NavigatePath:'instution-management'},
            //{ Name:'Tolerance',NavigatePath:'toleranceComponent'},
        ];

        abp.event.on('rvs.module.channged', router => {
            this.currentPatientId = router.queryParams['_value']['vPId'];
            this._currentPatientService.getCurrentPatient().subscribe(patient => this.currentPatientId = patient.id);
        });
    }

    selectedIndexChange(index: number) {
        this.moduleSelectedIndex = index;
        this._router.navigate(
            ['app', this.moduleMap[this.moduleSelectedIndex].NavigatePath],
            {queryParams: {vPId: this.currentPatientId}});
    }

    btnLicenseOnClick(){
        //this.testView.isCreatetsViewVisible = true;
        this.licenseView.isVisible = true;
    }
}