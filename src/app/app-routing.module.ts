import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";
import { NavigationGuard } from "./_guards/navigation-guard.guard";

const routes: Routes = [
    {
        path: "home",
        loadChildren: () => import("./home/home.module").then(m => m.HomePageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "list",
        loadChildren: () => import("./list/list.module").then(m => m.ListPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "statistics",
        loadChildren: () =>
            import("./statistics/statistics.module").then(m => m.StatisticsPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "graphs",
        loadChildren: () => import("./graphs/graphs.module").then(m => m.GraphsPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "settings",
        loadChildren: () => import("./settings/settings.module").then(m => m.SettingsPageModule),
    },
    {
        path: "login",
        loadChildren: () => import("./login/login.module").then(m => m.LoginPageModule),
    },
    {
        path: "averages",
        loadChildren: () => import("./averages/averages.module").then(m => m.AveragesPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "average-graphs",
        loadChildren: () =>
            import("./average-graphs/average-graphs.module").then(m => m.AverageGraphsPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "absences",
        loadChildren: () => import("./absences/absences.module").then(m => m.AbsencesPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "notes",
        loadChildren: () => import("./notes/notes.module").then(m => m.NotesPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "color-picker",
        loadChildren: () =>
            import("./color-picker/color-picker.module").then(m => m.ColorPickerPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "bg-settings",
        loadChildren: () =>
            import("./sub-settings/bg-settings/bg-settings.module").then(
                m => m.BgSettingsPageModule
            ),
        canActivate: [NavigationGuard],
    },
    {
        path: "homeworks",
        loadChildren: () => import("./homeworks/homeworks.module").then(m => m.HomeworksPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "hide-page-settings",
        loadChildren: () =>
            import("./sub-settings/hide-page-settings/hide-page-settings.module").then(
                m => m.HidePageSettingsPageModule
            ),
        canActivate: [NavigationGuard],
    },
    {
        path: "timetable-homeworks",
        loadChildren: () =>
            import("./timetable-homeworks/timetable-homeworks.module").then(
                m => m.TimetableHomeworksPageModule
            ),
        canActivate: [NavigationGuard],
    },
    {
        path: "tests",
        loadChildren: () => import("./tests/tests.module").then(m => m.TestsPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "evaluations",
        loadChildren: () =>
            import("./evaluations/evaluations.module").then(m => m.EvaluationsPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "user",
        loadChildren: () => import("./user/user.module").then(m => m.UserPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "user-agent",
        loadChildren: () =>
            import("./sub-settings/user-agent/user-agent.module").then(m => m.UserAgentPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "messages",
        loadChildren: () => import("./messages/messages.module").then(m => m.MessagesPageModule),
        canActivate: [NavigationGuard],
    },
    {
        path: "community-service",
        loadChildren: () =>
            import("./web-api/community-service/community-service.module").then(
                m => m.CommunityServicePageModule
            ),
        canActivate: [NavigationGuard],
    },
    {
        path: "user-settings",
        loadChildren: () =>
            import("./sub-settings/user-settings/user-settings.module").then(
                m => m.UserSettingsPageModule
            ),
        canActivate: [NavigationGuard],
    },
    {
        path: "notification-settings",
        loadChildren: () =>
            import("./sub-settings/notification-settings/notification-settings.module").then(
                m => m.NotificationSettingsPageModule
            ),
    },
    {
        path: "home-settings",
        loadChildren: () =>
            import("./sub-settings/home-settings/home-settings.module").then(
                m => m.HomeSettingsPageModule
            ),
        canActivate: [NavigationGuard],
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
