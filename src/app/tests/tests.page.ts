import { Component, OnInit } from '@angular/core';
import { FormattedDateService } from '../_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { UniversalSortedData, CollapsifyService } from '../_services/collapsify.service';
import { Subject } from 'rxjs';
import { AppService } from '../_services/app.service';
import { UserManagerService } from '../_services/user-manager.service';
import { HwBackButtonService } from '../_services/hw-back-button.service';
import { takeUntil } from 'rxjs/operators';
import { Test } from '../_models/test';
import { KretaError } from '../_exceptions/kreta-exception';


@Component({
  selector: 'app-tests',
  templateUrl: './tests.page.html',
  styleUrls: ['./tests.page.scss'],
})
export class TestsPage implements OnInit {
  public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
  public testsByMonth: UniversalSortedData[];
  public error: KretaError;

  public unsubscribe$: Subject<void>;

  constructor(
    public fDate: FormattedDateService,
    public app: AppService,

    private firebase: FirebaseX,
    private collapsifyService: CollapsifyService,
    private userManager: UserManagerService,
    private hw: HwBackButtonService,
  ) {
  }

  async ngOnInit() {
    this.firebase.setScreenName('tests');
  }
  async ionViewWillEnter() {
    this.unsubscribe$ = new Subject();
    this.hw.registerHwBackButton(this.unsubscribe$);
    this.userManager.reloader.pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
      if (val == 'reload') {
        this.componentState = 'loading';
        this.loadData();
      }
    });
    this.loadData();
  }
  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private loadData(forceRefresh: boolean = false, event?) {
    this.userManager.currentUser.getAsyncAsObservableWithCache<[Test[]]>(
      [{
        name: "getTests",
        cacheKey: "tests",
        params: [null, null, true]
      }],
      forceRefresh
    ).pipe(takeUntil(this.unsubscribe$)).subscribe(
      {
        next: d => {
          if (d[0]) {
            this.testsByMonth = this.collapsifyService.collapsifyByMonths(d[0], 'Datum')
          }
        },
        complete: () => {
          if (event) event.target.complete();

          this.setComponentState();
        },
        error: (error) => {
          console.error(error);
          this.error = error;

          if (event) event.target.complete();

          if (!this.testsByMonth || (this.testsByMonth && this.testsByMonth.findIndex(md => md.data && md.data.length > 0) == -1)) {
            this.componentState = 'error';
            error.isHandled = true;
          } else {
            this.componentState = 'loaded'
          }

          throw error;
        }
      }
    )
  }
  private setComponentState() {
    if (!this.testsByMonth) {
      this.componentState = 'error'
    } else if (
      this.testsByMonth.findIndex(md => md.data && md.data.length > 0) == -1
    ) {
      this.componentState = 'empty'
    } else {
      this.componentState = 'loaded'
    }
  }
  async doRefresh(event?) {
    if (this.componentState == 'error') {
      this.componentState = 'loading';
    } else {
      this.componentState = 'loadedProgress';
    }
    this.loadData(true, event);
  }
}
