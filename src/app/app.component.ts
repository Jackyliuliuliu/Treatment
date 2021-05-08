import { Component, Injector, OnInit, ElementRef, Renderer2, Inject, ViewChild, TemplateRef } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { SettingsService } from '@delon/theme';
import { DOCUMENT } from '@angular/common';
import { NzEmptyService } from 'ng-zorro-antd';
import { ActivatedRoute } from '@angular/router';
import { AppAuthorization} from '@shared/Permission/AppAuthorization';

@Component({
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent extends AppComponentBase implements OnInit {
    @ViewChild('customEmpty') customEmpty: TemplateRef<any>; // tslint:disable-line:no-any
    selectedIndex: number;

    constructor(
        injector: Injector,
        private el: ElementRef,
        private nzEmptyService: NzEmptyService,
        private renderer: Renderer2,
        private settings: SettingsService,
        private _activatedRouter: ActivatedRoute,
        @Inject(DOCUMENT) private doc: any,
    ) {
        super(injector);
    }

    ngOnInit(): void {
        const token = this._activatedRouter.queryParams['_value']['token'];
        AppAuthorization.setToken(token);
        this.nzEmptyService.setDefaultContent(this.customEmpty);
        abp.event.on('abp.notifications.received', userNotification => {
            abp.notifications.showUiNotifyForUserNotification(userNotification);

            //Desktop notification
            Push.create("AbpZeroTemplate", {
                body: userNotification.notification.data.message,
                icon: abp.appPath + 'assets/app-logo-small.png',
                timeout: 6000,
                onClick: function () {
                    window.focus();
                    this.close();
                }
            });
        });

        this._activatedRouter.firstChild.url.subscribe(data => this.selectedModuleChanged(data[0].path));
        abp.event.on('rvs.module.channged', router => {
            let path = router.url.value[0].path;
            this.selectedModuleChanged(path);
        });
    }

    private selectedModuleChanged(moduleName: string) {
        switch (moduleName) {
            case "beamdefinition":
                this.selectedIndex = 0;
                break;
            case "treatment-schedule":
                this.selectedIndex = 1;
                break;
            case "treatment-summary":
                this.selectedIndex = 2;
                break;
            case "machine-treatment-schedule":
                this.selectedIndex = 3;
                break;
            case "toleranceComponent":
                this.selectedIndex = 4;
                break;
            }
    }
}