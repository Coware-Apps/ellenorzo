import { Component, OnInit, NgZone } from '@angular/core';
import { AdministrationMessage } from 'src/app/_models/_administration/message';
import { DataService } from 'src/app/_services/data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { PromptService } from 'src/app/_services/prompt.service';
import { AdministrationError } from 'src/app/_exceptions/administration-exception';
import { Subscription, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MenuController } from '@ionic/angular';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-read-message',
  templateUrl: './read-message.page.html',
  styleUrls: ['./read-message.page.scss'],
})
export class ReadMessagePage implements OnInit {
  public messageId: number;
  public message: AdministrationMessage;
  public pageState: 'sans' | 'error' | 'loaded' | 'login' = 'sans';
  public error: AdministrationError;

  private subs: Subscription[] = [];
  private willLeaveUnsubscribe$: Subject<void>;
  constructor(
    public fDate: FormattedDateService,
    public userManager: UserManagerService,
    public data: DataService,
    private router: Router,
    private route: ActivatedRoute,
    private FileOpener: FileOpener,
    private firebaseX: FirebaseX,
    private prompt: PromptService,
    private translator: TranslateService,
    private menuCtrl: MenuController,
    private ngZone: NgZone,
  ) {
    this.route.queryParams.subscribe(params => {
      this.messageId = params.messageId;
    });
  }

  ionViewWillEnter() {
    this.willLeaveUnsubscribe$ = new Subject<void>();
    this.userManager.reloader.pipe(takeUntil(this.willLeaveUnsubscribe$)).subscribe(r => {
      if (r == 'reload') {
        if (!this.userManager.currentUser.administrationTokens) {
          this.ngZone.run(() => this.router.navigateByUrl('login-administration'));
        }
      }
    });
    this.menuCtrl.enable(false);
  }
  ionViewWillLeave() {
    this.willLeaveUnsubscribe$.next();
    this.willLeaveUnsubscribe$.complete();
  }

  async ngOnInit() {
    this.firebaseX.setScreenName('read-message');
    if (!this.userManager.currentUser.isAdministrationRegistered()) {
      return this.pageState = "login";
    }
    this.pageState = 'sans';
    this.message = await this.userManager.currentUser.getMessageAdministration(this.messageId);
    for (let i = 0; i < this.message.uzenet.csatolmanyok.length; i++) {
      this.message.uzenet.csatolmanyok[i].loading = false;
    }
    this.pageState = 'loaded';
  }

  ngOnDestroy() {
    this.menuCtrl.enable(true);
    this.subs.forEach((s, index, object) => {
      s.unsubscribe();
      object.splice(index, 1);
    });
  }

  getAddresseeString() {
    return this.message.uzenet.cimzettLista
      .map(x =>
        this.userManager.currentUser.id == x.kretaAzonosito
          ? this.translator.instant('pages.read-message.meText')
          : x.nev
      )
      .join(", ");
  }


  replyToMsg() {
    this.data.setData('replyData', this.message);
    this.router.navigateByUrl('messages/new-message?replyDataKey=replyData');
  }
  forwardMsg() {
    this.data.setData('forwardData', this.message);
    this.router.navigateByUrl('messages/new-message?forwardDataKey=forwardData')
  }
  showStatusInfo() {
    this.prompt.presentUniversalAlert(
      `Azonosító: ${this.message.azonosito}`,
      `Státusz: ${this.message.uzenet.statusz.azonosito} (${this.message.uzenet.statusz.leiras})`,
      `Hibakód: ${this.message.uzenet.hibaCorrellationId}`
    )
  }
  async binMsg(action: 'put' | 'remove') {
    await this.userManager.currentUser.binMessage(action, [this.message.azonosito]);
    if (action == 'put') {
      this.prompt.toast(
        this.translator.instant('pages.read-message.successfullyBinned'), true
      );
      this.ngOnInit();
    } else {
      this.prompt.toast(
        this.translator.instant('pages.read-message.successfullyUnbinned'),
        true
      );
      this.ngOnInit();
    }
  }
  async deleteMsg() {
    let promptRes = await this.prompt.getTrueOrFalseWithText(
      this.translator.instant('pages.read-message.confirmDelete.header'),
      "",
      this.translator.instant('pages.read-message.confirmDelete.message'),
      "yes-no"
    );
    if (promptRes) {
      await this.userManager.currentUser.deleteMessage([this.message.azonosito]);
      this.router.navigateByUrl('messages?forceRefresh=true');
    }
  }
  async setAsUnread() {
    await this.userManager.currentUser.changeMessageState('unread', [this.message.azonosito]);
    this.prompt.toast(
      this.translator.instant('pages.read-message.successfullyUnread'),
      true
    );
    this.router.navigateByUrl('messages?forceRefresh=true');
  }

  async getFile(id: number, fullName: string) {
    let attachment = this.message.uzenet.csatolmanyok.find(x => x.azonosito == id);
    attachment.loading = true;

    const fileEntry = await this.userManager.currentUser.getAttachmentThroughAdministration(id, fullName);


    fileEntry.file(file => {
      this.FileOpener.open(fileEntry.nativeURL, file.type).catch(error => {
        console.error('Couldnt open file', error);

        this.prompt.showDetailedToast(
          this.translator.instant('pages.read-message.cannotOpenFile.title'),
          this.translator.instant('pages.read-message.cannotOpenFile.text'),
          3000,
        )

        throw error;
      });
    });
    attachment.loading = false;
  }
}
