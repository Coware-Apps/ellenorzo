import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UserAgentPageRoutingModule } from './user-agent-routing.module';

import { UserAgentPage } from './user-agent.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UserAgentPageRoutingModule
  ],
  declarations: [UserAgentPage]
})
export class UserAgentPageModule {}
