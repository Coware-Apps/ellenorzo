import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ColorPickerPageRoutingModule } from './color-picker-routing.module';

import { ColorPickerPage } from './color-picker.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ColorPickerPageRoutingModule
  ],
  declarations: [ColorPickerPage]
})
export class ColorPickerPageModule {}
