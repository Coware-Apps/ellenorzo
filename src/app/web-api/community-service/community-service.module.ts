import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CommunityServicePageRoutingModule } from './community-service-routing.module';

import { CommunityServicePage } from './community-service.page';
import { InstituteSelectorModalPageModule } from 'src/app/login/institute-selector-modal/institute-selector-modal.module';
import { WebLoginInfoComponent } from 'src/app/_components/web-login-info/web-login-info.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CommunityServicePageRoutingModule,
    InstituteSelectorModalPageModule,
  ],
  declarations: [CommunityServicePage],
  entryComponents: [WebLoginInfoComponent]
})
export class CommunityServicePageModule { }
