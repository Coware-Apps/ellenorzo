import { Component, OnInit } from '@angular/core';
import { Student } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Subject } from 'rxjs';
import { UserManagerService } from '../_services/user-manager.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {

  public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
  public student: Student;
  public unsubscribe$: Subject<void>;

  constructor(
    public fDate: FormattedDateService,

    private firebaseX: FirebaseX,
    private userManager: UserManagerService,
  ) {
  }

  async ngOnInit() {
    this.firebaseX.setScreenName('user');
  }

  async ionViewWillEnter() {
    this.unsubscribe$ = new Subject();
    this.userManager.reloader.pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
      if (val == 'reload') {
        this.componentState = 'loading';
        this.loadData();
      }
    });
    this.loadData();
  }

  private loadData(forceRefresh: boolean = false, event?) {
    this.userManager.currentUser.getAsyncAsObservableWithCache<[Student]>(
      [{
        name: "getStudent",
        cacheKey: "student",
        params: [null, null, true]
      }],
      forceRefresh
    ).pipe(takeUntil(this.unsubscribe$)).subscribe(
      {
        next: d => {
          this.student = d[0];
        },
        complete: () => {
          if (event) event.target.complete();

          this.componentState = this.student ? 'loaded' : 'empty'
        },
        error: (error) => {
          console.error(error);

          if (event) event.target.complete();

          this.componentState = this.student ? 'loaded' : 'error'

          throw error;
        }
      }
    )
  }

  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  async doRefresh(event?) {
    this.componentState = 'loadedProgress';
    this.loadData(true, event);
  }
}
