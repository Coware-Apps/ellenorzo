import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { ColorPickerPageRoutingModule } from "./color-picker-routing.module";

import { ColorPickerPage } from "./color-picker.page";
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "../_components/components.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ColorPickerPageRoutingModule,
        TranslateModule,
        ComponentsModule,
    ],
    declarations: [ColorPickerPage],
})
export class ColorPickerPageModule {}
