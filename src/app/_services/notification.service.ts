import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { FormattedDateService } from './formatted-date.service';
import { LocalNotifications, ILocalNotification } from '@ionic-native/local-notifications/ngx';
import { Router } from '@angular/router';
import { AppService } from './app.service';
import { Lesson } from '../_models/lesson';
import { PromptService } from './prompt.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private storage: Storage,
    private fDate: FormattedDateService,
    private localNotifications: LocalNotifications,
    private router: Router,
    private app: AppService,
    private prompt: PromptService,
  ) { }

  public async initializeLocalNotifications(timetable: Lesson[]) {
    this.localNotifications.cancelAll();
    console.log('[NOTIFICATIONS] (re)initializing local notifications');
    this.prompt.butteredToast('[NOTIFICATIONS] (re)initializing local notifications');
    timetable.forEach(lesson => {
      //10 minutes before the lesson
      let triggerTime: Date = new Date(new Date(lesson.StartTime).getTime() - 600000);
      let stateNameIf = lesson.StateName == 'Elmaradt Tanóra' ? '(Elmarad)' : lesson.DeputyTeacher != '' ? '(Helyettesítés)' : '';

      let notificationOpts: ILocalNotification = {
        id: lesson.LessonId,
        title: "Következő óra: " + lesson.Subject + ' ' + stateNameIf,
        text: "Időpont: " + this.fDate.getTimetableTime(lesson.StartTime, lesson.EndTime) + " - " + lesson.ClassRoom,
        foreground: true,
        group: 'timetable',
        data: {
          'navigateToUrl': 'list',
        },
        trigger: {
          at: triggerTime,
        }
      };
      this.localNotifications.schedule(notificationOpts);
    });
  }

  public subscribeToLocalNotifications() {
    this.localNotifications.on("click").subscribe(res => {
      if (res.data != undefined) {
        this.router.navigate([res.data.navigateToUrl]);
      }
    });
    this.localNotifications.on("trigger").subscribe(res => {
      if (res.data != undefined) {
        this.router.navigate([res.data.navigateToUrl]);
      }
    });
  }

  public async enableLocalNotifications(timetable: Lesson[]) {
    await this.initializeLocalNotifications(timetable);
    await this.subscribeToLocalNotifications();
  }

  public async disableLocalNotifications() {
    await this.localNotifications.cancelAll();
    await this.storage.remove('lastNotificationWeek');
  }

  public testLocalNotification(title: string, message: string, id: number) {
    let notificationOpts: ILocalNotification = {
      id: id,
      title: title,
      text: message,
      foreground: true,
      trigger: { at: new Date(new Date().getTime() + 3600) }
    };
    this.localNotifications.schedule()
  }
}
