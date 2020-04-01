import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InstituteSelectorModalPageRoutingModule } from './institute-selector-modal-routing.module';

import { InstituteSelectorModalPage } from './institute-selector-modal.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InstituteSelectorModalPageRoutingModule,
    TranslateModule,
  ],
  declarations: [InstituteSelectorModalPage]
})
export class InstituteSelectorModalPageModule { }
