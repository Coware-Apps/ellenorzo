import { Component, OnInit } from '@angular/core';
import { Message } from '../_models/message';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';
import { Subscription, Observable } from 'rxjs';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { UserManagerService } from '../_services/user-manager.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
})
export class MessagesPage implements OnInit {
  public messages: Observable<Message[]>;
  public sans: boolean;
  public showProgressBar: boolean;
  public messageListSubscription: Subscription;
  public reloaderSubscription: Subscription;
  public inboxEmpty: boolean = false;
  constructor(
    public fDate: FormattedDateService,

    private router: Router,
    private userManager: UserManagerService,
    private dataService: DataService,
    private firebaseX: FirebaseX,
  ) {
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.firebaseX.setScreenName('messages');
  }

  async ionViewDidEnter() {
    await this.loadData();
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.sans = true;
        this.showProgressBar = true;
        this.messageListSubscription.unsubscribe();
        this.loadData();
      }
    });
  }

  private async loadData() {
    this.messages = new Observable<Message[]>((observer) => {
      this.messageListSubscription = this.userManager.currentUser.messageList.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          this.sans = true;
          this.showProgressBar = true;
        } else if (subscriptionData.type == "placeholder") {
          console.log('[MESSAGES->loadData()] subscriptionData', subscriptionData);
          subscriptionData.data.sort((a, b) => new Date(b.uzenet.kuldesDatum).valueOf() - new Date(a.uzenet.kuldesDatum).valueOf());
          observer.next(subscriptionData.data);
          this.inboxEmpty = subscriptionData.data.length > 0 ? false : true;
          this.sans = false;
        } else {
          subscriptionData.data.sort((a, b) => new Date(b.uzenet.kuldesDatum).valueOf() - new Date(a.uzenet.kuldesDatum).valueOf());
          observer.next(subscriptionData.data);
          this.inboxEmpty = subscriptionData.data.length > 0 ? false : true;
          this.sans = false;
          this.showProgressBar = false;
        }
      });
    });
    await this.userManager.currentUser.initializeMessageList();
  }

  ionViewWillLeave() {
    this.messageListSubscription.unsubscribe();
    this.reloaderSubscription.unsubscribe();
  }

  async doRefresh(event: any) {
    this.showProgressBar = true;
    await this.userManager.currentUser.updateMessageList();
    event.target.complete();
  }

  async openMessage(message: Message) {
    if (!message.isElolvasva) {
      await this.userManager.currentUser.setMessageAsRead(message.uzenet.azonosito);
    }
    this.dataService.setData('messageId', message.azonosito);
    this.router.navigateByUrl('/messages/read-message');
  }

}
