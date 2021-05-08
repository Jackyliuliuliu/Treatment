import { NgModule } from '@angular/core';

import { ValidationMessagesComponent } from './validation-messages.component';
import { CommonModule } from '@angular/common';
import { AppLocalizationService } from '@shared/utils/app-localization.service';
import { CustomNotifyService } from '@shared/utils/custom-notify.service';
import { CustomMessageService } from '@shared/utils/custom-message.service';

@NgModule({
    imports: [
        CommonModule
    ],
    providers: [
        AppLocalizationService,
        CustomNotifyService,
        CustomMessageService
    ],
    declarations: [
        ValidationMessagesComponent
    ],
    exports: [
        ValidationMessagesComponent,
    ]
})
export class UtilsModule { }
