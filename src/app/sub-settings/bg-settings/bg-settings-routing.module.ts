import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { BgSettingsPage } from "./bg-settings.page";

const routes: Routes = [
    {
        path: "",
        component: BgSettingsPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class BgSettingsPageRoutingModule {}
