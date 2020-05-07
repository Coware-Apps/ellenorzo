import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { FormattedDateService } from './formatted-date.service';
import { LocalNotifications, ILocalNotification } from '@ionic-native/local-notifications/ngx';
import { Router } from '@angular/router';
import { Lesson } from '../_models/lesson';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private fDate: FormattedDateService,
    private localNotifications: LocalNotifications,
    private translator: TranslateService,
  ) { }

  public async onInit() {
    this.subscribeToLocalNotifications();
  }

  public subscribeToLocalNotifications() {
    // Can inject it into the app initializer this way...
    // this.localNotifications.on("click").subscribe(res => {
    //   if (res.data) {
    //     this.router.navigate([res.data.navigateToUrl]);
    //   }
    // });
  }

  public setLocalNotifications(lessons: Lesson[]) {
    // console.groupCollapsed('[SCHEDULED NOTIFICATIONS]');
    // console.log('lessons', lessons);
    let toBeScheduled: ILocalNotification[] = [];
    let notificationTexts = this.translator.instant('services.notification');
    console.log('notificationTexts', notificationTexts);
    lessons.forEach(lesson => {
      //10 minutes before the lesson
      let triggerTime = new Date(this.fDate.returnCorrectTime(lesson.StartTime).getTime() - 600000);
      let stateNameIf = lesson.StateName ==
        'Elmaradt Tanóra' ?
        ` (${notificationTexts['canceledText']})` : lesson.DeputyTeacher != '' ?
          ` (${notificationTexts['substitutionText']})` : '';

      //only scheduling notifications that are in the future
      if (new Date(triggerTime).valueOf() > new Date().valueOf()) {
        let notificationOpts: ILocalNotification = {
          id: lesson.LessonId,
          title: `${notificationTexts['nextLessonText']}: ` + lesson.Subject + stateNameIf,
          text: `${notificationTexts['timeName']}: ` + this.fDate.getTimetableTime(lesson.StartTime, lesson.EndTime) + " - " + lesson.ClassRoom,
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

        toBeScheduled.push(notificationOpts);
        // console.log(`[NOTIFICATION SCHEDULED] ${notificationOpts.title} (${notificationOpts.id}) - ${new Date(notificationOpts.trigger.at)}`, notificationOpts);
      }
    });

    toBeScheduled = toBeScheduled.sort((a, b) => b.trigger.at.valueOf() - a.trigger.at.valueOf());
    this.localNotifications.schedule(toBeScheduled);

    // console.groupEnd();
  }

  public async cancelAllNotifications() {
    await this.localNotifications.cancelAll();
  }

  public async getAllScheduledIds(): Promise<number[]> {
    //This would be ideal, but it crashes the plugin
    //console.log(await this.localNotifications.getAllScheduled());
    return await this.localNotifications.getScheduledIds();
  }

  public async getAllNonDismissed(): Promise<ILocalNotification[]> {
    return await this.localNotifications.getAll();
  }
}
