import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MessagesPageRoutingModule } from './messages-routing.module';

import { MessagesPage } from './messages.page';
import { TranslateModule } from '@ngx-translate/core';
import { ExitGuard } from '../_guards/exit.guard';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MessagesPageRoutingModule,
    TranslateModule,
  ],
  providers: [ExitGuard],
  declarations: [MessagesPage]
})
export class MessagesPageModule { }
