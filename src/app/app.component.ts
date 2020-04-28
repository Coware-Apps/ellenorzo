import { Component } from "@angular/core";

import { Platform, ToastController, MenuController } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { Router } from "@angular/router";
import { Storage } from "@ionic/storage";
import { ThemeService } from "./_services/theme.service";
import { AppService } from "./_services/app.service";
import { Student } from "./_models/student";
import { FirebaseX } from "@ionic-native/firebase-x/ngx";
import { NotificationService } from './_services/notification.service';
import { ColorService } from './_services/color.service';
import { UserManagerService } from './_services/user-manager.service';
import { userInitData } from './_models/user';
import { AuthGuardService } from './_services/auth-guard.service';
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
    public theme: ThemeService,
    public app: AppService,

    private platform: Platform,
    private splashScreen: SplashScreen,
    private router: Router,
    private storage: Storage,
    private firebaseX: FirebaseX,
    private notificationService: NotificationService,
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
    await this.app.onInit();
    await this.theme.onInit();
    await this.color.onInit();
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

  private async getAppPages(): Promise<any> {
    await this.storage.get("sidemenu")
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
    }
    this.menuCtrl.close();
  }
  public async menuClosed() {
    this.showAppPages = true;
  }
}
