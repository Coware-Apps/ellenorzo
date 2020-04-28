import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { KretaService } from 'src/app/_services/kreta.service';
import { Platform, LoadingController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { PromptService } from 'src/app/_services/prompt.service';
import { JwtDecodeHelper } from 'src/app/_helpers/jwt-decode-helper';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-re-login',
  templateUrl: './re-login.component.html',
  styleUrls: ['./re-login.component.scss'],
})
export class ReLoginComponent implements OnInit {
  public role: string = "";

  public username: string;
  public password: string;

  @Output() onSuccessfulLogin = new EventEmitter<boolean>();

  constructor(
    public kreta: KretaService,
    public platform: Platform,
    public userManager: UserManagerService,

    private loadingCtrl: LoadingController,
    private prompt: PromptService,
    private translator: TranslateService,
    private jwtHelper: JwtDecodeHelper,
    private storage: Storage,
  ) { }

  public async ngOnInit() {
    let roleKey = this.jwtHelper.decodeToken(this.userManager.currentUser.tokens.access_token).role;
    let key = 'components.re-login.roles.' + roleKey;
    this.role = this.translator.instant(key) != key ? this.translator.instant(key) : roleKey;
    if (this.userManager.allUsers.length == 1) {
      this.username = await this.storage.get('username');
    }
  }

  public async onSubmit() {
    if (!this.password || !this.username) {
      //this.prompt.presentAlert(this.translate.instant("password-confirm.password-required"));
      return;
    }

    let loading = await this.loadingCtrl.create({
      spinner: "crescent",
      message: this.translator.instant('pages.login.loadingText'),
      animated: true,
    });
    await loading.present();

    try {
      let loginRes = await this.userManager.currentUser.logIntoAdministration(this.username, this.password);
      if (loginRes) {

        let DMT = this.jwtHelper.decodeToken(this.userManager.currentUser.tokens.access_token); // DMT lol
        let DAT = this.jwtHelper.decodeToken(this.userManager.currentUser.administrationTokens.access_token);

        if (DMT.role == 'Student') {
          //if the bearer token role is student, checking if the user_id is the same
          if (DMT["kreta:institute_user_id"] != DAT["kreta:institute_user_id"]) {
            await this.userManager.currentUser.logOutOfAdministration();
            return this.prompt.presentUniversalAlert('Hiba', 'Sikertelen bejelentkezés', 'Nem sikerült bejelentkezni a kért felhasználóval, mert nem ugyanahhoz a KRÉTA fiókhoz tartozó adatok lettek megadva, amely jelenleg az alkalmazásban a kiválasztott fiók.')
          }
        } else {
          //if the bearer token role isn't student, checking if the tutelary id is the same
          if (DMT["kreta:tutelary_id"] != DAT["kreta:institute_user_id"]) {
            await this.userManager.currentUser.logOutOfAdministration();
            return this.prompt.presentUniversalAlert('Hiba', 'Sikertelen bejelentkezés', 'Nem sikerült bejelentkezni a kért felhasználóval, mert nem ugyanahhoz a KRÉTA fiókhoz tartozó adatok lettek megadva, amely jelenleg az alkalmazásban a kiválasztott fiók.')
          }
        }
        this.prompt.toast(this.translator.instant('components.re-login.onSuccessfulLogin'), true);
        this.onSuccessfulLogin.emit(true);
      }
    } finally {
      loading.dismiss();
    }
  }
}
