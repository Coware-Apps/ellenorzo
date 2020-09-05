import { Component } from "@angular/core";

import { MenuController } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { Router } from "@angular/router";
import { Storage } from "@ionic/storage";
import { ThemeService } from "./_services/theme.service";
import { AppService } from "./_services/app.service";
import { Student } from "./_models/kreta-v2/student";
import { UserManagerService } from "./_services/user-manager.service";
import { userInitData } from "./_models/user";
import BackgroundFetch from "cordova-plugin-background-fetch";
import { FirebaseService } from "./_services/firebase.service";
import { KretaV3Service } from "./_services";

@Component({
    selector: "app-root",
    templateUrl: "app.component.html",
    styleUrls: ["app.component.scss"],
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
        private splashScreen: SplashScreen,
        private firebase: FirebaseService,
        private kretaV3service: KretaV3Service
    ) {
        this.initializeApp();
    }

    async initializeApp() {
        await this.router.navigateByUrl(
            this.userManager.allUsers?.length > 0 ? this.app.defaultPage : "/login"
        );

        this.splashScreen.hide();
        this.enableBgFetch();
    }

    enableBgFetch() {
        BackgroundFetch.scheduleTask({
            taskId: "com.transistorsoft.notifications",
            //half an hour, reduce this to idk save battery or something
            delay: 60 * 30 * 1000,
            periodic: true,
            enableHeadless: true,
            stopOnTerminate: false,
        });
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
            this.firebase.logEvent("change_user");

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
        this.router.navigateByUrl("/user");
    }
}
