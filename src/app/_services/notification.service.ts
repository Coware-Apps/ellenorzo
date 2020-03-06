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

  public subscribeToLocalNotifications() {
    this.localNotifications.on("click").subscribe(res => {
      if (res.data != undefined) {
        this.router.navigate([res.data.navigateToUrl]);
      }
    });
  }
  public setLocalNotifications(lessons: Lesson[]) {
    console.groupCollapsed('[SCHEDULED NOTIFICATIONS]');
    console.log('lessons', lessons);
    lessons.forEach(lesson => {
      //10 minutes before the lesson
      let triggerTime = new Date(new Date(lesson.StartTime).getTime() - 600000);
      let stateNameIf = lesson.StateName == 'Elmaradt Tanóra' ? '(Elmarad)' : lesson.DeputyTeacher != '' ? '(Helyettesítés)' : '';

      //only scheduling notifications that are in the future
      if (new Date(triggerTime).valueOf() > new Date().valueOf()) {
        let notificationOpts: ILocalNotification = {
          id: lesson.LessonId,
          title: "Következő óra: " + lesson.Subject + ' ' + stateNameIf,
          text: "Időpont: " + this.fDate.getTimetableTime(lesson.StartTime, lesson.EndTime) + " - " + lesson.ClassRoom,
          foreground: true,
          group: 'timetable',
          smallIcon: 'res://ic_notification_small',
          timeoutAfter: 900000,
          data: {
            'navigateToUrl': 'list',
          },
          trigger: {
            at: triggerTime,
          }
        };
        this.localNotifications.schedule(notificationOpts);
        console.log(`[NOTIFICATION SCHEDULED] ${notificationOpts.title} (${notificationOpts.id}) - ${new Date(notificationOpts.trigger.at)}`, notificationOpts);
      }
    });
    console.groupEnd();
  }
  public async cancelAllNotifications() {
    await this.localNotifications.cancelAll();
  }
  public async updateNotifications(lessons: Lesson[]) {
    let scheduledNotificationIds = await this.localNotifications.getScheduledIds();
    let idsToUpdate: number[] = [];
    lessons.forEach(lesson => {
      idsToUpdate.push(lesson.LessonId);
    });
    await this.localNotifications.cancel(idsToUpdate);
    console.log('canceling and renewing ids', idsToUpdate);
    lessons.forEach(lesson => {
      if (scheduledNotificationIds.includes(lesson.LessonId)) {
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
      }
    });
  }
  public async getAllScheduledIds(): Promise<number[]> {
    //This would be ideal, but it crashes the plugin
    //console.log(await this.localNotifications.getAllScheduled());
    return await this.localNotifications.getScheduledIds();
  }
  public async getAllNonDismissed(): Promise<ILocalNotification[]> {
    return await this.localNotifications.getAll();
  }
  public testSetLocalNotifications(lessons: Lesson[]) {
    console.groupCollapsed('[SCHEDULED NOTIFICATIONS]');
    let i = 0;
    lessons.forEach(lesson => {
      //10 minutes before the lesson
      let triggerTime = new Date(new Date().getTime() + i * 10000);
      let stateNameIf = lesson.StateName == 'Elmaradt Tanóra' ? '(Elmarad)' : lesson.DeputyTeacher != '' ? '(Helyettesítés)' : '';

      //only scheduling notifications that are 5 minutes or more in the future
      if (new Date(triggerTime).valueOf() + 300000 > new Date().valueOf()) {
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
        console.log(`[NOTIFICATION SCHEDULED] ${notificationOpts.title} (${notificationOpts.id}) - ${new Date(notificationOpts.trigger.at)}`, notificationOpts);
      }
      i++;
    });
    console.groupEnd();
  }
  public async testUpdateLocalNotifications(lessons: Lesson[]) {
    let scheduledNotificationIds = await this.localNotifications.getScheduledIds();
    let idsToUpdate: number[] = [];
    lessons.forEach(lesson => {
      idsToUpdate.push(lesson.LessonId);
    });
    await this.localNotifications.cancel(idsToUpdate);
    console.log('canceling and renewing ids', idsToUpdate);
    let i = 0;
    lessons.forEach(lesson => {
      if (scheduledNotificationIds.includes(lesson.LessonId)) {
        //10 minutes before the lesson
        let triggerTime: Date = new Date(new Date().getTime() + i * 10000);
        i++;
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
        console.log(`[NOTIFICATION SCHEDULED] ${notificationOpts.title} (${notificationOpts.id}) - ${new Date(notificationOpts.trigger.at)}`, notificationOpts);
      }
    });
  }




  public async enableLocalNotifications(timetable: Lesson[]) {
    await this.setLocalNotifications(timetable);
    await this.subscribeToLocalNotifications();
  }

  public async disableLocalNotifications() {
    await this.localNotifications.cancelAll();
    await this.storage.remove('lastNotificationWeek');
  }
}
