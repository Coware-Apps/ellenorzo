import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginAdministrationPage } from './login-administration.page';

const routes: Routes = [
  {
    path: '',
    component: LoginAdministrationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginAdministrationPageRoutingModule {}
