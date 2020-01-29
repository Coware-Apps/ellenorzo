import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AverageGraphsPageRoutingModule } from './average-graphs-routing.module';

import { AverageGraphsPage } from './average-graphs.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AverageGraphsPageRoutingModule
  ],
  declarations: [AverageGraphsPage]
})
export class AverageGraphsPageModule {}
