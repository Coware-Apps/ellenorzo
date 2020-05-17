import { Component, OnInit, NgZone } from '@angular/core';
import { Message } from '../_models/message';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Subscription, Observable, Subject } from 'rxjs';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { UserManagerService } from '../_services/user-manager.service';
import { MenuController } from '@ionic/angular';
import { HwBackButtonService } from '../_services/hw-back-button.service';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

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
  private willLeaveUnsubscribe$: Subject<void>;
  constructor(
    public fDate: FormattedDateService,
    public userManager: UserManagerService,

    private hw: HwBackButtonService,
    private firebaseX: FirebaseX,
    private menuCtrl: MenuController,
    private router: Router,
    private ngZone: NgZone,
  ) {
    this.sans = true;
    this.showProgressBar = true;
  }

  ionViewWillEnter() {
    this.willLeaveUnsubscribe$ = new Subject<void>();
    this.userManager.reloader.pipe(takeUntil(this.willLeaveUnsubscribe$)).subscribe(r => {
      if (r == 'reload') {
        if (!this.userManager.currentUser.administrationTokens) {
          this.ngZone.run(() => this.router.navigateByUrl('login-administration'));
        }
      }
    })
    if (!this.userManager.currentUser.administrationTokens) {
      this.ngZone.run(() => this.router.navigateByUrl('login-administration'));
    }
    this.hw.registerHwBackButton(this.willLeaveUnsubscribe$);
  }

  ionViewWillLeave() {
    this.willLeaveUnsubscribe$.next();
    this.willLeaveUnsubscribe$.complete();
  }

  async ngOnInit() {
    this.firebaseX.setScreenName('messages');
    this.menuCtrl.enable(true);
  }
}
