import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { TimetableHomeworksPage } from "./timetable-homeworks.page";

const routes: Routes = [
    {
        path: "",
        component: TimetableHomeworksPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TimetableHomeworksPageRoutingModule {}
