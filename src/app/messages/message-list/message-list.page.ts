import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageListItem } from 'src/app/_models/_administration/message';
import { AdministrationError } from 'src/app/_exceptions/administration-exception';
import { Subscription, Subject } from 'rxjs';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { Router, ActivatedRoute } from '@angular/router';
import { PromptService } from 'src/app/_services/prompt.service';
import { TranslateService } from '@ngx-translate/core';
import "hammerjs";
import { MenuController } from '@ionic/angular';
import { takeUntil } from 'rxjs/operators';
import { AppService } from 'src/app/_services/app.service';
import { DiacriticsHelper } from 'src/app/_helpers/diacritics-helper';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.page.html',
  styleUrls: ['./message-list.page.scss'],
})
export class MessageListPage implements OnDestroy, OnInit {
  public folder: "inbox" | "outbox" | "deleted" = "inbox";
  private swipeRouterData = ['inbox', 'outbox', 'deleted'];
  private initNumberMessages: number = 15;
  private incrementNumberMessages: number = 5;

  private messages: MessageListItem[] = [];
  public toBeDisplayed: MessageListItem[] = [];
  public displayedMessages: MessageListItem[] = [];
  public selectedMessages: MessageListItem[] = [];
  public searchbarEnabled: boolean = false;

  public componentState:
    "loading" | "loaded" | "empty" | "error" | "loadedProgress" | "login"
    = "loading";
  public error: AdministrationError;
  private onDestroyUnsubscribe$: Subject<void> = new Subject<void>();
  private willLeaveUnsubscribe$: Subject<void>;
  private reloaderSubscription: Subscription;

