import { Component, OnInit } from '@angular/core';
import { Student, SubjectAverage } from '../_models/student';
import { ColorService } from '../_services/color.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { Subject } from 'rxjs';
import { UserManagerService } from '../_services/user-manager.service';
import { HwBackButtonService } from '../_services/hw-back-button.service';
import { takeUntil } from 'rxjs/operators';
import { KretaError } from '../_exceptions/kreta-exception';


@Component({
  selector: 'app-averages',
  templateUrl: './averages.page.html',
  styleUrls: ['./averages.page.scss'],
})
export class AveragesPage implements OnInit {

  public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
  public student: Student;
  public subjectAverages: SubjectAverage[] = [];
  public error: KretaError;

  public unsubscribe$: Subject<void>;

  constructor(
    public color: ColorService,

    private hw: HwBackButtonService,
    private navRouter: Router,
    private data: DataService,
    private firebase: FirebaseX,
    private userManager: UserManagerService
  ) {
  }

  async ngOnInit() {
    this.firebase.setScreenName('averages');
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
    this.unsubscribe$.complete()
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
          if (d[0] && d[0].SubjectAverages) {
            this.subjectAverages = d[0].SubjectAverages;
            this.student = d[0];
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

          if (!this.student || !this.student.SubjectAverages) {
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
    if (!this.student || !this.student.SubjectAverages) {
      this.componentState = 'error'
    } else if (this.student.SubjectAverages.length == 0) {
      this.componentState = 'empty'
    } else {
      this.componentState = 'loaded'
    }
  }

  async showModal(subject: string, classValue: number) {
    this.data.setData("subject", subject);
    this.data.setData("student", this.student);
    this.data.setData("classValue", classValue);
    this.navRouter.navigateByUrl("/average-graphs?fromRoute=averages");
  }

  async doRefresh(event?) {
    if (this.componentState == 'error') {
      this.componentState = 'loading';
    } else {
      this.componentState = 'loadedProgress';
    }
    this.loadData(true, event);
  }
  getCountingGrades(subject: string) {
    return this.student.Evaluations
      .filter(e =>
        e.Subject == subject &&
        e.IsAtlagbaBeleszamit &&
        e.Form == 'Mark' &&
        e.Type == 'MidYear'
      ).length
  }
}
