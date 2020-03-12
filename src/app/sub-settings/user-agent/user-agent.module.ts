import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UserAgentPageRoutingModule } from './user-agent-routing.module';

import { UserAgentPage } from './user-agent.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UserAgentPageRoutingModule,
    TranslateModule
  ],
  declarations: [UserAgentPage]
})
export class UserAgentPageModule { }
