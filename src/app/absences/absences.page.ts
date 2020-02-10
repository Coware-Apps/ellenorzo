import { Component, OnInit, ViewChild } from '@angular/core';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Student, Absence } from '../_models/student';
import { KretaService } from '../_services/kreta.service';
import { IonSlides, AlertController, IonContent } from '@ionic/angular';
import { ColorService } from '../_services/color.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';

@Component({
  selector: 'app-absences',
  templateUrl: './absences.page.html',
  styleUrls: ['./absences.page.scss'],
})
export class AbsencesPage implements OnInit {
  @ViewChild('slides', { static: true }) slides: IonSlides;
  @ViewChild('scroll', { static: true }) content: IonContent;

  public absences: Absence[];
  public focused: number;
  public title: string;
  public sans;
  public scroll: boolean;
  public a: boolean;
  public totalAbsences: number;
  public collapsableJustifiedAbsences: UniversalSortedData[];
  public collapsableUnJustifiedAbsences: UniversalSortedData[];
  public collapsableBeJustifiedAbsences: UniversalSortedData[];


  private student: Student;

  constructor(
    public fDate: FormattedDateService,

    private kretaService: KretaService,
    private alertCtrl: AlertController,
    private color: ColorService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private collapsifyService: CollapsifyService,
  ) {
    this.absences = [];
    this.focused = 0;
    this.collapsableJustifiedAbsences = [];
    this.collapsableUnJustifiedAbsences = [];
    this.collapsableBeJustifiedAbsences = [];
    this.title = "Igazolt";
    this.a = false;
    this.totalAbsences = 0;
  }

  async ngOnInit() {
    this.sans = true;
    this.student = await this.kretaService.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"));

    let justifiedAbsences: Absence[] = [];
    let unJustifiedAbsences: Absence[] = [];
    let beJustifiedAbsences: Absence[] = [];

    this.focused = 0;
    for (let i = 0; i < this.student.Absences.length; i++) {
      this.absences.push(this.student.Absences[i]);

      this.totalAbsences += this.student.Absences[i].Type == 'Delay' ? this.student.Absences[i].DelayTimeMinutes : 45;

      switch (this.student.Absences[i].JustificationStateName) {
        case "Igazolt mulasztás":
          justifiedAbsences.push(this.student.Absences[i]);
          break;

        case "Igazolandó mulasztás":
          beJustifiedAbsences.push(this.student.Absences[i]);
          break;

        default:
          unJustifiedAbsences.push(this.student.Absences[i]);
          break;
      }
    }

    this.collapsableJustifiedAbsences = this.collapsifyService.collapsifyByDates(justifiedAbsences, 'LessonStartTime', 'LessonStartTime');
    this.collapsableBeJustifiedAbsences = this.collapsifyService.collapsifyByDates(beJustifiedAbsences, 'LessonStartTime', 'LessonStartTime');
    this.collapsableUnJustifiedAbsences = this.collapsifyService.collapsifyByDates(unJustifiedAbsences, 'LessonStartTime', 'LessonStartTime');

    console.log('cJustified', this.collapsableJustifiedAbsences);
    console.log('cBeJustified', this.collapsableBeJustifiedAbsences);
    console.log('cUnJustified', this.collapsableUnJustifiedAbsences);
    this.sans = false;

    this.firebase.setScreenName('absences');
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

  getData(day: number) {
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

  getMoreData(absence: Absence) {
    this.prompt.absenceAlert(absence);
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
