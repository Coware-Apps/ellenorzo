import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { NotesPageRoutingModule } from "./notes-routing.module";

import { NotesPage } from "./notes.page";
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "../_components/components.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        NotesPageRoutingModule,
        TranslateModule,
        ComponentsModule,
    ],
    declarations: [NotesPage],
})
export class NotesPageModule {}
