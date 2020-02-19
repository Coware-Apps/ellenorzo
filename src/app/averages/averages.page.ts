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
import { DataLoaderService } from '../_services/data-loader.service';
import { PromptService } from '../_services/prompt.service';


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

  private shadowcolor: string;
  private studentSubscription: Subscription;

  constructor(
    public color: ColorService,

    private storage: Storage,
    private navRouter: Router,
    private data: DataService,
    private firebase: FirebaseX,
    private dataLoader: DataLoaderService,
    private prompt: PromptService,
  ) {
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.subjectAverages = new Observable<SubjectAverage[]>((observer) => {
      this.studentSubscription = this.dataLoader.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          //there is no data in the storage, showing skeleton text until the server responds
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data until the server responds, disabling skeleton text
          observer.next(subscriptionData.data.SubjectAverages);
          this.sans = false;
        } else {
          //the server has now responded, disabling progress bar and skeleton text if it's still there
          observer.next(subscriptionData.data.SubjectAverages);
          //only storing the entire student when the site has completely loaded, because we only need it for when the user clicks the average-graphs button
          this.student = subscriptionData.data;
          this.showProgressBar = false;
          this.sans = false;
          this.prompt.dismissTopToast();
        }
      });
      this.dataLoader.initializeStudent();
    });
    this.firebase.setScreenName('averages');
  }

  ionViewWillLeave() {
    this.studentSubscription.unsubscribe();
  }

  async ionViewDidEnter() {
    let a;
    this.shadowcolor = (a = await this.storage.get('cardColor')) != null ? a : "&&&&&";
  }

  async showModal(subject: string, classValue: number, student: Student) {
    if (!this.showProgressBar) {
      this.data.setData("subject", subject);
      this.data.setData("student", this.student);
      this.data.setData("classValue", classValue);
      this.navRouter.navigateByUrl("/average-graphs?fromRoute=averages");
    } else {
      this.prompt.toast("Adatok betöltése folyamatban!", true);
    }
  }

  async doRefresh(event: any) {
    console.log("begin operation");
    this.showProgressBar = true;
    await this.dataLoader.updateStudent();
    event.target.complete();
  }

  getShadowColor(average: number) {

    if (this.shadowcolor == null) {
      return this.color.getContrast();
    }

    if (average >= 4.5) {
      return this.shadowcolor.split('&')[0] != "" ? this.shadowcolor.split('&')[0] : "#00CC66";
    }
    else if (average < 4.5 && average >= 3.5) {
      return this.shadowcolor.split('&')[1] != "" ? this.shadowcolor.split('&')[1] : "#FFFF66";
    }
    else if (average < 3.5 && average >= 2.5) {
      return this.shadowcolor.split('&')[2] != "" ? this.shadowcolor.split('&')[2] : "#FF9933";
    }
    else if (average < 2.5 && average >= 1.5) {
      return this.shadowcolor.split('&')[3] != "" ? this.shadowcolor.split('&')[3] : "#663300";
    }
    else if (average < 1.5) {
      return this.shadowcolor.split('&')[4] != "" ? this.shadowcolor.split('&')[4] : "#FF0000";
    }
  }
  async showPicker() {
    this.navRouter.navigateByUrl('/color-picker?from=averages');
  }
}
