import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { IonicModule } from "@ionic/angular";

import { NewMessagePageRoutingModule } from "./new-message-routing.module";

import { NewMessagePage } from "./new-message.page";
import { TranslateModule } from "@ngx-translate/core";
import { AttachmentOptionsComponent } from "./attachment-options/attachment-options.component";

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, NewMessagePageRoutingModule, TranslateModule],
    declarations: [NewMessagePage, AttachmentOptionsComponent],
})
export class NewMessagePageModule {}
