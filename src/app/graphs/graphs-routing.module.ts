import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GraphsPage } from './graphs.page';

const routes: Routes = [
  {
    path: '',
    component: GraphsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GraphsPageRoutingModule {}
