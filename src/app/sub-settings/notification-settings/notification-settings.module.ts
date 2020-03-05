import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NotificationSettingsPageRoutingModule } from './notification-settings-routing.module';

import { NotificationSettingsPage } from './notification-settings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotificationSettingsPageRoutingModule
  ],
  declarations: [NotificationSettingsPage]
})
export class NotificationSettingsPageModule {}
