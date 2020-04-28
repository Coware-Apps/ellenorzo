import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MessagesPage } from './messages.page';

const routes: Routes = [
  {
    path: "list",
    component: MessagesPage,
    children: [
      {
        path: "",
        loadChildren: () => import("./message-list/message-list.module").then(m => m.MessageListPageModule),
      },
    ],
  },
  {
    path: "",
    redirectTo: "list/inbox",
    component: MessagesPage
  },
  {
    path: 'read-message',
    loadChildren: () => import('./read-message/read-message.module').then(m => m.ReadMessagePageModule)
  },
  {
    path: 'new-message',
    loadChildren: () => import('./new-message/new-message.module').then(m => m.NewMessagePageModule),
  },
  {
    path: 'addressee-selector',
    loadChildren: () => import('./new-message/addressee-selector/addressee-selector.module').then(m => m.AddresseeSelectorPageModule)
  },
  {
    path: 'list-addressees',
    loadChildren: () => import('./new-message/list-addressees/list-addressees.module').then(m => m.ListAddresseesPageModule)
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MessagesPageRoutingModule { }
