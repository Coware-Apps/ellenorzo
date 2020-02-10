import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../_services/theme.service';
import { Storage } from '@ionic/storage';
import { AuthenticationService } from '../_services/authentication.service';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Platform, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ColorService } from '../_services/color.service';
import { AppService } from '../_services/app.service';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { KretaService } from '../_services/kreta.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { InAppBrowserOptions, InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { LocalNotifications, ILocalNotification } from '@ionic-native/local-notifications/ngx';
import { PromptService } from '../_services/prompt.service';
import { FormattedDateService } from '../_services/formatted-date.service';
import { NotificationService } from '../_services/notification.service';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  customAlertOptions: any = {
    header: 'Kezdőlap',
    cssClass: this.color.getPopUpClass(),
  };

  public currentTheme: string;
  public defaultPage: string;
  public appPages: {
    title: string,
    url: string,
    icon: string,
    show: boolean,
  }[];

  private width: number;
  private height: number;
  private devCounter: number;

  constructor(
    public app: AppService,

    private toastController: ToastController,
    private theme: ThemeService,
    private storage: Storage,
    private camera: Camera,
    private platform: Platform,
    private router: Router,
    private color: ColorService,
    private kreta: KretaService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private inAppBrowser: InAppBrowser,
    private notificationService: NotificationService,
    private fDate: FormattedDateService,
  ) {
    this.platform.ready().then((readySource) => {
      this.width = platform.width();
      this.height = platform.height();
    });
    this.appPages = this.app.appPages;
  }


  async ngOnInit() {
    //#region themes
    let storedTheme = await this.storage.get('theme');
    if (storedTheme == null) {
      this.storage.set('theme', 'light')
    }

    switch (await this.storage.get('theme')) {
      case 'light':
        this.currentTheme = "light";
        this.enableLight();
        break;
      case 'dark':
        this.currentTheme = "dark";
        this.enableDark();
        break;
      case 'minimalDark':
        this.currentTheme = "minimalDark";
        this.enableMinimalDark();
        break;
      case 'custom':
        this.currentTheme = "custom";
        this.enableCustom();
        break;
    }
    //#endregion

    //#region default page
    let a = await this.storage.get('defaultPage');

    if (a == null) {
      this.defaultPage = "/list";
    }
    else {
      this.defaultPage = a;
    }

    this.devCounter = this.app.devSettingsEnabled ? 9 : 0;
    //#endregion

    this.firebase.setScreenName('settings');
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

  async logout() {
    await this.kreta.logout();
  }

  //#region starting pages
  selectorChanged(event: any) {
    this.setDefaultPage(event.detail.value);
  }

  setDefaultPage(pagePath: string) {
    this.storage.set('defaultPage', pagePath);
  }
  //#endregion

  showHideInfo() {
    this.prompt.presentUniversalAlert("Oldalak elrejtése", null, "Megadhatod, hogy melyik oldalak jelenjenek meg a menüben és melyek ne. Ez azért hasznos, mert vannak olyan iskolák, ahol bizonyos funkciók le vannak tiltva.")
  }

  hidePages() {
    this.router.navigateByUrl('/hide-page-settings');
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
      await this.prompt.presentUniversalAlert('Testreszabható háttér', null, 'A funkció még kísérleti fázisban van. A képet úgy válaszd meg, hogy a <ul><li>szélessége min. ' + this.width + 'px </li><li>magassága min. ' + this.height + 'px </li></ul> legyen, ha a nem ajánl fel alapból egy crop ablakot. (Ezek az adatok a te eszközöd képernyőadatai alapján lettek generálva)');
    }, async (err) => {
      await this.prompt.presentUniversalAlert('Hiba történt!', null, 'Nem sikerült a kiválasztott képet beállítani. (' + err + ')')
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

  async localNotificationsChanged(event: any) {
    if (event.detail.checked) {
      let timetable = await this.kreta.getLesson(this.fDate.getWeekFirst(0), this.fDate.getWeekLast(0));
      await this.notificationService.enableLocalNotifications(timetable);
      await this.app.changeConfig('localNotificationsEnabled', true);
      this.prompt.toast('Értesítések sikeresen engedélyezve!', true);
    } else {
      await this.notificationService.disableLocalNotifications();
      await this.app.changeConfig('localNotificationsEnabled', false);
      this.prompt.toast('Értesítések sikeresen letiltva!', true);
    }
    this.app.localNotificationsEnabled = event.detail.checked;
  }

  openUrl(url: string) {
    const options: InAppBrowserOptions = {
      zoom: 'no'
    }
    const browser = this.inAppBrowser.create(url, '_self', options);
  }

  async versionClicked() {
    this.devCounter++;

    if (this.devCounter >= 7 && 10 > this.devCounter) {
      this.prompt.toast((10 - this.devCounter) + " lépésre vagy a fejlesztői beállítások engedélyezésétől!", true)
    } else if (this.devCounter == 10) {
      this.app.changeConfig('devSettingsEnabled', true);
      this.prompt.toast("Fejlesztői beállítások sikeresen engedélyezve!", true);
    }
  }

  customUAClicked() {
    this.router.navigate(['user-agent'])
  }
}
