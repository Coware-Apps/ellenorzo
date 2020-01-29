import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AppService } from 'src/app/_services/app.service';
import { AppComponent } from 'src/app/app.component';

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
  }[]


  constructor(
    private app: AppService,
    private storage: Storage,
    ) {  

    }

  async ngOnInit() {
    this.appPages = await this.storage.get("sidemenu");
    if (this.appPages == null) {
      this.appPages = this.app.appPages;
    }
  }

  async ionViewWillLeave() {
    this.storage.set("sidemenu", this.app.appPages);
    this.app.updateConfig();
  } 

  show(page: string) {
    this.app.showPage(page);
    this.appPages = this.app.appPages;
  }

  hide(page: string) {
    this.app.hidePage(page);
    this.appPages = this.app.appPages;
  }

}
