import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AbsencesPage } from './absences.page';

const routes: Routes = [
  {
    path: '',
    component: AbsencesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AbsencesPageRoutingModule {}
