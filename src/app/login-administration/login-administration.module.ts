import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LoginAdministrationPageRoutingModule } from './login-administration-routing.module';

import { LoginAdministrationPage } from './login-administration.page';
import { ComponentsModule } from '../_components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginAdministrationPageRoutingModule,
    TranslateModule,
    ComponentsModule,
  ],
  declarations: [LoginAdministrationPage]
})
export class LoginAdministrationPageModule { }
