import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MessageListPage } from './message-list.page';

const routes: Routes = [
  {
    path: ':folder',
    component: MessageListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MessageListPageRoutingModule { }
