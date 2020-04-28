import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ListAddresseesPageRoutingModule } from './list-addressees-routing.module';

import { ListAddresseesPage } from './list-addressees.page';
import { ComponentsModule } from 'src/app/_components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListAddresseesPageRoutingModule,
    TranslateModule,
    ComponentsModule,
  ],
  declarations: [ListAddresseesPage]
})
export class ListAddresseesPageModule { }
