import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TestsPage } from './tests.page';

const routes: Routes = [
  {
    path: '',
    component: TestsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestsPageRoutingModule {}
