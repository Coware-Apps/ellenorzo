import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { UserAgentPage } from "./user-agent.page";

const routes: Routes = [
    {
        path: "",
        component: UserAgentPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class UserAgentPageRoutingModule {}
