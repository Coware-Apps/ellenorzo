import { Component, OnInit, ViewChild } from '@angular/core';
import { WebApiService } from 'src/app/_services/web-api.service';
import { KretaService } from 'src/app/_services/kreta.service';
import { AppService } from 'src/app/_services/app.service';
import { InAppBrowserOptions, InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { CommunityService } from 'src/app/_models/communityService';
import { PromptService } from 'src/app/_services/prompt.service';
import { PopoverController } from '@ionic/angular';
import { UserManagerService } from 'src/app/_services/user-manager.service';

@Component({
  selector: 'app-community-service',
  templateUrl: './community-service.page.html',
  styleUrls: ['./community-service.page.scss'],
})
export class CommunityServicePage implements OnInit {
  public username: string;
  public password: string;
  public loggedIn: boolean = false;
  public needsRegistration: boolean = true;
  public sans: boolean = true;
  public comServiceData: CommunityService;
  public userFullName: string;
  public authFor: Date;
  public timer;
  constructor(
    public webApi: WebApiService,
    public kreta: KretaService,
    public prompt: PromptService,

    private userManager: UserManagerService,
    private browser: InAppBrowser,
    private app: AppService,
    private popoverCtrl: PopoverController,
  ) {
  }

  async ngOnInit() {
    //TODO replace -> await this.kreta.loginIfNotYetLoggedIn();
    if (this.app.webApiRegistration.registered) {
      this.needsRegistration = false;
      this.username = this.app.webApiRegistration.username;
      this.password = this.app.webApiRegistration.password;
      await this.login();
      this.comServiceData = await this.getDisplayData();
      this.loggedIn = true;
    }
    this.sans = false;
  }

  async register() {
    await this.login();
    await this.app.changeConfig("webApiRegistration", {
      registered: true,
      username: this.username,
      password: this.password,
      loggedIn: true,
      loggedInFor: this.app.webApiRegistration.loggedInFor,
    });
    await this.getDisplayData();
    this.needsRegistration = false;
    this.loggedIn = true;
  }
  async login() {
    await this.webApi.login(this.userManager.currentUser.institute.Url, this.username, this.password);
    this.timer = this.initializeTimer(await this.webApi.getRemainingLoginTime());
    await this.app.changeConfig("webApiRegistration", {
      registered: true,
      username: this.app.webApiRegistration.username,
      password: this.app.webApiRegistration.password,
      loggedIn: true,
      loggedInFor: this.authFor,
    });
  }
  async getDisplayData() {
    this.comServiceData = await this.webApi.getCommunityServiceData();
    this.userFullName = (await this.webApi.getUserInfo()).UserMenu.UserName;
    console.log('a', this.comServiceData);
    return this.comServiceData;
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
    // let popover = await this.popoverCtrl.create({
    //   component: SmartLoginInfoComponent,
    //   event: event,
    // });
    // await popover.present();
  }
  openWebpage(url: string) {
    const options: InAppBrowserOptions = {
      zoom: 'no'
    }
    const browser = this.browser.create(url, '_self', options);
  }
}
