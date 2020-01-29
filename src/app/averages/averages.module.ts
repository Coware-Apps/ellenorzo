import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AveragesPageRoutingModule } from './averages-routing.module';

import { AveragesPage } from './averages.page';
import { AverageGraphsPageModule } from '../average-graphs/average-graphs.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AveragesPageRoutingModule,
    AverageGraphsPageModule
  ],
  declarations: [
    AveragesPage,
  ]
})
export class AveragesPageModule {}
