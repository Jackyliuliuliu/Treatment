import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AppRouteGuard } from '@shared/auth/auth-route-guard';
import { HomeComponent } from './home/home.component';
import { BeamDefinitionComponent } from '@app/main/beamdefinition/beamdefinition.component';
import { TreatmentSummaryComponent } from './treatment-summary/treatment-summary.component';
import { TreatmentScheduleComponent } from '@app/treatment-schedule/treatment-schedule.component';
import { MachineTreatmentScheduleComponent } from '@app/machine-treatment-schedule/machinetreatmentschedule.component';
import { UsersComponent } from './users/users.component';
import { InstitutionComponent } from './Institution/institution.component';
import { ToleranceComponent } from './tolerance/tolerance.component';
import { LicenseComponent } from './license/license.component';
import { SummarySettingComponent } from './treatment-summary/summarySetting.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: AppComponent,
                children: [
                    { path: 'home', component: HomeComponent, canActivate: [AppRouteGuard] },
                    { path: 'treatment-schedule', component: TreatmentScheduleComponent, canActivate: [AppRouteGuard] },
                    { path: 'beamdefinition', component: BeamDefinitionComponent, canActivate: [AppRouteGuard] },
                    { path: 'treatment-summary', component: TreatmentSummaryComponent, canActivate: [AppRouteGuard]},
                    {
                        path: 'machine-treatment-schedule',
                        canActivate: [AppRouteGuard],
                        component: MachineTreatmentScheduleComponent
                        // loadChildren: '@app/machine-treatment-schedule/machinetreatment.module#MachineTreatmentScheduleModule'
                    },
                    {path: 'user-management', component: UsersComponent, canActivate: [AppRouteGuard]},
                    {path: 'instution-management', component: InstitutionComponent, canActivate: [AppRouteGuard]},
                    {path: 'toleranceComponent', component: ToleranceComponent, canActivate: [AppRouteGuard]},
                    {path: 'licenseComponent', component: LicenseComponent, canActivate: [AppRouteGuard]},
                    {path:'summary-setting',component: SummarySettingComponent,canActivate:[AppRouteGuard]}
                ]
            },
        ])
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }