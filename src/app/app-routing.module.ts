import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuardService as AuthGuard } from './_services/auth-guard.service';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'list',
    loadChildren: () => import('./list/list.module').then(m => m.ListPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'monthly-average',
    loadChildren: () => import('./monthly-average/monthly-average.module').then(m => m.MonthlyAveragePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'statistics',
    loadChildren: () => import('./statistics/statistics.module').then(m => m.StatisticsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'graphs',
    loadChildren: () => import('./graphs/graphs.module').then(m => m.GraphsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule),
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'averages',
    loadChildren: () => import('./averages/averages.module').then(m => m.AveragesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'average-graphs',
    loadChildren: () => import('./average-graphs/average-graphs.module').then(m => m.AverageGraphsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'absences',
    loadChildren: () => import('./absences/absences.module').then(m => m.AbsencesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'notes',
    loadChildren: () => import('./notes/notes.module').then(m => m.NotesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'color-picker',
    loadChildren: () => import('./color-picker/color-picker.module').then(m => m.ColorPickerPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'bg-settings',
    loadChildren: () => import('./sub-settings/bg-settings/bg-settings.module').then(m => m.BgSettingsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'homeworks',
    loadChildren: () => import('./homeworks/homeworks.module').then(m => m.HomeworksPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'hide-page-settings',
    loadChildren: () => import('./sub-settings/hide-page-settings/hide-page-settings.module').then(m => m.HidePageSettingsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'timetable-homeworks',
    loadChildren: () => import('./list/timetable-homeworks/timetable-homeworks.module').then(m => m.TimetableHomeworksPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'tests',
    loadChildren: () => import('./tests/tests.module').then(m => m.TestsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'evaluations',
    loadChildren: () => import('./evaluations/evaluations.module').then(m => m.EvaluationsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'user-agent',
    loadChildren: () => import('./sub-settings/user-agent/user-agent.module').then(m => m.UserAgentPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'messages',
    loadChildren: () => import('./messages/messages.module').then(m => m.MessagesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'community-service',
    loadChildren: () => import('./web-api/community-service/community-service.module').then(m => m.CommunityServicePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'user-settings',
    loadChildren: () => import('./sub-settings/user-settings/user-settings.module').then(m => m.UserSettingsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'notification-settings',
    loadChildren: () => import('./sub-settings/notification-settings/notification-settings.module').then(m => m.NotificationSettingsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'events',
    loadChildren: () => import('./events/events.module').then(m => m.EventsPageModule),
    canActivate: [AuthGuard]
  }




];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
