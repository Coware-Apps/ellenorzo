import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { HomeSettingsPageRoutingModule } from "./home-settings-routing.module";

import { HomeSettingsPage } from "./home-settings.page";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        HomeSettingsPageRoutingModule,
        TranslateModule,
    ],
    declarations: [HomeSettingsPage],
})
export class HomeSettingsPageModule {}
