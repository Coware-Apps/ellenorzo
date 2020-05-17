import { Component, OnInit, Input } from '@angular/core';
import { Message } from 'src/app/_models/message';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';

@Component({
  selector: 'app-message-card',
  templateUrl: './message-card.component.html',
  styleUrls: ['./message-card.component.scss'],
})
export class MessageCardComponent implements OnInit {
  @Input() message: Message;

  constructor(
    public fDate: FormattedDateService,
  ) { }

  ngOnInit() { }

}
