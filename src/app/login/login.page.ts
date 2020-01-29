import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../_services/authentication.service';
import { Storage } from '@ionic/storage';
import { AlertController, ModalController } from '@ionic/angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';
import { InstituteSelectorModalPage } from './institute-selector-modal/institute-selector-modal.page';
import { KretaService } from '../_services/kreta.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';

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

    private browser: InAppBrowser,
    private kreta: KretaService,
    private data: DataService,
  ) { }

  ngOnInit() {

  }

  async login() {
    if(this.user == null || this.pass == null || this.instituteName == null) {
      this.presentAlert('Hibás adatok', 'Kérlek töltsd ki az összes mezőt!');
    }
    else{
      await this.storage.set('username', this.user);
      await this.storage.set('institute', this.data.getData('institute'));
      this.kreta.password = this.pass;
      await this.kreta.loginIfNotYetLoggedIn(true);
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
