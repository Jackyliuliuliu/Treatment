import * as moment from 'moment';
import { AppConsts } from '@shared/AppConsts';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Type, CompilerOptions, NgModuleRef } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { ACLService } from '@delon/acl';
import { MenuService } from '@delon/theme';

import * as _ from 'lodash';
import { ICONS_AUTO } from './style-icons-auto';
import { ICONS } from './style-icons';
import { NzIconService } from 'ng-zorro-antd';

export class AppPreBootstrap {

    constructor(
        private httpClient: HttpClient,
        private iconSrv: NzIconService
    ) {
        iconSrv.addIcon(...ICONS_AUTO, ...ICONS);
    }

    run(callback: () => void): void {
        this.getApplicationConfig(() => {
            this.getUserConfiguration(callback);

        });
    }

    static bootstrap<TM>(moduleType: Type<TM>, compilerOptions?: CompilerOptions | CompilerOptions[]): Promise<NgModuleRef<TM>> {
        return platformBrowserDynamic().bootstrapModule(moduleType, compilerOptions);
    }

    private getApplicationConfig(callback: () => void) {
        this.httpClient.get<any>('assets/appconfig.json', {
            headers: {
            },
        }
        ).subscribe(result => {
            AppConsts.appBaseUrl = result.appBaseUrl;
            AppConsts.remoteServiceBaseUrl = result.remoteServiceBaseUrl;
            window.localStorage.setItem( 'Rvs_RemoteServiceBaseUrl', AppConsts.remoteServiceBaseUrl);
            callback();
        });
    }

    private static getCurrentClockProvider(currentProviderName: string): abp.timing.IClockProvider {
        if (currentProviderName === "unspecifiedClockProvider") {
            return abp.timing.unspecifiedClockProvider;
        }

        if (currentProviderName === "utcClockProvider") {
            return abp.timing.utcClockProvider;
        }

        return abp.timing.localClockProvider;
    }

    private getUserConfiguration(callback: () => void): void {
        const cookieLangValue = abp.utils.getCookieValue('Abp.Localization.CultureName');
        const token = abp.auth.getToken();

        let requestHeaders = {
            '.AspNetCore.Culture': ('c=' + cookieLangValue + '|uic=' + cookieLangValue),
        };

        if (abp.multiTenancy.getTenantIdCookie()) {
            requestHeaders['Abp.TenantId'] = abp.multiTenancy.getTenantIdCookie().toString();
        }

        if (token) {
            requestHeaders['Authorization'] = 'Bearer ' + token;
        }

        this.httpClient.get<any>(AppConsts.remoteServiceBaseUrl + '/AbpUserConfiguration/GetAll',
            { headers: requestHeaders })
            .subscribe(configData => {
                let result = configData.result;

                _.merge(abp, result);

                abp.clock.provider = AppPreBootstrap.getCurrentClockProvider(result.clock.provider);

                moment.locale(abp.localization.currentLanguage.name);
                (window as any).moment.locale(abp.localization.currentLanguage.name);

                if (abp.clock.provider.supportsMultipleTimezone) {
                    moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
                    (window as any).moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
                }

                abp.event.trigger('abp.dynamicScriptsInitialized');
            });
    }
}