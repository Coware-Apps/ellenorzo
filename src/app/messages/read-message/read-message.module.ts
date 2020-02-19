import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ReadMessagePageRoutingModule } from './read-message-routing.module';

import { ReadMessagePage } from './read-message.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReadMessagePageRoutingModule
  ],
  declarations: [ReadMessagePage]
})
export class ReadMessagePageModule {}
