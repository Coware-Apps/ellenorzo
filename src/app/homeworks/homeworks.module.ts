import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomeworksPageRoutingModule } from './homeworks-routing.module';

import { HomeworksPage } from './homeworks.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomeworksPageRoutingModule
  ],
  declarations: [HomeworksPage]
})
export class HomeworksPageModule {}
