import { Component, OnInit } from '@angular/core';
import { UserManagerService } from '../_services/user-manager.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { Subscription, Observable, Subject } from 'rxjs';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';
import { FormattedDateService } from '../_services/formatted-date.service';
import { AppService } from '../_services/app.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
})
export class EventsPage implements OnInit {
  public sans: boolean = true;
  public showProgressBar: boolean = true;
  public eventsByMonth: Observable<UniversalSortedData[]>;
  public isEmpty: boolean = false;

  private eventsSubscription: Subscription;
  private reloaderSubscription: Subscription;
  public unsubscribe$: Subject<void>;

  constructor(
    public fDate: FormattedDateService,

    private userManager: UserManagerService,
    private firebaseX: FirebaseX,
    private collapsifyService: CollapsifyService,
    private app: AppService,
  ) { }

  ngOnInit() {
    this.firebaseX.setScreenName('events');
  }
  async ionViewDidEnter() {
    this.unsubscribe$ = new Subject();
    this.app.registerHwBackButton(this.unsubscribe$);
    await this.loadData();
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.sans = true;
        this.showProgressBar = true;
        this.eventsSubscription.unsubscribe();
        this.loadData();
      }
    });
  }
  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.eventsSubscription != null) {
      this.eventsSubscription.unsubscribe();
    }
    if (this.reloaderSubscription != null) {
      this.reloaderSubscription.unsubscribe();
    }
  }


  private async loadData() {
    this.eventsByMonth = new Observable<UniversalSortedData[]>((observer) => {
      this.eventsSubscription = this.userManager.currentUser.events.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          this.sans = true;
          this.showProgressBar = true;
        } else if (subscriptionData.type == "placeholder") {
          let cd = this.collapsifyService.collapsifyByMonths(subscriptionData.data, 'Date');
          if (cd.length == 0) {
            this.isEmpty = true;
          } else {
            this.isEmpty = false;
          }
          observer.next(cd);
          this.sans = false;
          this.showProgressBar = true;
        } else {
          let cd = this.collapsifyService.collapsifyByMonths(subscriptionData.data, 'Date');
          if (cd.length == 0) {
            this.isEmpty = true;
          } else {
            this.isEmpty = false;
          }
          observer.next(cd);
          this.showProgressBar = false;
          this.sans = false;
        }
      });
    });
    await this.userManager.currentUser.initializeEvents()
  }

  async doRefresh(event: any) {
    this.showProgressBar = true;
    await this.userManager.currentUser.updateEvents();
    event.target.complete();
  }
}
