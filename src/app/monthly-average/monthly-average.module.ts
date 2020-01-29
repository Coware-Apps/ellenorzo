import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MonthlyAveragePageRoutingModule } from './monthly-average-routing.module';

import { MonthlyAveragePage } from './monthly-average.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MonthlyAveragePageRoutingModule
  ],
  declarations: [MonthlyAveragePage]
})
export class MonthlyAveragePageModule {}
