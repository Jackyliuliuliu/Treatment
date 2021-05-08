import { NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JsonpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { TreeModule } from 'angular-tree-component';

import { NgZorroAntdModule, NZ_I18N, en_US } from 'ng-zorro-antd';

import { DelonModule } from '../delon.module';
import { AlainThemeModule } from '@delon/theme';
import { DelonABCModule } from '@delon/abc';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AbpModule } from '@abp/abp.module';

import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { SharedModule } from '@shared/shared.module';

import { HomeComponent } from '@app/home/home.component';
import { TreatmentScheduleComponent } from '@app/treatment-schedule/treatment-schedule.component';
import { BeamparameterComponent } from './main/beamparameter/beamparameter.component';
import { MlcComponent } from '@app/main/mlc/mlc.component';
import { CurrentPlanService } from '@shared/service-proxies/current-plan-service';
import { UserAuthorizationComponent } from '@app/treatment-schedule/modal-user-authorization/modal-user-authorization.component';
import { BatchDateChangeComponent } from '@app/treatment-schedule/batch-date-change/batch-date-change.component';
import { BatchDateShiftComponent } from '@app/treatment-schedule/batch-date-shift/batch-date-shift.component';
import { BatchTimeShiftComponent } from '@app/treatment-schedule/batch-time-shift/batch-time-shift.component';
import { EditApertureModalComponent } from './main/mlc/editAperture.component';
import { ScheduleService } from '@shared/schedule-service/schedule-service';
import { BeamDefinitionComponent } from '@app/main/beamdefinition/beamdefinition.component'
import { TreatmentSummaryComponent, Accuracy2Pipe, Accuracy1Pipe } from './treatment-summary/treatment-summary.component';
import { PatientCardComponent } from './patientCard/patientCard.component';
import { EnumMapsService } from '@shared/enum-service/enum-service';
import { BeamGroupComponent } from '@app/main/beamgroup/beamgroup.component';
import { CreatebeamgroupComponent } from './main/createbeamgroup/createbeamgroup.component';
import { BeamBarComponent } from '@app/main/beambar/beambar.component';
import { ConfirmWindowComponent } from '@app/main/confirmwindow/confirmwindow.component';
import { BeamBoardComponent } from '@app/main/beamboard/beamboard.component';
import { CurrentPatientService } from '@shared/service-proxies/current-patient.service';
import { CreateTreatmentSessionComponent } from './main/createtreatmentsession/createtreatmentsession.component';
import { BeamactionsComponent } from './main/beamparameter/beamactions/beamactions.component';
import { GetBeamIdService } from '@shared/service-proxies/get-beamId.service';
import { UpdateBeamInfoService } from '@shared/service-proxies/update-beamInfo.service';
import { TreatmentScheduleSettingComponent } from './treatment-schedule/treatment-schedule-setting/treatment-schedule-setting.component';
import { UserConfrimComponent } from '@app/main/userconfirm/userconfirm.component';
import { ModuleNavigationComponent } from './module-navigation/module-navigation.component';
import { CurrentModuleService } from '@shared/service-proxies/current-module.service';
import { MachineTreatmentScheduleComponent } from '@app/machine-treatment-schedule/machinetreatmentschedule.component';
import { TableResizableDirective } from './main/beamparameter/table-resizable.directive';
import { DoubleAccuracyPipe } from '@app/pipes/double-accuracy.pipe';
import { AddbeamComponent } from './main/beamparameter/beamactions/addbeam/addbeam.component';
import { DeletebeamComponent } from './main/beamparameter/beamactions/deletebeam/deletebeam.component';
import { CopybeamComponent } from './main/beamparameter/beamactions/copybeam/copybeam.component';
import { CopyModalComponent } from '@app/main/copymodal/copymodal.component';
import { ExportModalComponent } from '@app/main/exportmodal/exportmodal.component';
import en from '@angular/common/locales/en';
import { InstitutionComponent } from './Institution/institution.component';
import { UsersComponent } from './users/users.component';
import { ToleranceComponent } from './tolerance/tolerance.component';
import { LicenseComponent } from './license/license.component';
import { RecordPrintModalComponent } from '@app/treatment-summary/record-print-modal.component';
import { TolerancetableComponent } from './tolerance/tolerancetable/tolerancetable.component';
import { DateToStringPipe } from '@app/pipes/date-to-string.pipe';
import { TimeToStringPipe } from '@app/pipes/time-to-string.pipe';
import { BoolToAvtivePipe } from '@app/pipes/bool-to-active.pipe';
import { DeleteBeamGroupComponent } from '@app/main/deletebeamgroup/deletebeamgroup.component';
import { ToleranceDirectiveDirective } from './tolerance/tolerance-directive.directive';
import { SummarySettingComponent } from './treatment-summary/summarySetting.component';
import { ScheduleTimeChangeComponent } from '@app/treatment-schedule/schedule-time-change/schedule-time-change.component';
import { ScheduleDateChangeComponent } from '@app/treatment-schedule/schedule-date-change/schedule-date-change.component';
import { EditbeamgroupComponent } from './main/editbeamgroup/editbeamgroup.component';
import { EditbeamComponent } from './main/editbeam/editbeam.component';
import { EditbeamimagingComponent } from './main/editbeamimaging/editbeamimaging.component';
import { EditbevComponent } from './main/editbev/editbev.component';
import { CheckBlackslashDirective } from '@shared/validator/ngModelValidators';
import { CheckFloatCheck2 } from '@shared/validator/ngModelValidators';
import { CheckPositiveFloatCheck2 } from '@shared/validator/ngModelValidators';
import { CheckPositiveFloatCheck1 } from '@shared/validator/ngModelValidators';
import { CheckMinValidator } from '@shared/validator/ngModelValidators';
import { CheckMaxValidator } from '@shared/validator/ngModelValidators';
import { EditoffestComponent } from './main/editoffest/editoffest.component';
registerLocaleData(en);

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        TreatmentScheduleComponent,
        BeamparameterComponent,
        MlcComponent,
        UserAuthorizationComponent,
        BatchDateChangeComponent,
        BatchDateShiftComponent,
        BatchTimeShiftComponent,
        EditApertureModalComponent,
        BeamDefinitionComponent,
        TreatmentSummaryComponent,
        PatientCardComponent,
        BeamGroupComponent,
        CreatebeamgroupComponent,
        BeamBarComponent,
        ConfirmWindowComponent,
        BeamBoardComponent,
        CreateTreatmentSessionComponent,
        BeamactionsComponent,
        TreatmentScheduleSettingComponent,
        UserConfrimComponent,
        ModuleNavigationComponent,
        MachineTreatmentScheduleComponent,
        TableResizableDirective,
        DoubleAccuracyPipe,
        AddbeamComponent,
        DeletebeamComponent,
        CopybeamComponent,
        CopyModalComponent,
        ExportModalComponent,
        UsersComponent,
        InstitutionComponent,
        ToleranceComponent,
        LicenseComponent,
        RecordPrintModalComponent,
        TolerancetableComponent,
        DeleteBeamGroupComponent,
        ScheduleTimeChangeComponent,
        ScheduleDateChangeComponent,

        DateToStringPipe,
        TimeToStringPipe,
        BoolToAvtivePipe,
        Accuracy2Pipe,
        Accuracy1Pipe,
        ToleranceDirectiveDirective,
        SummarySettingComponent,
	EditbeamgroupComponent,
        EditbeamComponent,
        EditbeamimagingComponent,
        EditbevComponent,
        CheckBlackslashDirective,
        CheckFloatCheck2,
        CheckPositiveFloatCheck2,
        CheckPositiveFloatCheck1,
        CheckMinValidator,
        CheckMaxValidator,
        EditoffestComponent,

    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        JsonpModule,
        AbpModule,
        AppRoutingModule,
        ServiceProxyModule,
        SharedModule,
        NgZorroAntdModule.forRoot(),
        DelonModule.forRoot(),
        AlainThemeModule.forChild(),
        DelonABCModule,
        CurrentPlanService,
        TreeModule.forRoot()
    ],
    providers: [
        ScheduleService,
        EnumMapsService,
        CurrentPatientService,
        CurrentModuleService,
        GetBeamIdService,
        UpdateBeamInfoService,
        {
            provide: NZ_I18N, useValue: en_US
        }
    ],
    entryComponents: [
        TreatmentScheduleComponent,
        UserAuthorizationComponent,
        BatchDateChangeComponent,
        BatchDateShiftComponent,
        BatchTimeShiftComponent,
        EditApertureModalComponent,
        TreatmentSummaryComponent,
        TreatmentScheduleSettingComponent,
        RecordPrintModalComponent,
        UserConfrimComponent,
        ConfirmWindowComponent,
        ScheduleTimeChangeComponent,
        ScheduleDateChangeComponent,
    ],
    exports: [
    ]
})
export class AppModule { }
