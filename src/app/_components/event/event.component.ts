import { Component, OnInit, Input } from "@angular/core";
import { FormattedDateService } from "src/app/_services/formatted-date.service";
import { TranslateService } from "@ngx-translate/core";
import { Event } from "src/app/_models/kreta-v2/event";

@Component({
    selector: "app-event",
    templateUrl: "./event.component.html",
    styleUrls: ["./event.component.scss"],
})
export class EventComponent implements OnInit {
    @Input() event: Event;

    constructor(
        public fDate: FormattedDateService,

        private translator: TranslateService
    ) {}

    ngOnInit() {}

    getLongItemText(text: string) {
        if (text.length > 100) {
            return text.substring(0, 100) + "...";
        } else {
            return text;
        }
    }

    isOpenableNeeded(text: string) {
        if (text.length > 100) {
            return this.translator.instant("pages.home.readMoreText");
        } else {
            return "";
        }
    }
}
