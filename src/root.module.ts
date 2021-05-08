import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Injector, APP_INITIALIZER, LOCALE_ID } from '@angular/core';

import { AbpModule } from '@abp/abp.module';
import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';

import { SharedModule } from '@shared/shared.module';
import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { RootRoutingModule } from './root-routing.module';

import { AppConsts } from '@shared/AppConsts';
import { API_BASE_URL } from '@shared/service-proxies/service-proxies';

import { RootComponent } from './root.component';
import { AppPreBootstrap } from './AppPreBootstrap';
import { HttpClientModule } from '@angular/common/http';

import { NgZorroAntdModule, NZ_I18N, zh_CN, NzIconService } from 'ng-zorro-antd';
import { FormsModule } from '@angular/forms';
import { registerLocaleData} from '@angular/common';
import zh from '@angular/common/locales/zh';
import { DelonModule } from './delon.module';

import { CustomMessageService } from '@shared/utils/custom-message.service';
import { CustomNotifyService } from '@shared/utils/custom-notify.service';
import { UtilsModule } from '@shared/utils/utils.module';
import * as _ from 'lodash';


registerLocaleData(zh);

export function appInitializerFactory(
    injector: Injector) {
    return () => {
        const zorroMessage = injector.get(CustomMessageService);
        zorroMessage.Init();

        const zorroNotify = injector.get(CustomNotifyService);
        zorroNotify.Init();

        let bootstrap = new AppPreBootstrap(injector.get(HttpClient), injector.get(NzIconService));

        bootstrap.run(() => {
            });

    }
}

export function shouldLoadLocale(): boolean {
    return abp.localization.currentLanguage.name && abp.localization.currentLanguage.name !== 'en-US';
}

export function getRemoteServiceBaseUrl(): string {
    let url = AppConsts.remoteServiceBaseUrl;
    if (url === undefined || url === null || url === 'undefined') {
        url = window.localStorage.getItem( 'Rvs_RemoteServiceBaseUrl');
    }
    console.log( 'getRemoteServiceBaseUrl:' + url);
    return url;
}

export function getCurrentLanguage(): string {
    return abp.localization.currentLanguage.name;
}

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule.forRoot(),
        AbpModule,
        ServiceProxyModule,
        RootRoutingModule,
        HttpClientModule,
        NgZorroAntdModule.forRoot(),
        FormsModule,
        DelonModule.forRoot(),
        UtilsModule
    ],
    declarations: [
        RootComponent
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true },
        { provide: API_BASE_URL, useFactory: getRemoteServiceBaseUrl },
        {
            provide: APP_INITIALIZER,
            useFactory: appInitializerFactory,
            deps: [Injector],
            multi: true
        },
        {
            provide: LOCALE_ID,
            useFactory: getCurrentLanguage
        },
        { provide: NZ_I18N, useValue: zh_CN }
    ],
    bootstrap: [RootComponent]
})
export class RootModule {

}