  constructor(
    public fDate: FormattedDateService,

    private userManager: UserManagerService,
    private router: Router,
    private route: ActivatedRoute,
    private prompt: PromptService,
    private translator: TranslateService,
    private menuCtrl: MenuController,
    private app: AppService,
    private diacriticsHelper: DiacriticsHelper,
  ) {
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.onDestroyUnsubscribe$)).subscribe(params => {
      if (params && params.forceRefresh) {
        this.loadMessages(true);
      }
    });
    this.route.params.pipe(takeUntil(this.onDestroyUnsubscribe$)).subscribe(p => {
      this.folder = p.folder;
    });
  }

  async ionViewWillEnter() {
    this.selectedMessages = [];
    this.willLeaveUnsubscribe$ = new Subject();
    this.menuCtrl.enable(true);
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.initPage();
      }
    });
    this.initPage();
  }

  ionViewWillLeave() {
    if (this.reloaderSubscription) this.reloaderSubscription.unsubscribe();
    this.willLeaveUnsubscribe$.next();
    this.willLeaveUnsubscribe$.complete();
  }

  ngOnDestroy(): void {
    if (this.reloaderSubscription) this.reloaderSubscription.unsubscribe();
    this.onDestroyUnsubscribe$.next();
    this.onDestroyUnsubscribe$.complete();
  }

  async initPage() {
    if (!this.userManager.currentUser.isAdministrationRegistered()) {
      return this.componentState = "login";
    }
    await this.loadMessages();
  }

  public async loadMessages(forceRefresh: boolean = false, event?) {
    if (event && this.componentState == "loading" || this.componentState == "loadedProgress") {
      event.target.complete();
      return;
    }
    this.error = null;
    this.userManager.currentUser.getMessageList(this.folder, forceRefresh).pipe(takeUntil(this.willLeaveUnsubscribe$)).subscribe(
      {
        next: d => {
          if (d) {
            this.messages = d;
            this.messages = this.messages.sort((a, b) => new Date(b.uzenetKuldesDatum).valueOf() - new Date(a.uzenetKuldesDatum).valueOf());
            this.displayedMessages = this.messages
            this.componentState = "loadedProgress";
          }
        },
        complete: () => {
          if (event) event.target.complete();
          if (this.messages.length == 0) {
            this.componentState = 'empty';
          } else {
            this.componentState = 'loaded';
          }
        },
        error: (error) => {
          console.error(error);
          this.error = error;
          if (this.messages.length == 0) {
            this.componentState = "error";
            if (event) event.target.complete()
            error.isHandled = true;
          } else {
            this.componentState = "loaded";
            if (event) event.target.complete()
          }

          throw error;
        }
      }
    );
  }

  public openNewMsgPage() {
    this.router.navigateByUrl('messages/new-message');
  }

  public resetDisplay() {
    this.displayedMessages = [];
    this.toBeDisplayed = [...this.messages];
    this.displayMessages(this.initNumberMessages);
  }

  public msgClicked(m: MessageListItem) {
    if (this.selectedMessages.length == 0) {
      this.openMessage(m)
    } else {
      this.selectOrUnselectMsg(m);
    }
  }

  public toggleSearchbar(enabled: boolean = true) {
    this.searchbarEnabled = enabled;

    if (!enabled) {
      this.resetDisplay();
    }
  }

  private displayMessages(number: number) {
    const temp = this.toBeDisplayed.splice(-number, number).reverse();
    this.displayedMessages.push(...temp);
  }

  public loadMoreData(event?) {
    this.displayMessages(this.incrementNumberMessages);

    if (event) {
      event.target.complete();

      if (this.messages.length <= 0 || this.displayMessages.length >= 150) {
        event.target.disabed = true;
      }
    }
  }

  public onSearchChange(event) {
    if (event.detail.value == "") {
      this.displayedMessages = [];
      this.toBeDisplayed = [...this.messages];
      this.displayMessages(this.initNumberMessages);
      return;
    }

    this.toBeDisplayed = this.messages.filter(x => {
      const search = this.diacriticsHelper.removeDiacritics(event.detail.value.toLocaleLowerCase());

      // subject
      if (this.diacriticsHelper.removeDiacritics(x.uzenetTargy.toLocaleLowerCase()).includes(search)) return true;

      // inbox -> sender
      if (
        x.uzenetFeladoNev &&
        x.uzenetFeladoTitulus &&
        (this.diacriticsHelper.removeDiacritics(x.uzenetFeladoNev.toLocaleLowerCase()).includes(search) ||
          this.diacriticsHelper.removeDiacritics(x.uzenetFeladoTitulus.toLocaleLowerCase()).includes(search))
      )
        return true;

      // outbox -> recipient --------- We ain't filtering by no recipients
      // if (x.uzenetCimzettLista) {
      //   let recipientSearchString;
      //   x.uzenetCimzettLista.map(a => (recipientSearchString += a.nev));
      //   if (recipientSearchString.toLocaleLowerCase().includes(search)) return true;
      // }
    });

    this.displayedMessages = [];
    this.displayMessages(this.initNumberMessages);
  }

  public selectOrUnselectMsg(m: MessageListItem) {
    if (m.selected === true) {
      this.selectedMessages.splice(this.selectedMessages.indexOf(m), 1);
      m.selected = false;
    } else {
      this.selectedMessages.push(m);
      m.selected = true;
    }
  }
  public unselectAll() {
    this.selectedMessages = [];
    this.displayedMessages = this.displayedMessages.map(m => { m.selected = false; return m });
  }
  async binSelected(action: 'put' | 'remove') {
    let ids = [];
    this.selectedMessages.forEach(m => {
      ids.push(m.azonosito)
    });
    await this.userManager.currentUser.binMessage(action, ids);
    if (action == 'put') {
      this.prompt.toast(this.translator.instant('pages.message-list.successfullyDeletedText'), true);
    } else {
      this.prompt.toast(this.translator.instant('pages.message-list.successfullyRestoredText'), true);
    }

    this.selectedMessages = [];
    this.componentState = "loadedProgress";
    await this.userManager.currentUser.clearUserCacheByCategory('administration.outboxMessageList');
    await this.userManager.currentUser.clearUserCacheByCategory('administration.inboxMessageList');
    await this.userManager.currentUser.clearUserCacheByCategory('administration.deletedMessageList');
    this.loadMessages(true);
  }
  async deleteSelected() {
    let ids = [];
    this.selectedMessages.forEach(m => {
      ids.push(m.azonosito)
    });
    let promptRes = await this.prompt.getTrueOrFalseWithText(
      this.translator.instant('pages.message-list.confirmDelete.header'),
      "",
      this.translator.instant('pages.message-list.confirmDelete.message'),
      "yes-no"
    );
    if (promptRes) {
      await this.userManager.currentUser.deleteMessage(ids);

      this.componentState = "loadedProgress";
      this.selectedMessages = [];
      await this.userManager.currentUser.clearUserCacheByCategory('administration.deletedMessageList');
      this.loadMessages(true);
    }
  }
  async setSelectedAsUnread() {
    let ids = [];
    this.selectedMessages.forEach(m => {
      ids.push(m.azonosito)
    });
    await this.userManager.currentUser.changeMessageState('unread', ids);
    this.prompt.toast(this.translator.instant('pages.message-list.successfullyUnread'), true);

    this.componentState = "loadedProgress";
    this.selectedMessages = [];
    await this.userManager.currentUser.clearUserCacheByCategory('administration.inboxMessageList');
    this.loadMessages(true);
  }

  async openMessage(message: MessageListItem) {
    if (!message.isElolvasva) {
      await this.userManager.currentUser.changeMessageState('read', [message.azonosito]);
      this.loadMessages(true);
    }
    this.router.navigateByUrl('/messages/read-message?messageId=' + message.azonosito);
  }

  swipe(event) {
    if (!this.userManager.currentUser.isAdministrationRegistered()) return;
    if (event.direction === 2) {
      //swiped left, needs to load page to the right
      if (this.swipeRouterData.indexOf(this.folder) != 2) {
        this.router.navigateByUrl('messages/list/' + this.swipeRouterData[this.swipeRouterData.indexOf(this.folder) + 1]);
      }
    } else {
      //swiped right, needs to load page to the left
      if (this.swipeRouterData.indexOf(this.folder) != 0) {
        this.router.navigateByUrl('messages/list/' + this.swipeRouterData[this.swipeRouterData.indexOf(this.folder) - 1]);
      }
    }
  }
}
