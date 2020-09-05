import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { StatisticsPageRoutingModule } from "./statistics-routing.module";

import { StatisticsPage } from "./statistics.page";
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "../_components/components.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        StatisticsPageRoutingModule,
        TranslateModule,
        ComponentsModule,
    ],
    declarations: [StatisticsPage],
})
export class StatisticsPageModule {}
