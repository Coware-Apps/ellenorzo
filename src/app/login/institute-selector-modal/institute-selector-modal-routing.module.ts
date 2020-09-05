import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { InstituteSelectorModalPage } from "./institute-selector-modal.page";

const routes: Routes = [
    {
        path: "",
        component: InstituteSelectorModalPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InstituteSelectorModalPageRoutingModule {}
