import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';

import * as ApiServiceProxies from './service-proxies';

@NgModule({
    providers: [
        ApiServiceProxies.ConfigurationServiceProxy,
        ApiServiceProxies.BeamGroupServiceProxy,
        ApiServiceProxies.EnumServiceProxy,
        ApiServiceProxies.BeamsTreatmentRecordServiceProxy,
        ApiServiceProxies.BeamsTreatmentScheduleServiceProxy,
        ApiServiceProxies.PatientServiceProxy,
        ApiServiceProxies.MachinetreatmentScheduleServiceServiceProxy,
        ApiServiceProxies.BeamServiceProxy,
        ApiServiceProxies.ToleranceServiceProxy,
        ApiServiceProxies.LicenseServiceProxy,
        ApiServiceProxies.UserIdentityServiceProxy,
        ApiServiceProxies.PermissionServiceProxy,
        ApiServiceProxies.TableDisplayConfigServiceProxy,
        { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true }
    ]
})
export class ServiceProxyModule { }
