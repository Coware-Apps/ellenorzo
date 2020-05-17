import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AveragesPageRoutingModule } from './averages-routing.module';

import { AveragesPage } from './averages.page';
import { AverageGraphsPageModule } from '../average-graphs/average-graphs.module';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../_components/components.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AveragesPageRoutingModule,
    AverageGraphsPageModule,
    TranslateModule,
    ComponentsModule,
  ],
  declarations: [
    AveragesPage,
  ]
})
export class AveragesPageModule { }
