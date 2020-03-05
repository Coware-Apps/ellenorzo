import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CommunityServicePageRoutingModule } from './community-service-routing.module';

import { CommunityServicePage } from './community-service.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CommunityServicePageRoutingModule,
  ],
  declarations: [CommunityServicePage]
})
export class CommunityServicePageModule { }
