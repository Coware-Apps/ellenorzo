import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../_services/theme.service';
import { Storage } from '@ionic/storage';
import { AuthenticationService } from '../_services/authentication.service';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Platform, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ColorService } from '../_services/color.service';
import { AppService } from '../_services/app.service';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { KretaService } from '../_services/kreta.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { InAppBrowserOptions, InAppBrowser } from '@ionic-native/in-app-browser/ngx';
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
  public appV: string;
  public analyticsCollectionEnabled: boolean;
  public devSettings: boolean;
  public toastLogging: boolean;

  private width: number;
  private height: number;
  private devCounter: number;

  constructor(
    private toastController: ToastController,
    private theme: ThemeService,
    private storage: Storage,
    private authService: AuthenticationService,
    private camera: Camera,
    private platform: Platform,
    private alertCtrl: AlertController,
    private router: Router,
    private color: ColorService,
    private app: AppService,  
    private appVersion: AppVersion,
    private kreta: KretaService,
    private firebase: FirebaseX,
    private inAppBrowser: InAppBrowser,
  ) {
    this.platform.ready().then((readySource) => {
      this.width = platform.width();
      this.height = platform.height();
    });
    this.appPages = this.app.appPages;
    this.toastLogging = false;
  }

  
  async ngOnInit() {
    this.appV = await this.appVersion.getVersionNumber();

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

    let a = await this.storage.get('defaultPage');

    if (a == null) {
      this.defaultPage = "/list";
    }
    else {
      this.defaultPage = a;
    }

    this.devCounter = 0;
    this.analyticsCollectionEnabled = await this.storage.get('analyticsCollectionEnabled') == false ? false : true;
    this.toastLogging = await this.storage.get('toastLogging') == true ? true : false;
    this.devSettings = await this.storage.get('devSettings') == true ? true : false;
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
    this.presentAlert("Oldalak elrejtése", null, "Megadhatod, hogy melyik oldalak jelenjenek meg a menüben és melyek ne. Ez azért hasznos, mert vannak olyan iskolák, ahol bizonyos funkciók le vannak tiltva.", this.color.getPopUpClass())
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
      await this.presentAlert('Testreszabható háttér', null, 'A funkció még kísérleti fázisban van. A képet úgy válaszd meg, hogy a <ul><li>szélessége min. ' + this.width + 'px </li><li>magassága min. ' + this.height + 'px </li></ul> legyen, ha a nem ajánl fel alapból egy crop ablakot. (Ezek az adatok a te eszközöd képernyőadatai alapján lettek generálva)', "timeTableAlert");
    }, async (err) => {
      await this.presentAlert('Hiba történt!', null, 'Nem sikerült a kiválasztott képet beállítani. (' + err + ')', this.color.getPopUpClass())
      //error
    });
  }

  openBgSettings() {
    this.router.navigateByUrl('/bg-settings');
  }

  async showPicker() {
    this.router.navigateByUrl('/color-picker?from=settings');
  }

  async presentAlert(header: string, subHeader: string, message: string, css: string) {
    const alert = await this.alertCtrl.create({
      cssClass: css,
      header: header,
      subHeader: subHeader,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async analyticsChanged() {
    await this.storage.set("analyticsCollectionEnabled", this.analyticsCollectionEnabled);

    this.kreta.initializeFirebase(this.kreta.decoded_user["kreta:institute_user_id"]);
  }

  async toastLoggingChanged() {
    await this.storage.set("toastLogging", this.toastLogging);
    if (this.toastLogging) {
      this.app.toastLoggingOn();
    } else {
      this.app.toastLoggingOff();
    }
  }

  openUrl(url: string) {
    const options: InAppBrowserOptions = {
      zoom: 'no'
    }
    const browser = this.inAppBrowser.create(url, '_self', options);
  }

  async presentToast(message: string) {
    this.toastController.dismiss();
    const toast = await this.toastController.create({
      message: message,
      duration: 10000,
      closeButtonText: "OK",
      cssClass: this.color.getToastClass(),
      showCloseButton: true,
      position: "top",
    });
    toast.present();
  }

  async versionClicked() {
    this.devCounter++;

    if (this.devCounter >= 7 && 10 > this.devCounter) {
      this.presentToast((10 - this.devCounter) + " lépésre vagy a fejlesztői beállítások engedélyezésétől!")
    } else if (this.devCounter == 10) {
      await this.storage.set("devSettings", true);
      this.devSettings = true;
      this.presentToast("Fejlesztői beállítások sikeresen engedélyezve!");
    }
  }
}
