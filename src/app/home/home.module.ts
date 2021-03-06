import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { HomePageRoutingModule } from "./home-routing.module";

import { HomePage } from "./home.page";
import { ColorPickerPageModule } from "../color-picker/color-picker.module";
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "../_components/components.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        HomePageRoutingModule,
        ColorPickerPageModule,
        TranslateModule,
        ComponentsModule,
    ],
    declarations: [HomePage],
})
export class HomePageModule {}
