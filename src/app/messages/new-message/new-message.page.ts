import { Component, OnDestroy } from '@angular/core';
import { Addressee, AttachmentToSend, AdministrationMessage } from 'src/app/_models/_administration/message';
import { Router, ActivatedRoute } from '@angular/router';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { DataService } from 'src/app/_services/data.service';
import { AddresseeListItem, instanceOfAddresseeListItem, instanceOfParentAddresseeListItem, instanceOfStudentAddresseeListItem } from 'src/app/_models/_administration/addresseeListItem';
import { PromptService } from 'src/app/_services/prompt.service';
import { LoadingController, MenuController } from '@ionic/angular';
import { DirtyPage } from 'src/app/_guards/DirtyPage';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { JwtDecodeHelper } from 'src/app/_helpers/jwt-decode-helper';

@Component({
  selector: 'app-new-message',
  templateUrl: './new-message.page.html',
  styleUrls: ['./new-message.page.scss'],
})
export class NewMessagePage implements DirtyPage, OnDestroy {
  public showProgressBar: boolean = false;
  public text: string;
  public subject: string;
  public addresseeList: AddresseeListItem[] = [];
  public attachmentList: AttachmentToSend[] = [];
  public allowNavigationTo = ["/messages/addressee-selector", "/messages/list-addressees"]
  public isMessageSent = false;
  public querySubscription: Subscription;

  //replies and forwarding
  public prevMsgId: number;
  public prevMsgText: string = "";
  constructor(
    public userManager: UserManagerService,

    private router: Router,
    private route: ActivatedRoute,
    private dataService: DataService,
    private prompt: PromptService,
    private loadingCtrl: LoadingController,
    private translator: TranslateService,
    private fDate: FormattedDateService,
    private menuCtrl: MenuController,
    private jwtHelper: JwtDecodeHelper,
  ) {
    this.querySubscription = this.route.queryParams.subscribe(p => {
      if (p != null) {
        if (p.replyDataKey != null) {
          // REPLY ----- use the queryParam replyDataKey and it should point to the previous message
          let prevMsg: AdministrationMessage = this.dataService.getData(p.replyDataKey);
          this.prevMsgId = prevMsg.uzenet.azonosito;
          this.prevMsgText = "<br><br>--------------------<br>" +
            `${this.translator.instant('pages.new-message.fromName')}: ${prevMsg.uzenet.feladoNev} (${prevMsg.uzenet.feladoTitulus})<br>` +
            `${this.translator.instant('pages.new-message.sentAtName')}: ${this.fDate.formatDateWithZerosAndDots(prevMsg.uzenet.kuldesDatum) + " " + this.fDate.getTime(new Date(prevMsg.uzenet.kuldesDatum))}<br>` +
            `${this.translator.instant('pages.new-message.subjectName')}: ${prevMsg.uzenet.targy}<br>` +
            prevMsg.uzenet.szoveg;
          this.subject = `${this.translator.instant('pages.new-message.replyName')}: ` + prevMsg.uzenet.targy;
          this.addresseeList.push({
            isAlairo: null,
            kretaAzonosito: null,
            nev: prevMsg.uzenet.feladoNev,
            titulus: null,
            isAdded: null,
            oktatasiAzonosito: null,
            tipus: null,
          });
        } else if (p.forwardDataKey != null) {
          // FORWARD ----- use the queryParam forwardDataKey and it should point to the previous message
          let prevMsg: AdministrationMessage = this.dataService.getData(p.forwardDataKey);
          this.prevMsgText = "<br><br>--------------------<br>" +
            `${this.translator.instant('pages.new-message.fromName')}: ${prevMsg.uzenet.feladoNev} (${prevMsg.uzenet.feladoTitulus})<br>` +
            `${this.translator.instant('pages.new-message.sentAtName')}: ${this.fDate.formatDateWithZerosAndDots(prevMsg.uzenet.kuldesDatum) + " " + this.fDate.getTime(new Date(prevMsg.uzenet.kuldesDatum))}<br>` +
            `${this.translator.instant('pages.new-message.subjectName')}: ${prevMsg.uzenet.targy}<br>` +
            prevMsg.uzenet.szoveg;
          this.subject = "Továbbítva: " + prevMsg.uzenet.targy;
          prevMsg.uzenet.csatolmanyok.forEach(a => {
            this.attachmentList.push({
              azonosito: a.azonosito,
              fajlNev: a.fajlNev,
              fajl: null,
              iktatoszam: null,
            });
          });
        }
      }
    });
  }

  isDirty() {
    if (this.isMessageSent) {
      return false;
    }
    if (this.addresseeList.length > 0 || this.text != null || this.subject != null) {
      return true;
    } else {
      return false;
    }
  }

