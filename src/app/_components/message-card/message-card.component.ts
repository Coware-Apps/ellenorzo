import { Component, OnInit, Input } from "@angular/core";
import { FormattedDateService } from "src/app/_services/formatted-date.service";
import { MessageListItem } from "src/app/_models/administration";

@Component({
    selector: "app-message-card",
    templateUrl: "./message-card.component.html",
    styleUrls: ["./message-card.component.scss"],
})
export class MessageCardComponent implements OnInit {
    @Input() message: MessageListItem;

    constructor(public fDate: FormattedDateService) {}

    ngOnInit() {}
}
