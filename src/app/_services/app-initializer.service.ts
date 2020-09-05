import { Injectable } from "@angular/core";
import { AppService } from "./app.service";
import { ThemeService } from "./theme.service";
import { UserManagerService } from "./user-manager.service";
import { PromptService } from "./prompt.service";
import { NotificationService } from "./notification.service";
import { Storage } from "@ionic/storage";
import { Platform } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StorageMigrationService } from "./data-migration.service";
import { FirebaseService } from "./firebase.service";

@Injectable({
    providedIn: "root",
})
export class AppInitializerService {
    constructor(
        private app: AppService,
        private userManager: UserManagerService,
        private theme: ThemeService,
        private notificationService: NotificationService,
        private storageMigrationService: StorageMigrationService,
        private firebase: FirebaseService,
        private storage: Storage
    ) {}

    async initializeApp() {
        await this.storageMigrationService.onInit();
        await Promise.all([
            this.app.onInit(),
            this.theme.onInit(),
            this.notificationService.onInit(),
            this.userManager.onInit(),
            this.firebase.onInit(),
        ]);
    }
}
