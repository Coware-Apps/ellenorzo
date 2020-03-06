import { Component, OnInit, ViewChild } from '@angular/core';
import { WebApiService } from 'src/app/_services/web-api.service';
import { KretaService } from 'src/app/_services/kreta.service';
import { AppService } from 'src/app/_services/app.service';
import { InAppBrowserOptions, InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { CommunityService } from 'src/app/_models/communityService';
import { PromptService } from 'src/app/_services/prompt.service';
import { PopoverController, ModalController } from '@ionic/angular';
import { InstituteSelectorModalPage } from 'src/app/login/institute-selector-modal/institute-selector-modal.page';
import { WebLoginInfoComponent } from 'src/app/_components/web-login-info/web-login-info.component';
import { DataService } from 'src/app/_services/data.service';
import { Institute } from 'src/app/_models/institute';
import { WebUserManagerService } from 'src/app/_services/web-user-manager.service';

@Component({
  selector: 'app-community-service',
  templateUrl: './community-service.page.html',
  styleUrls: ['./community-service.page.scss'],
})
export class CommunityServicePage implements OnInit {
  public username: string;
  public password: string;
  public institute: Institute;
  public loggedIn: boolean = false;
  public needsRegistration: boolean = true;
  public sans: boolean = true;
  public comServiceData: CommunityService;
  public userFullName: string;
  public authFor: Date;
  public timer;
  public instituteName: string;
  constructor(
    public webApi: WebApiService,
    public kreta: KretaService,
    public prompt: PromptService,

    private browser: InAppBrowser,
    private app: AppService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private dataService: DataService,
    private webUserManager: WebUserManagerService,
  ) {
  }

  async ngOnInit() {
    if (this.webUserManager.user == null) {
      this.needsRegistration = true;
    } else {
      this.initializeTimer(await this.webUserManager.user.login());
      this.loggedIn = true;
      this.comServiceData = await this.webUserManager.user.getCommunityService();
    }
    this.sans = false;
  }

  async register() {
    await this.webUserManager.createUser(this.dataService.getData('institute').url, this.username, this.password);
    this.needsRegistration = false;
    this.loggedIn = true;
  }
  async getDisplayData() {
    return await this.webUserManager.user.getCommunityService();
  }
  private initializeTimer(remainingTime: number): NodeJS.Timer {
    let startTime = new Date(new Date(remainingTime * 1000).valueOf());
    let i = 0;
    let keepGoing = true;
    let returnVal = setInterval(() => {
      if (keepGoing) {
        this.authFor = new Date(startTime.valueOf() - (i * 1000));
        i++;
      }
      if (this.authFor.getMinutes() <= 5) {
        keepGoing = false;
        this.authFor.setHours(0, 0, 0, 0);
      }
    }, 1000);
    return returnVal;
  }
  async showSmartLoginInfo(event: any) {
    let popover = await this.popoverCtrl.create({
      component: WebLoginInfoComponent,
      event: event,
    });
    await popover.present();
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
  openWebpage(url: string) {
    const options: InAppBrowserOptions = {
      zoom: 'no'
    }
    const browser = this.browser.create(url, '_self', options);
  }
}
