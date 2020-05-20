import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { ThemeService } from './theme.service';
import { UserManagerService } from './user-manager.service';
import { ColorService } from './color.service';
import { PromptService } from './prompt.service';
import { NotificationService } from './notification.service';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {

  constructor(
    private app: AppService,
    private userManager: UserManagerService,
    private theme: ThemeService,
    private color: ColorService,
    private notificationService: NotificationService
  ) {

  }

  async initializeApp() {
    console.log('APPINITIALIZER STARTED AT', new Date().valueOf());
    return Promise.all([
      this.app.onInit(),
      this.theme.onInit(),
      this.color.onInit(),
      this.notificationService.onInit(),
      this.userManager.onInit(),
    ]);
  }
}
