import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { UserSettingsPageRoutingModule } from "./user-settings-routing.module";

import { UserSettingsPage } from "./user-settings.page";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        UserSettingsPageRoutingModule,
        TranslateModule,
    ],
    declarations: [UserSettingsPage],
})
export class UserSettingsPageModule {}
