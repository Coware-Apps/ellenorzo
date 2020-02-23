import { Component } from "@angular/core";

import { Platform, ToastController } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { AuthenticationService } from "./_services/authentication.service";
import { Router } from "@angular/router";
import { Storage } from "@ionic/storage";
import { ThemeService } from "./_services/theme.service";
import { AppService } from "./_services/app.service";
import { KretaService } from "./_services/kreta.service";
import { Student } from "./_models/student";
import { FirebaseX } from "@ionic-native/firebase-x/ngx";
import { NotificationService } from './_services/notification.service';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { ColorService } from './_services/color.service';
import { FormattedDateService } from './_services/formatted-date.service';

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"]
})
export class AppComponent {
  public appPages = this.app.appPages;
  public student: Student;
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private authService: AuthenticationService,
    private router: Router,
    private storage: Storage,
    private theme: ThemeService,
    private app: AppService,
    private kreta: KretaService,
    private firebaseX: FirebaseX,
    private notificationService: NotificationService,
    private appVersion: AppVersion,
    private toastCtrl: ToastController,
    private color: ColorService,
    private fDate: FormattedDateService,
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    this.platform.ready().then(async () => {
      await this.initializeConfig();
      await this.navigate();
      this.splashScreen.hide();
      this.initializeDelayedConfig();
    });
  }

  public async initializeDelayedConfig() {
    //runs AFTER the other config, we can use those values here
    //We will initialize 2 weeks worth of notifications on the beginning of every week. These might (most likely will) get overwritten by
    //fresher notifications, that will happen every time the user refreshes the timetable for any reason. (other than LAB requests)
    let lastStoredWeek = await this.storage.get('timetableNotificationsLastSaved');

    if (this.authService.authenticationState.value && this.app.localNotificationsEnabled && (lastStoredWeek == null || this.fDate.getWeek(lastStoredWeek) != this.fDate.getWeek(new Date()))) {
      //this automatically reinitializes the notfications
      await this.kreta.getLesson(this.fDate.getWeekFirst(0), this.fDate.getWeekLast(1), true);
      this.notificationService.subscribeToLocalNotifications();
      await this.storage.set('timetableNotificationsLastSaved', new Date());
    }

    //from the firebase console (by the devs or whoever has access to it)
    this.firebaseX.onMessageReceived().subscribe(m => {
      if (m.tap == null) {
        //received in the foreground
        this.notificationToast(m.title, m.body, true);
        console.log("m", m);
      } else {
        //received in the background
        console.log("m", m);
        this.router.navigate([m.navigateToUrl]);
      }
    });
  }

  public async initializeConfig() {
    await this.getAppPages();
    await this.setTheme();
    this.app.appV = await this.appVersion.getVersionNumber();
    this.app.analyticsCollectionEnabled = await this.storage.get('analyticsCollectionEnabled') == false ? false : true;
    this.app.toastLoggingEnabled = await this.storage.get('toastLoggingEnabled') == true ? true : false;
    this.app.devSettingsEnabled = await this.storage.get('devSettingsEnabled') == true ? true : false;
    this.app.localNotificationsEnabled = await this.storage.get('localNotificationsEnabled') == false ? false : true;
    let storedUA = await this.storage.get('userAgent');
    if (storedUA != null) {
      this.app.userAgent = storedUA;
    }
  }

  checkConfig() {
    this.app.updated.subscribe(async state => {
      if (state == "updated") {
        this.appPages = await this.storage.get("sidemenu");
        this.app.finishConfig();
      }
    });
  }

  private async navigate() {
    if (await this.storage.get('refresh_token') != null) {
      let storedDefaultPage = await this.storage.get("defaultPage");
      if (storedDefaultPage != null) {

        console.log('navResult', await this.router.navigateByUrl(storedDefaultPage));
        console.log('Navigating to url', storedDefaultPage);
      } else {
        await this.router.navigateByUrl('home');
        console.log('navigating to timetable');
      }
    } else {
      this.router.navigate(["login"]);
    }
  }

  private async setTheme() {
    let storedTheme = await this.storage.get("theme");
    if (storedTheme == null) {
      this.storage.set("theme", "light");
    }

    switch (await this.storage.get("theme")) {
      case "light":
        this.theme.enableLight();
        break;
      case "dark":
        this.theme.enableDark();
        break;
      case "minimalDark":
        this.theme.enableMinimalDark();
        break;
      case "custom":
        this.theme.enableCustom();
        break;
    }
  }

  private async getAppPages(): Promise<any> {
    let storedPages = await this.storage.get("sidemenu")
    if (storedPages != null) {
      for (let i = 0; i < storedPages.length; i++) {
        this.appPages[i].show = storedPages[i].show;
      }
    }
    return this.appPages;
  }

  private notificationToast(title: string, body: string, autoHide: boolean) {
    this.presentToast(title + ': ' + body, autoHide);
  }

  private async presentToast(message: string, autoDismiss: boolean) {
    let topToast = await this.toastCtrl.getTop();
    if (topToast != null) {
      this.toastCtrl.dismiss();
    }
    const toast = await this.toastCtrl.create({
      message: message,
      duration: autoDismiss ? 10000 : 0,
      cssClass: this.color.getToastClass(),
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
        }
      ]
    });
    toast.present();
  }

}
