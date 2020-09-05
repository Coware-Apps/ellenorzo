import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { NewMessagePage } from "./new-message.page";
import { ExitGuard } from "src/app/_guards/exit.guard";

const routes: Routes = [
    {
        path: "",
        component: NewMessagePage,
        canDeactivate: [ExitGuard],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class NewMessagePageRoutingModule {}
