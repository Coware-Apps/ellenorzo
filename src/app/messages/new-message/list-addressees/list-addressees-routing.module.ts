import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { ListAddresseesPage } from "./list-addressees.page";

const routes: Routes = [
    {
        path: "",
        component: ListAddresseesPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ListAddresseesPageRoutingModule {}
