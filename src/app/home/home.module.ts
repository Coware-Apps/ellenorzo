import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, PickerController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { ColorPickerPageModule } from '../color-picker/color-picker.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    ColorPickerPageModule
  ],
  declarations: [
    HomePage
  ]
})
export class HomePageModule {}
