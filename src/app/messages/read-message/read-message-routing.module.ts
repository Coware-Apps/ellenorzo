import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReadMessagePage } from './read-message.page';

const routes: Routes = [
  {
    path: '',
    component: ReadMessagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReadMessagePageRoutingModule {}
