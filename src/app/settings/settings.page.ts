import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../_services/theme.service';
import { Storage } from '@ionic/storage';
import { AuthenticationService } from '../_services/authentication.service';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Platform, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ColorService } from '../_services/color.service';
import { AppService } from '../_services/app.service';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { KretaService } from '../_services/kreta.service';
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

  private width: number;
  private height: number;

  constructor(
    
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
  ) {
    this.platform.ready().then((readySource) => {
      this.width = platform.width();
      this.height = platform.height();
    });
    this.appPages = this.app.appPages;
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
  }
}
