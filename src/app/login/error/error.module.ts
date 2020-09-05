import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { ErrorPageRoutingModule } from "./error-routing.module";

import { ErrorPage } from "./error.page";
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "src/app/_components/components.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ErrorPageRoutingModule,
        TranslateModule,
        ComponentsModule,
    ],
    declarations: [ErrorPage],
})
export class ErrorPageModule {}
