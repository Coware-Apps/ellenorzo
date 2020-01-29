import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InstituteSelectorModalPageRoutingModule } from './institute-selector-modal-routing.module';

import { InstituteSelectorModalPage } from './institute-selector-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InstituteSelectorModalPageRoutingModule
  ],
  declarations: [InstituteSelectorModalPage]
})
export class InstituteSelectorModalPageModule {}
