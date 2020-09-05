import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { AddresseeSelectorPage } from "./addressee-selector.page";

const routes: Routes = [
    {
        path: "",
        component: AddresseeSelectorPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AddresseeSelectorPageRoutingModule {}
