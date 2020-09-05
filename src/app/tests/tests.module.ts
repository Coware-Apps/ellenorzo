import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { TestsPageRoutingModule } from "./tests-routing.module";

import { TestsPage } from "./tests.page";
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "../_components/components.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        TestsPageRoutingModule,
        TranslateModule,
        ComponentsModule,
    ],
    declarations: [TestsPage],
})
export class TestsPageModule {}
