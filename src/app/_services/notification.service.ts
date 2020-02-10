import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { FormattedDateService } from './formatted-date.service';
import { LocalNotifications, ILocalNotification } from '@ionic-native/local-notifications/ngx';
import { Router } from '@angular/router';
import { AppService } from './app.service';
import { Lesson } from '../_models/lesson';

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
  ) { }

  public async initializeLocalNotifications(timetable: Lesson[]) {
    let weekCriteria = (await this.storage.get("lastNotificationWeek")) != this.fDate.getWeek(new Date());

    if (weekCriteria) {
      //the current week's notifications have not been set yet and notifications are enabled
      timetable.forEach(lesson => {
        //10 minutes before the lesson
        console.log('lesson', lesson);
        let triggerTime = new Date(new Date(lesson.StartTime).getTime() - 600000);

        let notificationOpts: ILocalNotification = {
          id: lesson.LessonId,
          title: "Következő óra: " + lesson.Subject,
          text: "Időpont: " + this.fDate.getTimetableTime(lesson.StartTime, lesson.EndTime) + " - " + lesson.ClassRoom,
          foreground: true,
          trigger: { at: triggerTime }
        };
        console.log("notificationOptions", notificationOpts);
        this.localNotifications.schedule(notificationOpts);
      });
      this.storage.set("lastNotificationWeek", this.fDate.getWeek(new Date()));
    }
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
