import { Component, OnInit } from '@angular/core';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { AppService } from 'src/app/_services/app.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { LoadingController, MenuController, AlertController } from '@ionic/angular';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { Lesson } from 'src/app/_models/lesson';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.page.html',
  styleUrls: ['./notification-settings.page.scss'],
})
export class NotificationSettingsPage implements OnInit {
  private i = 0;
  constructor(
    public userManager: UserManagerService,
    public app: AppService,
    public notificationService: NotificationService,
    public loadingCtrl: LoadingController,
    private menuCtrl: MenuController,
    private alertCtrl: AlertController,
    private fDate: FormattedDateService,
  ) { }

  ngOnInit() {
    this.menuCtrl.enable(false);
  }

  ionViewWillleave() {
    this.menuCtrl.enable(true);
  }

  async toggleNotifications() {
    await this.app.changeConfig('localNotificationsEnabled', !this.app.localNotificationsEnabled);
    if (!this.app.localNotificationsEnabled) {
      await this.notificationService.cancelAllNotifications();
      this.userManager.allUsers.forEach(async user => {
        await user.localNotificationsEnabler(false);
      });
    }
  }
  async enableNotificationsForUser(userId: number) {
    let loading = await this.loadingCtrl.create({
      spinner: "crescent",
      message: "Művelet folyamatban..."
    });
    await loading.present();
    await this.notificationService.cancelAllNotifications();
    for (let i = 0; i < this.userManager.allUsers.length; i++) {
      if (this.userManager.allUsers[i].id == userId) {
        await this.userManager.allUsers[i].localNotificationsEnabler(true);
        await this.userManager.allUsers[i].setLocalNotifications(2);
        this.userManager.allUsers = this.userManager.allUsers;
      } else {
        await this.userManager.allUsers[i].localNotificationsEnabler(false);
      }
    }
    await loading.dismiss();
  }
  async showScheduledNotificactions() {
    //The local notifications plugin doesn't work reliably which means botching is the only way to display the scheduled notifications
    let loading = await this.loadingCtrl.create({
      spinner: "crescent",
      message: "Művelet folyamatban..."
    });
    loading.present();
    let msg: string = "";
    let allScheduled = await this.notificationService.getAllScheduledIds();
    let lessons: Lesson[] = [];
    let areScheduled: boolean = allScheduled.length > 0 ? true : false;
    this.userManager.allUsers.forEach(async user => {
      if (user.notificationsEnabled && this.app.localNotificationsEnabled) {
        //so that it doesn't update itself
        user.notificationsEnabled = false;
        lessons = await user.getLesson(this.fDate.getWeekFirst(0), this.fDate.getWeekLast(1), true);
        lessons.sort((a, b) => new Date(a.StartTime).valueOf() - new Date(b.StartTime).valueOf());
        lessons.forEach(lesson => {
          allScheduled.forEach(id => {
            if (lesson.LessonId == id) {
              msg += `<li>${lesson.Subject} - ${this.fDate.formatDateWithZerosAndDots(lesson.StartTime)} ${this.fDate.getTime(lesson.StartTime)}</li>`
            }
          });
        });
        user.notificationsEnabled = true;
        let alert = await this.alertCtrl.create({
          header: `Időzített értesítések (${allScheduled.length}db)`,
          subHeader: `Órák, amelyek előtt értesítés fog jönni`,
          message: `<ul>${msg}</ul>`,
        });
        await loading.dismiss();
        await alert.present();
      }
    });
    await loading.dismiss();
    if (!areScheduled) {
      let alert = await this.alertCtrl.create({
        header: `Időzített értesítések`,
        subHeader: `Fejlesztői funkció`,
        message: `Nincsenek időzített értesítések`,
      });
      await alert.present();
    }
  }
  async testNotification() {
    let lessons = await this.userManager.currentUser.getLesson(this.fDate.getWeekFirst(), this.fDate.getWeekLast(1), true);
      this.notificationService.testSetLocalNotifications(lessons)
  }
  async updateNotification() {
    let lessons = await this.userManager.currentUser.getLesson(this.fDate.getWeekFirst(), this.fDate.getWeekLast(0), true);
      this.notificationService.testUpdateLocalNotifications(lessons);
  }
}
