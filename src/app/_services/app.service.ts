import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { userInitData } from '../_models/user';
import { WebUser } from '../_models/webUser';
import { TranslateService } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import { AppVersion } from '@ionic-native/app-version/ngx';

@Injectable({
  providedIn: 'root'
})

export class AppService {

  public appPages: {
    title: string,
    url: string,
    icon: string,
    src?: string;
    show: boolean,
    translatorVal?: string,
  }[];
  public isStudentSelectorReady = false;
  public toastLoggingEnabled: boolean;
  public appV: string;
  public analyticsCollectionEnabled: boolean;
  public devSettingsEnabled: boolean;
  public localNotificationsEnabled: boolean;
  public userAgent: string;
  public usersInitData: userInitData[] = [];
  public webUser: WebUser;
  private _languages = [{
    id: 'hu',
    displayName: 'Magyar'
  },
  {
    id: 'en',
    displayName: 'English'
  }];
  public get languages() {
    return this._languages;
  }

  private _currentLng: string;
  public get currentLng() {
    return this._currentLng;
  }
  public set currentLng(newLng: string) {
    this.translator.use(newLng);
    this._currentLng = newLng;
    import(`@angular/common/locales/${newLng}.js`)
      .then(module => registerLocaleData(module.default));
    this.storage.set('language', newLng);
  }
  private _homeRequests = [
    {
      id: 0,
      requestName: "Student",
      impactName: 'magas',
      icon: "home-outline",
      show: true,
    },
    {
      id: 1,
      requestName: "Tests",
      impactName: 'alacsony',
      src: "/assets/extraicons/test.svg",
      show: true,
    },
    {
      id: 2,
      requestName: "MessageList",
      impactName: 'alacsony',
      icon: "chatbox-outline",
      show: true,
    },
    {
      id: 3,
      requestName: "Events",
      impactName: 'közepes',
      icon: "document-attach-outline",
      show: false,
    }
  ]
  public get homeRequests() {
    return this._homeRequests;
  }
  public set homeRequests(n) {
    this._homeRequests = n;
    this.storage.set('homeRequests', n);
  }
  constructor(
    private storage: Storage,
    private translator: TranslateService,
    private appVersion: AppVersion,
  ) {
    this.appPages = [{
      title: 'Főoldal',
      url: '/home',
      icon: 'home-outline',
      show: true,
      translatorVal: 'pages.home.title'
    },
    {
      title: 'Értékelések',
      url: '/evaluations',
      icon: 'school-outline',
      show: true,
      translatorVal: 'pages.evaluations.title'
    },
    {
      title: 'Órarend',
      url: '/list',
      icon: 'list-outline',
      show: true,
      translatorVal: 'pages.list.title'
    },
    {
      title: 'Statisztika',
      url: '/statistics',
      icon: 'analytics-outline',
      show: true,
      translatorVal: 'pages.statistics.title'
    },
    {
      title: 'Átlagok',
      url: '/averages',
      icon: 'bar-chart-outline',
      show: true,
      translatorVal: 'pages.averages.title'
    },
    {
      title: 'Mulasztások',
      url: '/absences',
      icon: 'calendar-outline',
      show: true,
      translatorVal: 'pages.absences.title'
    },
    {
      title: 'Feljegyzések',
      url: '/notes',
      icon: 'document-text-outline',
      show: true,
      translatorVal: 'pages.notes.title'
    },
    {
      title: 'Faliújság',
      url: '/events',
      icon: 'document-attach-outline',
      show: true,
      translatorVal: 'pages.events.title'
    },
    {
      title: 'Házi feladatok',
      url: '/homeworks',
      icon: '',
      show: true,
      src: "/assets/extraicons/homewarning.svg",
      translatorVal: 'pages.homeworks.title'
    },
    {
      title: 'Számonkérések',
      url: '/tests',
      icon: '',
      show: true,
      src: "/assets/extraicons/test.svg",
      translatorVal: 'pages.tests.title'
    },
    {
      title: 'Üzenetek',
      url: '/messages',
      icon: 'chatbox-outline',
      show: true,
      translatorVal: 'pages.messages.title'
    },
    // {
    // title: 'Közösségi szolgálat',
    // url: '/community-service',
    // icon: 'body-outline',
    // show: true,
    // },
    {
      title: 'Adatlap',
      url: '/user',
      icon: 'person-circle-outline',
      show: true,
      translatorVal: 'pages.user.title'
    },
    {
      title: 'Beállítások',
      url: '/settings',
      icon: 'settings-outline',
      show: true,
      translatorVal: 'pages.settings.title'
    }];
    this.toastLoggingEnabled = false;
    this.getStockUserAgent();
  }

