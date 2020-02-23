import { Component, OnInit, ViewChild } from '@angular/core';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Student, Absence } from '../_models/student';
import { KretaService } from '../_services/kreta.service';
import { IonSlides, AlertController, IonContent } from '@ionic/angular';
import { ColorService } from '../_services/color.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';
import { DataLoaderService } from '../_services/data-loader.service';
import { Observable, Subscription } from 'rxjs';
import { AppService } from '../_services/app.service';

interface AbsenceGroup {
  data: UniversalSortedData[];
  empty: boolean;
  name: string;
  fullName: string;
}
@Component({
  selector: 'app-absences',
  templateUrl: './absences.page.html',
  styleUrls: ['./absences.page.scss'],
})
export class AbsencesPage implements OnInit {
  @ViewChild('slides', { static: true }) slides: IonSlides;
  @ViewChild('scroll', { static: true }) content: IonContent;

  public focused: number;
  public title: string;
  public sans;
  public scroll: boolean;
  public a: boolean;
  public totalAbsences: number;
  public allAbsences: Observable<AbsenceGroup[]>;
  public showProgressBar: boolean;

  private student: Student;
  private studentSubscription: Subscription;

  constructor(
    public fDate: FormattedDateService,
    public app: AppService,

    private alertCtrl: AlertController,
    private color: ColorService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private collapsifyService: CollapsifyService,
    private dataLoader: DataLoaderService,
  ) {
    this.focused = 0;
    this.title = "Igazolt";
    this.a = false;
    this.totalAbsences = 0;
    this.showProgressBar = true;
    this.sans = true;
  }

  async ngOnInit() {
    this.allAbsences = new Observable<AbsenceGroup[]>((observer) => {
      this.studentSubscription = this.dataLoader.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          //there is no data in the storage, showing skeleton text until the server responds
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data (placeholder) until the server responds, disabling skeleton text
          observer.next(this.formatStudent(subscriptionData.data));
          this.sans = false;
        } else {
          //the server has now responded, disabling progress bar and skeleton text if it's still there
          observer.next(this.formatStudent(subscriptionData.data));
          this.showProgressBar = false;
          this.sans = false;
        }
      });
      this.dataLoader.initializeStudent();
    });
    this.firebase.setScreenName('absences');
  }

  ionViewWillLeave() {
    this.studentSubscription.unsubscribe();
  }

  private formatStudent(student: Student): AbsenceGroup[] {
    let allAbsences: AbsenceGroup[] = [];
    let justifiedEmpty = true;
    let unJustifiedEmpty = true;
    let beJustifiedEmpty = true;
    let justifiedAbsences: Absence[] = [];
    let unJustifiedAbsences: Absence[] = [];
    let beJustifiedAbsences: Absence[] = [];

    this.focused = 0;
    for (let i = 0; i < student.Absences.length; i++) {

      this.totalAbsences += student.Absences[i].Type == 'Delay' ? student.Absences[i].DelayTimeMinutes : 45;

      switch (student.Absences[i].JustificationStateName) {
        case "Igazolt mulasztás":
          justifiedAbsences.push(student.Absences[i]);
          justifiedEmpty = false;
          break;

        case "Igazolandó mulasztás":
          beJustifiedAbsences.push(student.Absences[i]);
          beJustifiedEmpty = false;
          break;

        default:
          unJustifiedAbsences.push(student.Absences[i]);
          unJustifiedEmpty = false;
          break;
      }
    }

    allAbsences[0] = {
      data: this.collapsifyService.closeAllOpenTop(this.collapsifyService.collapsifyByDates(justifiedAbsences, 'LessonStartTime', 'LessonStartTime')),
      empty: justifiedEmpty,
      name: 'justified',
      fullName: 'igazolt',
    };
    allAbsences[1] = {
      data: this.collapsifyService.closeAllOpenTop(this.collapsifyService.collapsifyByDates(beJustifiedAbsences, 'LessonStartTime', 'LessonStartTime')),
      empty: beJustifiedEmpty,
      name: 'beJustified',
      fullName: 'igazolandó',
    }
    allAbsences[2] = {
      data: this.collapsifyService.closeAllOpenTop(this.collapsifyService.collapsifyByDates(unJustifiedAbsences, 'LessonStartTime', 'LessonStartTime')),
      empty: unJustifiedEmpty,
      name: 'unJustified',
      fullName: 'igazolatlan',
    }
    return allAbsences;
  }

  async ionSlideWillChange() {
    this.focused = await this.slides.getActiveIndex();
    switch (this.focused) {
      case 0:
        this.title = "Igazolt";
        break;
      case 1:
        this.title = "Igazolandó";
        break;
      case 2:
        this.title = "Igazolatlan";
        break;
    }
  }

  async getData(event: any) {
    if (await this.slides.getActiveIndex() == this.focused) {
      //the segment's ionChange event wasn't fired by a slide moving
      let day = event.detail.value;
      this.focused = day;
      this.slides.slideTo(day);
      switch (day) {
        case 0:
          this.title = "Igazolt";
          break;
        case 1:
          this.title = "Igazolandó";
          break;
        case 2:
          this.title = "Igazolatlan";
          break;
      }
    }
  }

  getMoreData(absence: Absence) {
    this.prompt.absenceAlert(absence);
  }

  async doRefresh(event: any) {
    console.log("begin operation");
    this.showProgressBar = true;
    await this.dataLoader.updateStudent();
    event.target.complete();
  }

  scrollToTop() {
    this.content.scrollToTop();
  }

  ionScroll(event) {
    if (event.detail.scrollTop == 0) {
      this.a = false;
    }
    else {
      this.a = true;
    }
  }

  showTotal() {
    this.presentAlert("Mulasztások", null, "Összesen: " + (this.totalAbsences - this.totalAbsences % 45) / 45 + " óra " + this.totalAbsences % 45 + " perc", this.color.getPopUpClass());
  }

  async presentAlert(header: string, subHeader: string, message: string, css: string) {
    const alert = await this.alertCtrl.create({
      cssClass: css,
      header: header,
      subHeader: subHeader,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

}
