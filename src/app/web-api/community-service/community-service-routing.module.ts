import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CommunityServicePage } from './community-service.page';

const routes: Routes = [
  {
    path: '',
    component: CommunityServicePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CommunityServicePageRoutingModule {}
