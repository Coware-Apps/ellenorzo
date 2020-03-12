import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HidePageSettingsPageRoutingModule } from './hide-page-settings-routing.module';

import { HidePageSettingsPage } from './hide-page-settings.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HidePageSettingsPageRoutingModule,
    TranslateModule,
  ],
  declarations: [HidePageSettingsPage]
})
export class HidePageSettingsPageModule { }
