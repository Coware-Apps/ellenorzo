import { Component, OnInit } from "@angular/core";
import { Message } from "../_models/kreta-v2/message";
import { FormattedDateService } from "../_services/formatted-date.service";
import { Subscription, Observable, Subject } from "rxjs";
import { UserManagerService } from "../_services/user-manager.service";
import { MenuController } from "@ionic/angular";
import { HwBackButtonService } from "../_services/hw-back-button.service";
import { FirebaseService } from "../_services/firebase.service";

@Component({
    selector: "app-messages",
    templateUrl: "./messages.page.html",
    styleUrls: ["./messages.page.scss"],
})
export class MessagesPage implements OnInit {
    public messages: Observable<Message[]>;
    public sans: boolean;
    public showProgressBar: boolean;
    public messageListSubscription: Subscription;
    public reloaderSubscription: Subscription;
    public inboxEmpty: boolean = false;
    private willLeaveUnsubscribe$: Subject<void>;
    constructor(
        public fDate: FormattedDateService,
        public userManager: UserManagerService,

        private hw: HwBackButtonService,
        private firebase: FirebaseService,
        private menuCtrl: MenuController
    ) {
        this.sans = true;
        this.showProgressBar = true;
    }

    ionViewWillEnter() {
        this.willLeaveUnsubscribe$ = new Subject<void>();
        this.hw.registerHwBackButton(this.willLeaveUnsubscribe$);
    }

    ionViewWillLeave() {
        this.willLeaveUnsubscribe$.next();
        this.willLeaveUnsubscribe$.complete();
    }

    ngOnInit() {
        this.firebase.setScreenName("messages");
        this.menuCtrl.enable(true);
    }
}
