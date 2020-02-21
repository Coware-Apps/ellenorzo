import { Component, OnInit } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { Message } from '../_models/message';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';
import { DataLoaderService } from '../_services/data-loader.service';
import { Subscription, Observable } from 'rxjs';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';

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
  constructor(
    public fDate: FormattedDateService,

    private router: Router,
    private kreta: KretaService,
    private dataService: DataService,
    private dataLoader: DataLoaderService,
    private firebaseX: FirebaseX,
  ) {
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {

  }

  async ionViewDidEnter() {
    this.messages = new Observable<Message[]>((observer) => {
      this.messageListSubscription = this.dataLoader.messageList.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          this.sans = true;
        } else if (subscriptionData.type == "placeholder") {
          subscriptionData.data.sort((a, b) => new Date(b.uzenet.kuldesDatum).valueOf() - new Date(a.uzenet.kuldesDatum).valueOf());
          observer.next(subscriptionData.data);
          this.sans = false;
        } else {
          subscriptionData.data.sort((a, b) => new Date(b.uzenet.kuldesDatum).valueOf() - new Date(a.uzenet.kuldesDatum).valueOf());
          observer.next(subscriptionData.data);
          this.sans = false;
          this.showProgressBar = false;
        }
      });
      this.dataLoader.initializeMessageList();
    });
    this.firebaseX.setScreenName('messages');
  }

  ionViewWillLeave() {
    this.messageListSubscription.unsubscribe();
  }

  async doRefresh(event: any) {
    console.log("begin operation");
    this.showProgressBar = true;
    await this.dataLoader.updateMessageList();
    event.target.complete();
  }

  async openMessage(message: Message) {
    if (!message.isElolvasva) {
      await this.kreta.setMessageAsRead(message.uzenet.azonosito);
    }
    this.dataService.setData('messageId', message.azonosito);
    this.router.navigateByUrl('/messages/read-message');
  }

}
