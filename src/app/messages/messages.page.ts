import { Component, OnInit } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { Message } from '../_models/message';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
})
export class MessagesPage implements OnInit {
  public messages: Message[];
  public sans: boolean;
  constructor(
    public fDate: FormattedDateService,

    private router: Router,
    private kreta: KretaService,
    private dataService: DataService,
  ) {
    this.sans = true;
  }

  async ngOnInit() {

  }

  async ionViewDidEnter() {
    this.sans = true;
    this.messages = await this.kreta.getMessageList(true);
    this.messages.sort((a, b) => new Date(b.uzenet.kuldesDatum).valueOf() - new Date(a.uzenet.kuldesDatum).valueOf());
    this.sans = false;
  }

  async openMessage(message: Message) {
    if (!message.isElolvasva) {
      await this.kreta.setMessageAsRead(message.uzenet.azonosito);
    }
    this.dataService.setData('messageId', message.azonosito);
    this.router.navigateByUrl('/messages/read-message');
  }

}
