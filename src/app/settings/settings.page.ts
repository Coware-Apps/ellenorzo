import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../_services/theme.service';
import { Storage } from '@ionic/storage';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { LoadingController, MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ColorService } from '../_services/color.service';
import { AppService } from '../_services/app.service';
import { KretaService } from '../_services/kreta.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { UserManagerService } from '../_services/user-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  customAlertOptions: any = {
    header: this.translator.instant('pages.settings.pages.startingPageName'),
    cssClass: this.color.getPopUpClass(),
  };
  customPopoverOptions: any = {
    cssClass: this.color.getPopUpClass(),
  };

  public currentTheme: string;
  public defaultPage: string;
  public appPages: {
    title: string,
    url: string,
    icon: string,
    show: boolean,
    translatorVal?: string;
  }[];
  private devCounter: number;

  public unsubscribe$: Subject<void>;

  constructor(
    public app: AppService,

    private kreta: KretaService,
    private theme: ThemeService,
    private storage: Storage,
    private camera: Camera,
    private router: Router,
    private color: ColorService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private menuCtrl: MenuController,
    private translator: TranslateService,
    private userManager: UserManagerService,
    private loadingCtrl: LoadingController,
  ) {
    this.appPages = this.app.appPages;
  }


  async ngOnInit() {
    //#region themes
    let storedTheme = await this.storage.get('theme');
    if (storedTheme == null) {
      this.storage.set('theme', 'light')
    }
    this.currentTheme = this.theme.currentTheme.value;
    //#endregion

    //#region default page
    let a = await this.storage.get('defaultPage');
    if (a == null) {
      this.defaultPage = "/home";
    }
    else {
      this.defaultPage = a;
    }
    //#endregion
    this.devCounter = this.app.devSettingsEnabled ? 9 : 0;

    this.firebase.setScreenName('settings');
  }

  async ionViewDidEnter() {
    this.unsubscribe$ = new Subject();
    this.app.registerHwBackButton(this.unsubscribe$);
    await this.menuCtrl.enable(true);
  }

  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  //#region themes
  enableDark() {
    this.theme.enableDark();
    this.currentTheme = "dark";
    this.storage.set('theme', 'dark')
  }

  enableMinimalDark() {
    this.theme.enableMinimalDark();
    this.currentTheme = "minimalDark";
    this.storage.set('theme', 'minimalDark')
  }

  enableLight() {
    this.theme.enableLight();
    this.currentTheme = "light";
    this.storage.set('theme', 'light')
  }

  async enableCustom() {
    this.theme.enableCustom();
    this.currentTheme = "custom";
    this.storage.set('theme', 'custom')
  }
  //#endregion

  //#region starting pages
  selectorChanged(event: any) {
    this.setDefaultPage(event.detail.value);
  }

  setDefaultPage(pagePath: string) {
    this.storage.set('defaultPage', pagePath);
  }
  //#endregion

  hidePages() {
    this.router.navigateByUrl('/hide-page-settings');
  }

  async currentLngChanged(event) {
    this.app.currentLng = event.detail.value;
    if (this.app.localNotificationsEnabled) {
      this.userManager.allUsers.forEach(async user => {
        if (user.notificationsEnabled) {
          let loading = await this.loadingCtrl.create({
            spinner: "crescent",
            message: this.translator.instant('pages.notification-settings.operationInProgressText')
          });
          try {
            loading.present();
            await user.setLocalNotifications(2);
          } catch (error) {
            this.prompt.toast('Unable to change notification language', true);
          }
          loading.dismiss();
        }
      })
    }
  }

  async getImage() {
    this.enableCustom();
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      encodingType: this.camera.EncodingType.JPEG,
      saveToPhotoAlbum: false,
      allowEdit: true,
    }

    this.camera.getPicture(options).then(async (imageData) => {
      this.theme.changeBackground(imageData);
      //popup message
      await this.prompt.presentUniversalAlert(
        this.translator.instant('pages.settings.themes.customBgAlert.header'),
        null,
        this.translator.instant('pages.settings.themes.customBgAlert.message')
      );
    }, async (err) => {
      await this.prompt.presentUniversalAlert(
        this.translator.instant('pages.settings.themes.customBgErrorAlert.header'),
        null,
        this.translator.instant('pages.settings.themes.customBgErrorAlert.message') + ' (' + err + ')');
      //error
    });
  }

  openBgSettings() {
    this.router.navigateByUrl('/bg-settings');
  }

  async showPicker() {
    this.router.navigateByUrl('/color-picker?from=settings');
  }

  async analyticsChanged(event: any) {
    await this.app.changeConfig('analyticsCollectionEnabled', event.detail.checked);
    await this.kreta.initializeFirebase(this.kreta.decoded_user["kreta:institute_user_id"]);
  }

  async toastLoggingChanged(event: any) {
    await this.app.changeConfig('toastLoggingEnabled', event.detail.checked);
  }

  openUserSettings() {
    this.router.navigateByUrl('user-settings');
  }

  openNotificationSettings() {
    this.router.navigateByUrl('notification-settings');
  }

  async versionClicked() {
    this.devCounter++;

    if (this.devCounter >= 7 && 10 > this.devCounter) {
      this.prompt.topToast((10 - this.devCounter) + " " + this.translator.instant('pages.settings.devSettings.devSettingsEnablingText'), true)
    } else if (this.devCounter == 10) {
      this.app.changeConfig('devSettingsEnabled', true);
      this.prompt.topToast(this.translator.instant('pages.settings.devSettings.devSettingsEnabledText'), true);
    }
  }

  customUAClicked() {
    this.router.navigate(['user-agent'])
  }
}