  ngOnDestroy(): void {
    this.menuCtrl.enable(true);
    this.querySubscription.unsubscribe();
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
    if (this.dataService.getData('currentAddresseeList')) {
      this.addresseeList = this.dataService.getData('currentAddresseeList');
    }
  }
  selectAddressees() {
    this.router.navigateByUrl('messages/addressee-selector');
  }
  getAddresseeString() {
    let returnval = "";
    for (let i = 0; i < this.addresseeList.length; i++) {
      if (i != this.addresseeList.length - 1) {
        returnval += this.getName(this.addresseeList[i]) + ", ";
      } else if (i > 10) {
        break;
      } else {
        returnval += this.getName(this.addresseeList[i]);
      }
    }
    if (returnval.length > 30) {
      return returnval.substring(0, 30) + `... (${this.addresseeList.length} ${this.translator.instant('pages.new-message.piecesName')})`
    } else {
      return returnval;
    }
  }
  public getSelfName() {
    return this.jwtHelper.decodeToken(this.userManager.currentUser.administrationTokens.access_token).name;
  }
  public getName(a) {
    if (instanceOfAddresseeListItem(a)) {
      return a.nev;
    } else if (instanceOfParentAddresseeListItem(a)) {
      return a.gondviseloNev;
    } else if (instanceOfStudentAddresseeListItem(a)) {
      return a.vezetekNev + ' ' + a.keresztNev;
    }
  }
  async sendMsg() {
    if (this.addresseeList.length > 0 && this.text != null && this.subject != null) {
      if (!this.showProgressBar) {
        let l = await this.loadingCtrl.create({
          spinner: 'crescent',
          message: this.translator.instant('pages.new-message.sendingMessageText'),
        });
        l.present();
        if (this.prevMsgId == null) {

          let addressees: Addressee[] = [];
          this.addresseeList.forEach(e => {
            addressees.push({
              azonosito: null,
              nev: this.getName(e),
              kretaAzonosito: e.kretaAzonosito,
              tipus: e.tipus,
            });
          });
          console.log(addressees);
          try {
            await this.userManager.currentUser.sendNewMessage(
              addressees,
              this.subject,
              this.text + this.prevMsgText,
              this.attachmentList,
            );
            this.prompt.toast(this.translator.instant('pages.new-message.messageSentText'), true);
            await this.userManager.currentUser.clearUserCacheByCategory('messageList');
            this.isMessageSent = true;
            this.dataService.clearData('currentAddresseeList');
            this.router.navigateByUrl('messages');
          } catch (error) {
            throw error;
          } finally {
            l.dismiss();
          }
        } else {
          try {
            await this.userManager.currentUser.replyToMessage(
              this.prevMsgId,
              this.subject,
              this.text + this.prevMsgText,
              this.attachmentList,
            );
            this.prompt.toast(this.translator.instant('pages.new-message.messageSentText'), true);
            await this.userManager.currentUser.clearUserCacheByCategory('messageList');
            this.isMessageSent = true;
            this.dataService.clearData('currentAddresseeList');
            this.router.navigateByUrl('messages');
          } catch (error) {
            throw error;
          } finally {
            l.dismiss();
          }
        }
      } else {
        this.prompt.toast(this.translator.instant('pages.new-message.loadingText'), true);
      }
    } else {
      this.prompt.toast(this.translator.instant('pages.new-message.fillAllFieldsText'), true);
    }
  }
  async addAttachment(using: 'camera' | 'gallery' | 'file') {
    this.showProgressBar = true;
    try {
      let newAttachment = await this.userManager.currentUser.addAttachment(using);
      if (newAttachment != null) {
        this.attachmentList.push(newAttachment);
      }
    } catch (error) {
      throw error;
    } finally {
      this.showProgressBar = false;

    }
  }
  async deleteAttachment(a: AttachmentToSend) {
    if (a.fajl == null) {
      //the attachment came from the message that was forwarded, it isn't in the temporary storage, we don't need to delete it from there
      for (let i = 0; i < this.attachmentList.length; i++) {
        if (this.attachmentList[i].azonosito == a.azonosito) {
          this.attachmentList.splice(i, 1);
        }
      }
    } else {
      this.showProgressBar = true;
      try {
        await this.userManager.currentUser.removeAttachment(a.fajl.ideiglenesFajlAzonosito)
        for (let i = 0; i < this.attachmentList.length; i++) {
          if (this.attachmentList[i].fajl.ideiglenesFajlAzonosito == a.fajl.ideiglenesFajlAzonosito) {
            this.attachmentList.splice(this.attachmentList.indexOf(this.attachmentList[i]), 1);
          }
        }
      } catch (error) {
        throw error;
      } finally {
        this.showProgressBar = false;
      }
    }
  }
  public removeAddressee(item: AddresseeListItem) {
    this.addresseeList.splice(
      this.addresseeList.findIndex(x => x == item),
      1
    );
  }
}
