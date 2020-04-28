import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AlertController, ModalController, MenuController, LoadingController, AnimationController } from '@ionic/angular';
import { InstituteSelectorModalPage } from './institute-selector-modal/institute-selector-modal.page';
import { KretaService } from '../_services/kreta.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';
import { UserManagerService } from '../_services/user-manager.service';
import { AppService } from '../_services/app.service';
import { PromptService } from '../_services/prompt.service';
import { TranslateService } from '@ngx-translate/core';
import { GlobalError } from '../_exceptions/global-exception';
import { KretaError } from '../_exceptions/kreta-exception';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  public user: string = null;
  public pass: string = null;
  public instituteName: string;
  public kretaError: KretaError;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public storage: Storage,
    public userManager: UserManagerService,
    public router: Router,

    private kreta: KretaService,
    private data: DataService,
    private menuCtrl: MenuController,
    private loadingCtrl: LoadingController,
    private app: AppService,
    private prompt: PromptService,
    private translator: TranslateService,
    private animationCtrl: AnimationController,
    @Inject(DOCUMENT) private document: Document,
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
      this.presentAlert(
        this.translator.instant('pages.login.insufficientDataAlert.header'),
        this.translator.instant('pages.login.insufficientDataAlert.message')
      );
    }
    else {
      let loading = await this.loadingCtrl.create({
        spinner: "crescent",
        message: this.translator.instant('pages.login.loadingText'),
        animated: true,
      });
      await loading.present();
      await this.storage.set('username', this.user);

      try {
        let tokenResult = await this.kreta.getToken(this.user, this.pass, this.data.getData('institute'));
        if (await this.userManager.addUser(tokenResult, this.data.getData('institute'))) {
          //the user doesn't exist

          await this.menuCtrl.enable(true);
          await loading.dismiss();
          this.app.isStudentSelectorReady = true;
          if (this.userManager.allUsers.length > 1) {
            this.data.setData('refreshHome', true);
          }

          try {
            await this.userManager.currentUser.logIntoAdministration(this.user, this.pass);
          } catch (error) {
            if (error.promise && error.rejection) error = error.rejection;
            if (error instanceof GlobalError) this.prompt.errorToast(
              this.translator.instant('pages.login.administrationLoginError') + ': ' +
              this.translator.instant(error.customTitleTranslatorKey)
            );
          } finally {
            loading.dismiss();
          }

          this.kretaError = null;
          // await this.animationCtrl.create().addElement(
          //   [this.document.querySelector('#errorInfo'),
          //   this.document.querySelector('#errorInfoItem')]
          // )
          //   .duration(0)
          //   .to('max-height', '0')
          //   .play();
          await this.router.navigateByUrl('home');
        } else {
          //the user already exists
          this.prompt.presentUniversalAlert(
            this.translator.instant('pages.login.userAlreadyExistsAlert.header'),
            this.translator.instant('pages.login.userAlreadyExistsAlert.subHeader'),
            this.translator.instant('pages.login.userAlreadyExistsAlert.message'),
          );
          await loading.dismiss();
        }
      } catch (error) {
        this.kretaError = error;
        // this.animationCtrl.create().addElement(
        //   [this.document.querySelector('#errorInfo'),
        //   this.document.querySelector('#errorInfoItem')]
        // )
        //   .duration(200)
        //   .fromTo('max-height', '0px', '100px')
        //   .play();
        throw error;
      } finally {
        loading.dismiss();
      }
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

  getErrorInfo() {
    this.data.setData('loginError', this.kretaError);
    this.router.navigateByUrl('login/error?errorDataKey=loginError');
  }

  private async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
