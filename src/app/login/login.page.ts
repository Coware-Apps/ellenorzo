import { Component, OnInit, OnDestroy } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AlertController, ModalController, MenuController, LoadingController } from '@ionic/angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';
import { InstituteSelectorModalPage } from './institute-selector-modal/institute-selector-modal.page';
import { KretaService } from '../_services/kreta.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';
import { UserManagerService } from '../_services/user-manager.service';
import { AppService } from '../_services/app.service';
import { PromptService } from '../_services/prompt.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  public user: string = null;
  public pass: string = null;
  public instituteName: string;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public storage: Storage,
    public userManager: UserManagerService,
    public router: Router,

    private browser: InAppBrowser,
    private kreta: KretaService,
    private data: DataService,
    private menuCtrl: MenuController,
    private loadingCtrl: LoadingController,
    private app: AppService,
    private prompt: PromptService,
  ) { }

  ngOnInit() {
    this.menuCtrl.enable(false);
  }

  ionViewDidEnter() {
    this.pass = null;
    this.user = null;
    this.instituteName = null;
  }

  ionViewWillLeave() {
    this.menuCtrl.enable(true);
  }

  async login() {
    if (this.user == null || this.pass == null || this.instituteName == null) {
      this.presentAlert('Hibás adatok', 'Kérlek töltsd ki az összes mezőt!');
    }
    else {
      let loading = await this.loadingCtrl.create({
        spinner: "crescent",
        message: 'Kommunikáció folyamatban...',
        animated: true,
      });
      await loading.present();
      await this.storage.set('username', this.user);
      //TODO remove
      let tokenResult = await this.kreta.getToken(this.user, this.pass, this.data.getData('institute'));
      if (tokenResult != false) {
        //checking if the user exists or not
        if (await this.userManager.addUser(tokenResult, this.data.getData('institute'))) {
          //the user doesn't exist
          await this.menuCtrl.enable(true);
          await loading.dismiss();
          this.app.isStudentSelectorReady = true;
          await this.router.navigateByUrl('home');
        } else {
          //the user already exists
          this.prompt.presentUniversalAlert('Hibás adatok', 'Sikertelen művelet', 'Ezzel az azonosítóval már létezik bejelentkezett felhasználó a rendszerben.');
          await loading.dismiss();
        }
      } else {
        await loading.dismiss();
      }
      //TODO login
    }
  }

  async getInstitute() {
    const modal = await this.modalCtrl.create({
      component: InstituteSelectorModalPage
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data && data.selectedInstitute)
      this.instituteName = data.selectedInstitute.Name;
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  openWebpage(url: string) {
    const options: InAppBrowserOptions = {
      zoom: 'no'
    }
    const browser = this.browser.create(url, '_self', options);
  }


}
