import { Injectable } from '@angular/core';
import { BehaviorSubject, config, Subject } from 'rxjs';
import { Storage } from '@ionic/storage';
import { userInitData } from '../_models/user';

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
  }[];
  public isStudentSelectorReady = false;
  public toastLoggingEnabled: boolean;
  public appV: string;
  public analyticsCollectionEnabled: boolean;
  public devSettingsEnabled: boolean;
  public localNotificationsEnabled: boolean;
  public userAgent: string;
  public usersInitData: userInitData[] = [];
  public webApiRegistration = {
    registered: false,
    username: "",
    password: "",
    loggedIn: false,
    loggedInFor: 0,
  };

  constructor(
    private storage: Storage,
  ) {
    this.appPages = [{
      title: 'Főoldal',
      url: '/home',
      icon: 'home-outline',
      show: true,
    },
    {
      title: 'Értékelések',
      url: '/evaluations',
      icon: 'school-outline',
      show: true,
    },
    {
      title: 'Órarend',
      url: '/list',
      icon: 'list-outline',
      show: true,
    },
    {
      title: 'Statisztikák',
      url: '/statistics',
      icon: 'analytics-outline',
      show: true,
    },
    {
      title: 'Átlagok',
      url: '/averages',
      icon: 'bar-chart-outline',
      show: true,
    },
    {
      title: 'Mulasztások',
      url: '/absences',
      icon: 'calendar-outline',
      show: true,
    },
    {
      title: 'Feljegyzések',
      url: '/notes',
      icon: 'document-text-outline',
      show: true,
    },
    {
      title: 'Házi feladatok',
      url: '/homeworks',
      icon: '',
      show: true,
      src: "/assets/extraicons/homewarning.svg",
    },
    {
      title: 'Számonkérések',
      url: '/tests',
      icon: '',
      show: true,
      src: "/assets/extraicons/test.svg",
    },
    {
      title: 'E-üzenetek',
      url: '/messages',
      icon: 'chatbox-outline',
      show: true,
    },
    //{
    // title: 'Közösségi szolgálat',
    // url: '/community-service',
    // icon: 'body-outline',
    // show: true,
    //},
    {
      title: 'Felhasználó adatai',
      url: '/user',
      icon: 'person-circle-outline',
      show: true,
    },
    {
      title: 'Beállítások',
      url: '/settings',
      icon: 'settings-outline',
      show: true,
    }];
    this.toastLoggingEnabled = false;
    this.getStockUserAgent();
  }

  public async changeConfig(configKey: string, value: any) {
    this[configKey] = value;
    await this.storage.set(configKey, value);
  }

  public getStockUserAgent() {
    //this.userAgent = 'Kreta.Ellenorzo/2.9.8.2020012301 (Android; SM-G950F 0.0)'
    //this.userAgent = 'x.x/0 (Android)'
    //response time about 2000-10000ms per request
    //this.userAgent = 'Dalvik/2.1.0 (Linux; U; Android 9; AM-GADDF Build/PPR1.180610.011)';
    this.userAgent = 'Arisztokreta.Ellenorzo/0.8.3.2020012301 (Android)';
    return 'Arisztokreta.Ellenorzo/0.8.3.2020012301 (Android)';
  }

  //sidemenu
  hidePage(title: string) {
    this.appPages.forEach(page => {
      if (page.title == title) {
        page.show = false;
        console.log("hid", page.title);
      }
    });
  }

  showPage(title: string) {
    this.appPages.forEach(page => {
      if (page.title == title) {
        page.show = true;
        console.log("shown", page.title);
      }
    });
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
}
