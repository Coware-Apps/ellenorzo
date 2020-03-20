import { Component, OnInit } from '@angular/core';
import { Student, SubjectAverage } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { ModalController } from '@ionic/angular';
import { AverageGraphsPage } from '../average-graphs/average-graphs.page';
import { ColorService } from '../_services/color.service';
import { KretaService } from '../_services/kreta.service';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { promise } from 'protractor';
import { DataService } from '../_services/data.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { Observable, Subscription } from 'rxjs';
import { PromptService } from '../_services/prompt.service';
import { UserManagerService } from '../_services/user-manager.service';
import { TranslateService } from '@ngx-translate/core';


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

  constructor(
    public color: ColorService,

    private storage: Storage,
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

  private async loadData() {
    this.subjectAverages = new Observable<SubjectAverage[]>((observer) => {
      this.studentSubscription = this.userManager.currentUser.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          console.log("got skeleton");
          //there is no data in the storage, showing skeleton text until the server responds
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data until the server responds, disabling skeleton text
          observer.next(subscriptionData.data.SubjectAverages);
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

  ionViewWillLeave() {
    if (this.studentSubscription != null) {
      this.studentSubscription.unsubscribe();
    }
    if (this.reloaderSubscription != null) {
      this.reloaderSubscription.unsubscribe();
    }
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
