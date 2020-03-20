import { Component, OnInit } from '@angular/core';
import { UserManagerService } from '../_services/user-manager.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { Subscription, Observable } from 'rxjs';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';
import { FormattedDateService } from '../_services/formatted-date.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
})
export class EventsPage implements OnInit {
  public sans: boolean = true;
  public showProgressBar: boolean = true;
  public eventsByMonth: Observable<UniversalSortedData[]>;
  private eventsSubscription: Subscription;
  private reloaderSubscription: Subscription;
  constructor(
    public fDate: FormattedDateService,

    private userManager: UserManagerService,
    private firebaseX: FirebaseX,
    private collapsifyService: CollapsifyService,
  ) { }

  ngOnInit() {
    this.firebaseX.setScreenName('events');
  }

  async ionViewDidEnter() {
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

  private async loadData() {
    this.eventsByMonth = new Observable<UniversalSortedData[]>((observer) => {
      this.eventsSubscription = this.userManager.currentUser.events.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          this.sans = true;
          this.showProgressBar = true;
        } else if (subscriptionData.type == "placeholder") {
          observer.next(this.collapsifyService.collapsifyByMonths(subscriptionData.data, 'Date'));
          this.sans = false;
          this.showProgressBar = true;
        } else {
          observer.next(this.collapsifyService.collapsifyByMonths(subscriptionData.data, 'Date'));
          this.showProgressBar = false;
          this.sans = false;
        }
      });
    });
    await this.userManager.currentUser.initializeEvents()
  }

  ionViewWillLeave() {
    if (this.eventsSubscription != null) {
      this.eventsSubscription.unsubscribe();
    }
    if (this.reloaderSubscription != null) {
      this.reloaderSubscription.unsubscribe();
    }
  }

  async doRefresh(event: any) {
    this.showProgressBar = true;
    await this.userManager.currentUser.updateEvents();
    event.target.complete();
  }
}
