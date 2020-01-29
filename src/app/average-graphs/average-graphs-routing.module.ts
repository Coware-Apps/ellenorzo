import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AverageGraphsPage } from './average-graphs.page';

const routes: Routes = [
  {
    path: '',
    component: AverageGraphsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AverageGraphsPageRoutingModule {}
