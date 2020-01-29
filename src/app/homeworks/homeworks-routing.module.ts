import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeworksPage } from './homeworks.page';

const routes: Routes = [
  {
    path: '',
    component: HomeworksPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeworksPageRoutingModule {}
