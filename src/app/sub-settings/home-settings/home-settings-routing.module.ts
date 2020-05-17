import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeSettingsPage } from './home-settings.page';

const routes: Routes = [
  {
    path: '',
    component: HomeSettingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeSettingsPageRoutingModule {}
