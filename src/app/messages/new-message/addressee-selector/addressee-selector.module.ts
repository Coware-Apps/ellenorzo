import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddresseeSelectorPageRoutingModule } from './addressee-selector-routing.module';

import { AddresseeSelectorPage } from './addressee-selector.page';
import { ComponentsModule } from 'src/app/_components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddresseeSelectorPageRoutingModule,
    ComponentsModule,
    TranslateModule,
  ],
  declarations: [AddresseeSelectorPage]
})
export class AddresseeSelectorPageModule { }
