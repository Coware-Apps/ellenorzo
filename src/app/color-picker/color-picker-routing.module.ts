import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ColorPickerPage } from './color-picker.page';

const routes: Routes = [
  {
    path: '',
    component: ColorPickerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ColorPickerPageRoutingModule {}
