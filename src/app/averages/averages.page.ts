import { Component, OnInit } from '@angular/core';
import { Student, SubjectAverage } from '../_models/student';
import { ColorService } from '../_services/color.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { Observable, Subscription, Subject } from 'rxjs';
import { PromptService } from '../_services/prompt.service';
import { UserManagerService } from '../_services/user-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { HwBackButtonService } from '../_services/hw-back-button.service';


@Component({
  selector: 'app-averages',
  templateUrl: './averages.page.html',
  styleUrls: ['./averages.page.scss'],
})
export class AveragesPage implements OnInit {

  public student: Student;
  public subjectAverages: Observable<SubjectAverage[]>;
  public sans: boolean;
  public showProgressBar: boolean;

  private studentSubscription: Subscription;
  private reloaderSubscription: Subscription;
  public unsubscribe$: Subject<void>;

  constructor(
    public color: ColorService,

    private hw: HwBackButtonService,
    private navRouter: Router,
    private data: DataService,
    private firebase: FirebaseX,
    private userManager: UserManagerService,
    private prompt: PromptService,
    private translator: TranslateService,
  ) {
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.firebase.setScreenName('averages');
  }

  async ionViewDidEnter() {
    this.unsubscribe$ = new Subject();
    this.hw.registerHwBackButton(this.unsubscribe$);
    await this.loadData();
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.sans = true;
        this.showProgressBar = true;
        this.studentSubscription.unsubscribe();
        this.loadData();
      }
    });
  }

  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.studentSubscription != null) {
      this.studentSubscription.unsubscribe();
    }
    if (this.reloaderSubscription != null) {
      this.reloaderSubscription.unsubscribe();
    }
  }

  private async loadData() {
    this.subjectAverages = new Observable<SubjectAverage[]>((observer) => {
      this.studentSubscription = this.userManager.currentUser.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          console.log("got skeleton");
          //there is no data in the storage, showing skeleton text until the server responds
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data until the server responds, disabling skeleton text
          observer.next(subscriptionData.data.SubjectAverages);
          this.student = subscriptionData.data;
          this.sans = false;
          console.log("got placeholder");
        } else {
          //the server has now responded, disabling progress bar and skeleton text if it's still there
          observer.next(subscriptionData.data.SubjectAverages);
          //only storing the entire student when the site has completely loaded, because we only need it for when the user clicks the average-graphs button
          this.student = subscriptionData.data;
          this.showProgressBar = false;
          this.sans = false;
          this.prompt.dismissTopToast();
          console.log("got final");
        }
      });
    });
    await this.userManager.currentUser.initializeStudent();
  }

  async showModal(subject: string, classValue: number, student: Student) {
    if (!this.showProgressBar) {
      this.data.setData("subject", subject);
      this.data.setData("student", this.student);
      this.data.setData("classValue", classValue);
      this.navRouter.navigateByUrl("/average-graphs?fromRoute=averages");
    } else {
      this.prompt.toast(this.translator.instant('pages.averages.loadingToastText'), true);
    }
  }

  async doRefresh(event: any) {
    this.showProgressBar = true;
    await this.userManager.currentUser.updateStudent();
    console.log('got student');
    event.target.complete();
  }

  getNumOfGrades(subject: string) {
    let returnVal = 0;
    this.student.Evaluations.forEach(e => {
      if (e.Subject == subject) {
        returnVal++;
      }
    });
    return returnVal;
  }
  getCountingGrades(subject: string) {
    let returnVal = 0;
    this.student.Evaluations.forEach(e => {
      if (e.Subject == subject && e.IsAtlagbaBeleszamit == true && e.Form == 'Mark' && e.Type == 'MidYear') {
        returnVal++;
      }
    });
    return returnVal;
  }

  getShadowColor(average: number) {
    if (average >= 4.5) {
      return this.color.cardColors.fiveColor;
    }
    else if (average < 4.5 && average >= 3.5) {
      return this.color.cardColors.fourColor;
    }
    else if (average < 3.5 && average >= 2.5) {
      return this.color.cardColors.threeColor;
    }
    else if (average < 2.5 && average >= 1.5) {
      return this.color.cardColors.twoColor;
    }
    else if (average < 1.5) {
      return this.color.cardColors.oneColor;
    }
  }
  async showPicker() {
    this.navRouter.navigateByUrl('/color-picker?from=averages');
  }
}
