import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { Storage } from '@ionic/storage';
import { userInitData } from '../_models/user';
import { WebUser } from '../_models/webUser';
import { TranslateService } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { File } from '@ionic-native/file/ngx';

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
  }[] = [{
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
  // {
  //   title: 'Faliújság',
  //   url: '/events',
  //   icon: 'document-attach-outline',
  //   show: true,
  //   translatorVal: 'pages.events.title'
  // },
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
  //   title: 'Adatlap',
  //   url: '/user',
  //   icon: 'person-circle-outline',
  //   show: true,
  //   translatorVal: 'pages.user.title'
  // },
  {
    title: 'Beállítások',
    url: '/settings',
    icon: 'settings-outline',
    show: true,
    translatorVal: 'pages.settings.title'
  }];

  public isStudentSelectorReady = false;
  public toastLoggingEnabled: boolean = false;
  public analyticsCollectionEnabled: boolean;
  public devSettingsEnabled: boolean;
  public localNotificationsEnabled: boolean;
  public userAgent: string = 'Kreta.Ellenorzo/2.9.11.2020033003 (Android; SM-G950F 0.0)';
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
      impactName: 'közepes',
      icon: "home-outline",
      show: true,
      defaultParams: [null, null, true],
      cacheKey: 'student',
    },
    {
      id: 1,
      requestName: "Tests",
      impactName: 'alacsony',
      src: "/assets/extraicons/test.svg",
      show: true,
      defaultParams: [null, null, true],
      cacheKey: 'tests',
    },
    {
      id: 2,
      requestName: "MessageListMobile",
      impactName: 'alacsony',
      icon: "chatbox-outline",
      show: true,
      defaultParams: [true],
      cacheKey: 'messageList',
    },
    {
      id: 3,
      requestName: "Events",
      impactName: 'közepes',
      icon: "document-attach-outline",
      show: false,
      defaultParams: [],
      cacheKey: 'events',
    }
  ]
  public get homeRequests() {
    return this._homeRequests;
  }
  public set homeRequests(n) {
    this._homeRequests = n;
    this.storage.set('homeRequests', n);
  }
  private _doHomeworkFilter: boolean = false;
  public get doHomeworkFilter() {
    return this._doHomeworkFilter;
  }
  public set doHomeworkFilter(n) {
    this._doHomeworkFilter = n;
    this.storage.set('doHomeworkFilter', n);
  }
  private _defaultPage: string = "/home";
  public get defaultPage() {
    return this._defaultPage
  }
  public set defaultPage(n: string) {
    this._defaultPage = n;
    this.storage.set('defaultPage', n);
  }
  constructor(
    private storage: Storage,
    private translator: TranslateService,
    private appVersion: AppVersion,
    private http: HTTP,
    private firebase: FirebaseX,
    private file: File,
  ) { }

  public async onInit() {
    try {
      let configs = await Promise.all([
        this.storage.get('analyticsCollectionEnabled'),
        this.storage.get('toastLoggingEnabled'),
        this.storage.get('devSettingsEnabled'),
        this.storage.get('localNotificationsEnabled'),
        this.storage.get('webApiRegistration'),
        this.storage.get('userAgent'),
        this.storage.get('language'),
        this.storage.get('homeRequests'),
        this.storage.get('doHomeworkFilter'),
        this.storage.get("sidemenu"),
        this.storage.get("usersInitData"),
        this.storage.get("defaultPage"),
        this.storage.get("lastClearedCacheStorage"),
      ]);
      this.analyticsCollectionEnabled = configs[0] == false ? false : true;
      if (!this.analyticsCollectionEnabled) {
        this.firebase.setAnalyticsCollectionEnabled(false);
      }
      this.toastLoggingEnabled = configs[1] == true ? true : false;
      this.devSettingsEnabled = configs[2] == true ? true : false;
      this.localNotificationsEnabled = configs[3] == true ? true : false;
      let storedWebApiRegistration = configs[4];
      if (storedWebApiRegistration != null) {
        this.webUser = JSON.parse(storedWebApiRegistration);
      };
      let storedUA = configs[5];
      if (storedUA != null) {
        this.userAgent = storedUA;
      }
      if (configs[6] != null) {
        this.currentLng = configs[6];
      } else {
        let browserLang = this.translator.getBrowserLang();
        this.languages.forEach(l => {
          if (l.id == browserLang) {
            this.currentLng = browserLang;
          }
        });
      }

      if (configs[7] != null) {
        for (let i = 0; i < configs[7].length; i++) {
          if (configs[7][i].id == this._homeRequests[i].id) {
            this._homeRequests[i].show = configs[7][i].show;
          }
        }
      }

      this._doHomeworkFilter = configs[8] != null ? configs[8] : this._doHomeworkFilter;

      this.getAppPages(configs[9]);

      this.usersInitData = configs[10] ? configs[10] : [];

      this._defaultPage = configs[11] ? configs[11] : this._defaultPage;

      //clearing storage cache after 1 week
      if (!configs[12] || (configs[12] && new Date().valueOf() > configs[12] + 604800000)) {
        console.log('Clearing cache storage');
        this.clearAttachmentCache();
        this.storage.set("lastClearedCacheStorage", new Date().valueOf());
      }

    } catch (error) {
      console.error('Error initializing app', error);
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
  public async downloadUserAgent() {
    console.log('Downloading new User-Agent...')
    //this.userAgent = 'Kreta.Ellenorzo/2.9.8.2020012301 (Android; SM-G950F 0.0)'
    //this.userAgent = 'x.x/0 (Android)'
    //response time about 2000-10000ms per request
    //this.userAgent = 'Dalvik/2.1.0 (Linux; U; Android 9; AM-GADDF Build/PPR1.180610.011)';
    let rndString = Math.random().toString(36).substring(2, 9).toUpperCase();
    let userAgent = `Kreta.Ellenorzo/2.9.11.2020033003 (Android; SM-G950F 0.0)`;

    try {
      let result = await this.http.get('https://raw.githubusercontent.com/Coware-Apps/ellenorzo/master/docs/config.json', null, null);
      userAgent = JSON.parse(result.data).userAgent;
    } catch (error) {
      console.error("Error trying ot get user agent from server, using local");
    }
    if (userAgent) {
      userAgent = userAgent.replace("SM-G950F", rndString)
      console.log('Your brand new useragent is', userAgent);
      this.userAgent = userAgent;
      await this.storage.set('userAgent', userAgent);
    }
    return this.userAgent;
  }
  private getAppPages(storedPages) {
    if (storedPages != null) {
      for (let i = 0; i < storedPages.length; i++) {
        for (let j = 0; j < this.appPages.length; j++) {
          if (storedPages[i].url == this.appPages[j].url) {
            this.appPages[j].show = storedPages[i].show;
          }
        }
      }
    }
    return this.appPages;
  }
  public getAppVersion() {
    return this.appVersion.getVersionNumber();
  }
  public clearAttachmentCache(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.file
        .getDirectory(
          await this.file.resolveDirectoryUrl(this.file.cacheDirectory),
          "msgattachment",
          { create: false }
        )
        .then(messageCacheDir => messageCacheDir.removeRecursively(resolve, reject))
        .catch(resolve);
    });
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
