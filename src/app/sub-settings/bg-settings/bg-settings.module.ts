import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { BgSettingsPageRoutingModule } from "./bg-settings-routing.module";

import { BgSettingsPage } from "./bg-settings.page";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, BgSettingsPageRoutingModule, TranslateModule],
    declarations: [BgSettingsPage],
})
export class BgSettingsPageModule {}
