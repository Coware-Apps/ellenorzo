import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { ReadMessagePageRoutingModule } from "./read-message-routing.module";

import { ReadMessagePage } from "./read-message.page";
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "src/app/_components/components.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ReadMessagePageRoutingModule,
        TranslateModule,
        ComponentsModule,
    ],
    declarations: [ReadMessagePage],
})
export class ReadMessagePageModule {}
