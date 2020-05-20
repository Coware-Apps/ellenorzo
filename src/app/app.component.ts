import { Component } from "@angular/core";

import { Platform, MenuController } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { Router } from "@angular/router";
import { Storage } from "@ionic/storage";
import { ThemeService } from "./_services/theme.service";
import { AppService } from "./_services/app.service";
import { Student } from "./_models/student";
import { UserManagerService } from './_services/user-manager.service';
import { userInitData } from './_models/user';

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
    private router: Router,
    private storage: Storage,
    private menuCtrl: MenuController,
    private plt: Platform,
    private splashScreen: SplashScreen,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    if (this.userManager.allUsers && this.userManager.allUsers.length > 0) {
      this.router.navigateByUrl(this.app.defaultPage).then(() => {
        this.splashScreen.hide();
      })
    } else {
      this.router.navigateByUrl('/login').then(() => {
        this.splashScreen.hide();
      })
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
  async showUserInfo(userId: number) {
    this.userManager.switchToUser(userId);
    this.menuCtrl.close();
    this.router.navigateByUrl('/user');
  }
}
