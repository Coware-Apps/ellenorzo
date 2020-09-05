import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { UserPageRoutingModule } from "./user-routing.module";

import { UserPage } from "./user.page";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, UserPageRoutingModule, TranslateModule],
    declarations: [UserPage],
})
export class UserPageModule {}
