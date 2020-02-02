import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { AuthenticationService } from './_services/authentication.service';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { ThemeService } from './_services/theme.service';
import { AppService } from './_services/app.service';
import { KretaService } from './_services/kreta.service';
import { Student } from './_models/student';
import { FormattedDateService } from './_services/formatted-date.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public appPages = this.app.appPages;
  public sans: boolean;
  public student: Student;
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private authService: AuthenticationService,
    private router: Router,
    private storage: Storage,
    private theme: ThemeService,
    private app: AppService,
    private kreta: KretaService,
    private fDate: FormattedDateService,
  ) {
    this.sans = true;
    this.initializeApp();
  }

  async initializeApp() {
    this.platform.ready().then(async () => {

      let a = await this.storage.get("sidemenu");

      if (a == null) {
        for (let i = 0; i < this.app.appPages.length; i++) {
          this.appPages[i].show = true;
        }
      }

      this.splashScreen.hide();

      //theme
      this.setTheme();

      let state = this.authService.authenticationState.value;
      var x = await this.storage.get('defaultPage')
      if (state) {
        //authenticated (from memory)
        if (x != null) {
          this.router.navigate([x]);
        }
        else {
          this.router.navigate(['']);
        }

      } else {
        //not authenticated
        if (await this.storage.get("refresh_token") != null) {
          await this.kreta.loginIfNotYetLoggedIn().then(event => {
            if (x != null) {
              this.router.navigate([x]);
            }
            else {
              this.router.navigate(['']);
            }
          });
        } else {
          this.router.navigate(['login']);
        }
      }

      this.appPages = await this.app.getAppPages();
      await this.setToastLogging();
      this.student = await this.kreta.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"));
      this.sans = false;
    });
  }

  public async setToastLogging() {
    let storedToastLogging = await this.storage.get("toastLogging") == true ? true : false;
    if (storedToastLogging) {
      this.app.toastLoggingOn();
    } else {
      this.app.toastLoggingOff();
    }
  }

  async setTheme() {
    let storedTheme = await this.storage.get('theme');
    if (storedTheme == null) {
      this.storage.set('theme', 'light')
    }

    switch (await this.storage.get('theme')) {
      case 'light':
        this.theme.enableLight();
        break;
      case 'dark':
        this.theme.enableDark();
        break;
      case 'minimalDark':
        this.theme.enableMinimalDark();
        break;
      case 'custom':
        this.theme.enableCustom();
        break;
    }
  }

  checkConfig() {
    this.app.updated.subscribe(async state => {
      if (state == "updated") {
        this.appPages = await this.storage.get("sidemenu");
        this.app.finishConfig();
      }
    })
  }
}
