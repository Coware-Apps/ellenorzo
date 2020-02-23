import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
  },
  {
    path: 'list',
    loadChildren: () => import('./list/list.module').then(m => m.ListPageModule),
  },
  {
    path: 'monthly-average',
    loadChildren: () => import('./monthly-average/monthly-average.module').then(m => m.MonthlyAveragePageModule),
  },
  {
    path: 'statistics',
    loadChildren: () => import('./statistics/statistics.module').then(m => m.StatisticsPageModule),
  },
  {
    path: 'graphs',
    loadChildren: () => import('./graphs/graphs.module').then(m => m.GraphsPageModule),
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
  },
  {
    path: 'average-graphs',
    loadChildren: () => import('./average-graphs/average-graphs.module').then(m => m.AverageGraphsPageModule)
  },
  {
    path: 'absences',
    loadChildren: () => import('./absences/absences.module').then(m => m.AbsencesPageModule)
  },
  {
    path: 'notes',
    loadChildren: () => import('./notes/notes.module').then(m => m.NotesPageModule)
  },
  {
    path: 'error',
    loadChildren: () => import('./error/error.module').then(m => m.ErrorPageModule)
  },
  {
    path: 'color-picker',
    loadChildren: () => import('./color-picker/color-picker.module').then(m => m.ColorPickerPageModule)
  },
  {
    path: 'bg-settings',
    loadChildren: () => import('./sub-settings/bg-settings/bg-settings.module').then(m => m.BgSettingsPageModule)
  },
  {
    path: 'homeworks',
    loadChildren: () => import('./homeworks/homeworks.module').then(m => m.HomeworksPageModule)
  },
  {
    path: 'hide-page-settings',
    loadChildren: () => import('./sub-settings/hide-page-settings/hide-page-settings.module').then(m => m.HidePageSettingsPageModule)
  },
  {
    path: 'timetable-homeworks',
    loadChildren: () => import('./list/timetable-homeworks/timetable-homeworks.module').then(m => m.TimetableHomeworksPageModule)
  },
  {
    path: 'tests',
    loadChildren: () => import('./tests/tests.module').then(m => m.TestsPageModule)
  },
  {
    path: 'evaluations',
    loadChildren: () => import('./evaluations/evaluations.module').then(m => m.EvaluationsPageModule)
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserPageModule)
  },
  {
    path: 'user-agent',
    loadChildren: () => import('./sub-settings/user-agent/user-agent.module').then(m => m.UserAgentPageModule)
  },
  {
    path: 'messages',
    loadChildren: () => import('./messages/messages.module').then(m => m.MessagesPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