  public async onInit() {
    try {
      let configs = await Promise.all([
        this.appVersion.getVersionNumber(),
        this.storage.get('analyticsCollectionEnabled'),
        this.storage.get('toastLoggingEnabled'),
        this.storage.get('devSettingsEnabled'),
        this.storage.get('localNotificationsEnabled'),
        this.storage.get('webApiRegistration'),
        this.storage.get('userAgent'),
        this.storage.get('language'),
        this.storage.get('homeRequests'),
      ]);
      this.appV = configs[0];
      this.analyticsCollectionEnabled = configs[1] == false ? false : true;
      this.toastLoggingEnabled = configs[2] == true ? true : false;
      this.devSettingsEnabled = configs[3] == true ? true : false;
      this.localNotificationsEnabled = configs[4] == true ? true : false;
      let storedWebApiRegistration = configs[5];
      if (storedWebApiRegistration != null) {
        this.webUser = JSON.parse(storedWebApiRegistration);
      };
      let storedUA = configs[6];
      if (storedUA != null) {
        this.userAgent = storedUA;
      }
      if (configs[7] != null) {
        this.currentLng = configs[7];
      } else {
        let browserLang = this.translator.getBrowserLang();
        this.languages.forEach(l => {
          if (l.id == browserLang) {
            this.currentLng = browserLang;
          }
        });
      }

      if (configs[8] != null) {
        for (let i = 0; i < configs[8].length; i++) {
          if (configs[8][i].id == this._homeRequests[i].id) {
            this._homeRequests[i].show = configs[8][i].show;
          }
        }
      }
    } catch (error) {
      console.error('Error initializing app');
    }
  }

  public async changeConfig(configKey: string, value: any) {
    this[configKey] = value;
    await this.storage.set(configKey, value);
  }
  public async changeConfigSaveJSON(configKey: string, value: any) {
    this[configKey] = value;
    await this.storage.set(configKey, JSON.stringify(value));
  }
  public getStockUserAgent() {
    //this.userAgent = 'Kreta.Ellenorzo/2.9.8.2020012301 (Android; SM-G950F 0.0)'
    //this.userAgent = 'x.x/0 (Android)'
    //response time about 2000-10000ms per request
    //this.userAgent = 'Dalvik/2.1.0 (Linux; U; Android 9; AM-GADDF Build/PPR1.180610.011)';
    this.userAgent = 'Kreta.Ellenorzo/2.9.9.2020022101 (Android)';
    return 'Kreta.Ellenorzo/2.9.9.2020022101 (Android)';
  }

  //#region sidemenu
  async hidePage(url: string) {
    this.appPages.forEach(page => {
      if (page.url == url) {
        page.show = false;
        console.log("hid", page.title);
      }
    });
    await this.storage.set('sidemenu', this.appPages);
  }

  async showPage(url: string) {
    this.appPages.forEach(page => {
      if (page.url == url) {
        page.show = true;
        console.log("shown", page.title);
      }
    });
    await this.storage.set('sidemenu', this.appPages);
  }

  async clearStorage(keepSettings: boolean = true) {
    if (keepSettings) {
      let ramStorage: Array<any> = [];
      ramStorage.push(await this.storage.get("base64bg"));
      ramStorage.push(await this.storage.get("bgSize"));
      ramStorage.push(await this.storage.get("bgX"));
      ramStorage.push(await this.storage.get("bgY"));
      ramStorage.push(await this.storage.get("cardColor"));
      ramStorage.push(await this.storage.get("defaultPage"));
      ramStorage.push(await this.storage.get("theme"));
      ramStorage.push(await this.storage.get("antiSpamUA"));
      ramStorage.push(await this.storage.get("devSettingsEnabled"));
      ramStorage.push(await this.storage.get("toastLoggingEnabled"));

      await this.storage.clear();

      this.storage.set("base64bg", ramStorage[0]);
      this.storage.set("bgSize", ramStorage[1]);
      this.storage.set("bgX", ramStorage[2]);
      this.storage.set("bgY", ramStorage[3]);
      this.storage.set("cardColor", ramStorage[4]);
      this.storage.set("defaultPage", ramStorage[5]);
      this.storage.set("theme", ramStorage[6]);
      this.storage.set("antiSpamUA", ramStorage[7]);
      this.storage.set("devSettingsEnabled", ramStorage[8]);
      this.storage.set("toastLoggingEnabled", ramStorage[9]);
    } else {
      this.storage.clear();
    }
  }

  //when something is updated (sidemenu)
  updated = new BehaviorSubject("init");

  public updateConfig() {
    this.updated.next("updated");
  }

  public finishConfig() {
    this.updated.next("finished");
  }
  //#endregion
}
