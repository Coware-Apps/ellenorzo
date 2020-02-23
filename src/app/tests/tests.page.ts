import { Component, OnInit } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { Test } from '../_models/test';
import { FormattedDateService } from '../_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { UniversalSortedData, CollapsifyService } from '../_services/collapsify.service';
import { DataLoaderService } from '../_services/data-loader.service';
import { Observable, Subscription } from 'rxjs';
import { AppService } from '../_services/app.service';


@Component({
  selector: 'app-tests',
  templateUrl: './tests.page.html',
  styleUrls: ['./tests.page.scss'],
})
export class TestsPage implements OnInit {
  public tests: Test[];
  public sans: boolean;
  public showProgressBar: boolean;
  public testsByMonth: Observable<UniversalSortedData[]>;
  public monthsName: string[];

  private testsSubscription: Subscription;

  constructor(
    public fDate: FormattedDateService,
    public app: AppService,

    private firebase: FirebaseX,
    private kreta: KretaService,
    private collapsifyService: CollapsifyService,
    private dataLoader: DataLoaderService,
  ) {
    this.monthsName = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    //the official app uses the API this way, I will change this method once they do
    this.tests = await this.kreta.getTests(null, null);

    this.testsByMonth = new Observable<UniversalSortedData[]>((observer) => {
      this.testsSubscription = this.dataLoader.tests.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          this.sans = true;
        } else if (subscriptionData.type == "placeholder") {
          observer.next(this.collapsifyService.collapsifyByMonths(this.tests, 'Datum'));
          this.sans = false;
        } else {
          observer.next(this.collapsifyService.collapsifyByMonths(this.tests, 'Datum'));
          this.showProgressBar = false;
          this.sans = false;
        }
      });
    });
    this.dataLoader.initializeTests()
    this.firebase.setScreenName('tests');
  }

  ionViewWillLeave() {
    this.testsSubscription.unsubscribe();
  }

  async doRefresh(event: any) {
    console.log("begin operation");
    this.showProgressBar = true;
    await this.dataLoader.updateTests();
    event.target.complete();
  }


}
