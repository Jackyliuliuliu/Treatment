import { CommonModule } from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { AbpModule } from '@abp/abp.module';
import { RouterModule } from '@angular/router';

import { AppUrlService } from './nav/app-url.service';
import { AppAuthService } from './auth/app-auth.service';
import { AppRouteGuard } from './auth/auth-route-guard';
import { MaterialInput } from "shared/directives/material-input.directive";
import { NumberOnlyDirective } from './directives/number-only.directive';

@NgModule({
    imports: [
        CommonModule,
        AbpModule,
        RouterModule
    ],
    declarations: [
        MaterialInput,
        NumberOnlyDirective
    ],
    exports: [
        MaterialInput,
        NumberOnlyDirective
    ]
})
export class SharedModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: SharedModule,
            providers: [
                AppUrlService,
                AppAuthService,
                AppRouteGuard
            ]
        }
    }
}
