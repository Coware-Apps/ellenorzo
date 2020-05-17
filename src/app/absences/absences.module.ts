import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AbsencesPageRoutingModule } from './absences-routing.module';

import { AbsencesPage } from './absences.page';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../_components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AbsencesPageRoutingModule,
    TranslateModule,
    ComponentsModule,
  ],
  declarations: [AbsencesPage]
})
export class AbsencesPageModule { }
