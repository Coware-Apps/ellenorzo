import { Component, OnInit } from '@angular/core';
import { FormattedDateService } from '../_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { UniversalSortedData, CollapsifyService } from '../_services/collapsify.service';
import { Observable, Subscription, Subject } from 'rxjs';
import { AppService } from '../_services/app.service';
import { UserManagerService } from '../_services/user-manager.service';


@Component({
  selector: 'app-tests',
  templateUrl: './tests.page.html',
  styleUrls: ['./tests.page.scss'],
})
export class TestsPage implements OnInit {
  public sans: boolean;
  public showProgressBar: boolean;
  public testsByMonth: Observable<UniversalSortedData[]>;
  public monthsName: string[];

  private testsSubscription: Subscription;
  private reloaderSubscription: Subscription;
  public unsubscribe$: Subject<void>;

  constructor(
    public fDate: FormattedDateService,
    public app: AppService,

    private firebase: FirebaseX,
    private collapsifyService: CollapsifyService,
    private userManager: UserManagerService,
  ) {
    this.monthsName = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.firebase.setScreenName('tests');
  }
  async ionViewDidEnter() {
    this.unsubscribe$ = new Subject();
    this.app.registerHwBackButton(this.unsubscribe$);
    await this.loadData();
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.sans = true;
        this.showProgressBar = true;
        this.testsSubscription.unsubscribe();
        this.loadData();
      }
    });
  }
  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.testsSubscription != null) {
      this.testsSubscription.unsubscribe();
    }
    if (this.reloaderSubscription != null) {
      this.reloaderSubscription.unsubscribe();
    }
  }

  private async loadData() {
    this.testsByMonth = new Observable<UniversalSortedData[]>((observer) => {
      this.testsSubscription = this.userManager.currentUser.tests.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          this.sans = true;
          this.showProgressBar = true;
        } else if (subscriptionData.type == "placeholder") {
          observer.next(this.collapsifyService.collapsifyByMonths(subscriptionData.data, 'Datum'));
          this.sans = false;
          this.showProgressBar = true;
        } else {
          observer.next(this.collapsifyService.collapsifyByMonths(subscriptionData.data, 'Datum'));
          this.showProgressBar = false;
          this.sans = false;
        }
      });
    });
    await this.userManager.currentUser.initializeTests()
  }

  async doRefresh(event: any) {
    this.showProgressBar = true;
    await this.userManager.currentUser.updateTests();
    event.target.complete();
  }
}
