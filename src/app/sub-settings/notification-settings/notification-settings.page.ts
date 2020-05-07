import { Component, OnInit } from '@angular/core';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { AppService } from 'src/app/_services/app.service';
import { NotificationService } from 'src/app/_services/notification.service';
import { LoadingController, MenuController, AlertController } from '@ionic/angular';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { TranslateService } from '@ngx-translate/core';

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
    private translator: TranslateService,
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
      this.userManager.allUsers.forEach(user => {
        user.localNotificationsEnabler(false);
      });
      await this.app.changeConfig('usersInitData', this.app.usersInitData);
    }
  }

  async enableNotificationsForUser(userId: number) {
    console.log('userId', userId);
    let loading = await this.loadingCtrl.create({
      spinner: "crescent",
      message: this.translator.instant('pages.notification-settings.operationInProgressText')
    });
    await loading.present();
    await this.notificationService.cancelAllNotifications();
    for (let i = 0; i < this.userManager.allUsers.length; i++) {
      if (this.userManager.allUsers[i].id == userId) {
        this.userManager.allUsers[i].localNotificationsEnabler(true);
      } else {
        this.userManager.allUsers[i].localNotificationsEnabler(false);
      }
    }
    for (let i = 0; i < this.userManager.allUsers.length; i++) {
      if (this.userManager.allUsers[i].notificationsEnabled) {
        await this.userManager.allUsers[i].setLocalNotifications(2);
      }
    }
    await this.app.changeConfig('usersInitData', this.app.usersInitData);
    await loading.dismiss();
  }

  async showScheduledNotifications() {
    // The local notifications plugin doesn't work reliably which means botching is the only way to display the scheduled notifications
    let loading = await this.loadingCtrl.create({
      spinner: "crescent",
      message: this.translator.instant('pages.notification-settings.operationInProgressText')
    });
    await loading.present();

    let msg: string = "";
    let allNotifications = await this.notificationService.getAllNonDismissed();
    allNotifications = allNotifications.sort((a, b) => a.trigger.at.valueOf() - b.trigger.at.valueOf());

    allNotifications.forEach(notification => {
      msg += `<li>${notification.title} - ${this.fDate.formatDateWithZerosAndDots(notification.trigger.at)} ${this.fDate.getTime(notification.trigger.at)}</li>`
    });

    let alert = await this.alertCtrl.create({
      header: `${this.translator.instant('pages.notification-settings.scheduledNotifications.header')} (${allNotifications.length}db)`,
      subHeader: this.translator.instant('pages.notification-settings.scheduledNotifications.subHeader'),
      message: `<ol>${msg}</ol>`,
    });

    await loading.dismiss();
    await alert.present();
  }

  async cancelAllNotifications() {
    await this.notificationService.cancelAllNotifications();
  }


  // async testNotification() {
  //   let lessons = await this.userManager.currentUser.getLesson(this.fDate.getWeekFirst(), this.fDate.getWeekLast(1), true);
  //   this.notificationService.testSetLocalNotifications(lessons)
  // }
  // async updateNotification() {
  //   let lessons = await this.userManager.currentUser.getLesson(this.fDate.getWeekFirst(), this.fDate.getWeekLast(0), true);
  //   this.notificationService.testUpdateLocalNotifications(lessons);
  // }
  // async testBug(userId: number) {
  //   console.log('userId', userId);
  //   let loading = await this.loadingCtrl.create({
  //     spinner: "crescent",
  //     message: "Művelet folyamatban..."
  //   });
  //   await loading.present();
  //   await this.notificationService.cancelAllNotifications();
  //   for (let i = 0; i < this.userManager.allUsers.length; i++) {
  //     if (this.userManager.allUsers[i].id == userId) {
  //       this.userManager.allUsers[i].localNotificationsEnabler(true);
  //     } else {
  //       this.userManager.allUsers[i].localNotificationsEnabler(false);
  //     }
  //   }

  //   for (let i = 0; i < this.userManager.allUsers.length; i++) {
  //     if (this.userManager.allUsers[i].notificationsEnabled) {
  //       await this.userManager.allUsers[i].setLocalNotifications(2);
  //     }
  //   }
  //   await this.app.changeConfig('usersInitData', this.app.usersInitData);
  //   await loading.dismiss();
  // }
}
