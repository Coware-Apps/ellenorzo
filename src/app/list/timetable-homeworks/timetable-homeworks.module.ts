import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TimetableHomeworksPageRoutingModule } from './timetable-homeworks-routing.module';

import { TimetableHomeworksPage } from './timetable-homeworks.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TimetableHomeworksPageRoutingModule,
    TranslateModule,
  ],
  declarations: [TimetableHomeworksPage]
})
export class TimetableHomeworksPageModule { }
