import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AppService } from 'src/app/_services/app.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from 'src/app/_services/prompt.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-hide-page-settings',
  templateUrl: './hide-page-settings.page.html',
  styleUrls: ['./hide-page-settings.page.scss'],
})
export class HidePageSettingsPage implements OnInit {

  public appPages: {
    title: string,
    url: string,
    icon: string,
    show: boolean,
    translatorVal?: string;
  }[]
  public loaded = false;

  constructor(
    private app: AppService,
    private storage: Storage,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private translator: TranslateService,
  ) {

  }

  ngOnInit() {
    this.firebase.setScreenName('hide-page-settings');
  }

  async ionViewDidEnter() {
    this.appPages = this.app.appPages;
    let storedPages = await this.storage.get('sidemenu');
    if (storedPages != null) {
      for (let i = 0; i < storedPages.length; i++) {
        for (let j = 0; j < this.appPages.length; j++) {
          if (storedPages[i].url == this.appPages[j].url) {
            this.appPages[j].show = storedPages[i].show;
          }
        }
      }
    }
    console.log('pages', this.appPages);
    this.loaded = true;
  }

  async ionViewWillLeave() {
    this.storage.set("sidemenu", this.app.appPages);
    this.app.updateConfig();
  }

  async show(pageUrl: string) {
    await this.app.showPage(pageUrl);
    this.appPages = this.app.appPages;
  }

  async hide(pageUrl: string) {
    await this.app.hidePage(pageUrl);
    this.appPages = this.app.appPages;
  }

  showHideInfo() {
    this.prompt.presentUniversalAlert(
      this.translator.instant('pages.hide-page-settings.hideInfo.header'),
      null,
      this.translator.instant('pages.hide-page-settings.hideInfo.message')
    );
  }

}
