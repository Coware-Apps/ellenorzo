import { Component } from "@angular/core";

import { Platform, ToastController, MenuController, NavController } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { AuthenticationService } from "./_services/authentication.service";
import { Router } from "@angular/router";
import { Storage } from "@ionic/storage";
import { ThemeService } from "./_services/theme.service";
import { AppService } from "./_services/app.service";
import { Student } from "./_models/student";
import { FirebaseX } from "@ionic-native/firebase-x/ngx";
import { NotificationService } from './_services/notification.service';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { ColorService } from './_services/color.service';
import { FormattedDateService } from './_services/formatted-date.service';
import { UserManagerService } from './_services/user-manager.service';
import { userInitData } from './_models/user';
import { AuthGuardService } from './_services/auth-guard.service';
import { Token } from './_models/token';
import { KretaService } from './_services/kreta.service';
import { PromptService } from './_services/prompt.service';

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"]
})
export class AppComponent {
  public appPages = this.app.appPages;
  public showAppPages: boolean = true;
  public student: Student;
  constructor(
    public userManager: UserManagerService,
    public app: AppService,

    private platform: Platform,
    private splashScreen: SplashScreen,
    private router: Router,
    private storage: Storage,
    private theme: ThemeService,
    private firebaseX: FirebaseX,
    private notificationService: NotificationService,
    private appVersion: AppVersion,
    private toastCtrl: ToastController,
    private color: ColorService,
    private authGuard: AuthGuardService,
    private menuCtrl: MenuController,
    private kreta: KretaService,
    private prompt: PromptService,
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    this.platform.ready().then(async () => {
      await this.initializeConfig();
      this.authGuard.activator = true;
      await this.navigate();
      this.splashScreen.hide();
      this.initializeDelayedConfig();
    });
  }

  //#region init and configs
  public async initializeDelayedConfig() {
    //runs AFTER the other config, we can use those values here
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
    let configs = await Promise.all([
      await this.appVersion.getVersionNumber(),
      await this.storage.get('analyticsCollectionEnabled') == false ? false : true,
      await this.storage.get('toastLoggingEnabled') == true ? true : false,
      await this.storage.get('devSettingsEnabled') == true ? true : false,
      await this.storage.get('localNotificationsEnabled') == true ? true : false,
      await this.storage.get('webApiRegistration'),
      await this.storage.get('userAgent'),
      await this.storage.get('cardColor'),
    ]);
    this.app.appV = configs[0];
    this.app.analyticsCollectionEnabled = configs[1];
    this.app.toastLoggingEnabled = configs[2];
    this.app.devSettingsEnabled = configs[3];
    this.app.localNotificationsEnabled = configs[4];
    let storedWebApiRegistration = configs[5];
    if (storedWebApiRegistration != null) {
      this.app.webUser = JSON.parse(storedWebApiRegistration);
    };
    let storedUA = configs[6];
    if (storedUA != null) {
      this.app.userAgent = storedUA;
    }
    if (configs[7] != null) {
      let cSplitted = configs[7].split('&');
      this.color.cardColors.fiveColor = cSplitted[0];
      this.color.cardColors.fourColor = cSplitted[1];
      this.color.cardColors.threeColor = cSplitted[2];
      this.color.cardColors.twoColor = cSplitted[3];
      this.color.cardColors.oneColor = cSplitted[4];
      this.color.cardColors.noneColor = cSplitted[5];
    }
    console.table(configs);

    let storedUsersInitData: userInitData[] = await this.storage.get("usersInitData");
    if (storedUsersInitData != null && storedUsersInitData.length > 0) {
      this.app.usersInitData = storedUsersInitData;
      this.userManager.createExistingUsers(storedUsersInitData);
      this.userManager.switchToUser(storedUsersInitData[0].id);
      this.app.isStudentSelectorReady = true;
    } else {
      await this.migrate();
    }

    //needs to run before the navigation (preInitialization needs login)
    this.notificationService.subscribeToLocalNotifications();
    if (this.app.localNotificationsEnabled) {
      this.userManager.allUsers.forEach(async user => {
        await user.preInitializeLocalNotifications();
      });
    }
  }

  //migration
  private async migrate() {
    let oldRefreshToken = await this.storage.get('refresh_token');
    if (oldRefreshToken != null) {
      let oldInstitute = await this.storage.get('institute');
      let newTokens = await this.kreta.renewToken(oldRefreshToken, oldInstitute);
      if (newTokens != null) {
        await this.userManager.addUser(newTokens, oldInstitute);
        await this.storage.remove('refresh_token');
        await this.storage.remove('institute');
        await this.menuCtrl.enable(true);
        this.app.isStudentSelectorReady = true;
      } else {
        this.prompt.presentUniversalAlert('Hiba', 'Sikertelen bejelentkezés', 'A bejelentkezési kísérlet sikertelen volt. Bizonyosodj meg róla, hogy van internetkapcsolat és indítsd újra az appot. Ha a hiba továbbra is fennál, új bejelentkezés szükséges.');
      }
    }
  }

  private async navigate() {
    if (this.app.usersInitData.length > 0) {
      let storedDefaultPage = await this.storage.get("defaultPage");
      if (storedDefaultPage != null) {

        await this.router.navigateByUrl(storedDefaultPage);
      } else {
        await this.router.navigateByUrl('home');
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

  checkConfig() {
    this.app.updated.subscribe(async state => {
      if (state == "updated") {
        this.appPages = await this.storage.get("sidemenu");
        this.app.finishConfig();
      }
    });
  }
  //#endregion
  public editUsers() {
    this.router.navigateByUrl("/user-settings");
    this.menuCtrl.close();
  }
  public async userChanged(newUser: userInitData) {
    if (this.userManager.currentUser.id != newUser.id) {
      this.userManager.switchToUser(newUser.id);
      this.userManager.reloader.next('reload')
    }
    this.menuCtrl.close();
  }
  public async menuClosed() {
    this.showAppPages = true;
  }
}
