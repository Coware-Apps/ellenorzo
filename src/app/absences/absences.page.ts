import { Component, OnInit, ViewChild } from '@angular/core';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Student, Absence } from '../_models/student';
import { KretaService } from '../_services/kreta.service';
import { IonSlides, AlertController, IonContent } from '@ionic/angular';
import { ColorService } from '../_services/color.service';

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
  public justifiedExistingDates: string[];
  public beJustifiedExistingDates: string[];
  public unJustifiedExistingDates: string[];
  public title: string;
  public sans;
  public scroll: boolean;
  public a: boolean;
  public totalAbsences: number;

  private student: Student;

  constructor(
    public fDate: FormattedDateService,

    private kretaService: KretaService,
    private alertCtrl: AlertController,
    private color: ColorService,
  ) {
    this.absences = [];
    this.focused = 0;
    this.justifiedExistingDates = [];
    this.beJustifiedExistingDates = [];
    this.unJustifiedExistingDates = [];
    this.title = "Igazolt";
    this.a = false;
    this.totalAbsences = 0;
  }

  async ngOnInit() {
    this.sans = true;
    this.student = await this.kretaService.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"));
    this.focused = 0;
    for (let i = 0; i < this.student.Absences.length; i++) {
      this.absences.push(this.student.Absences[i]);

      this.totalAbsences += this.student.Absences[i].Type == 'Delay' ? this.student.Absences[i].DelayTimeMinutes : 45;

      switch (this.student.Absences[i].JustificationStateName) {
        case "Igazolt mulasztás":
          if (!this.justifiedExistingDates.includes(this.student.Absences[i].LessonStartTime.substring(0, 10))) {
            this.justifiedExistingDates.push(this.student.Absences[i].LessonStartTime.substring(0, 10));
          }
          break;

        case "Igazolandó mulasztás":
          if (!this.beJustifiedExistingDates.includes(this.student.Absences[i].LessonStartTime.substring(0, 10))) {
            this.beJustifiedExistingDates.push(this.student.Absences[i].LessonStartTime.substring(0, 10));
          }
          break;

        default:
          if (!this.unJustifiedExistingDates.includes(this.student.Absences[i].LessonStartTime.substring(0, 10))) {
            this.unJustifiedExistingDates.push(this.student.Absences[i].LessonStartTime.substring(0, 10));
          }
          break;
      }
    }
    this.beJustifiedExistingDates.reverse();
    this.unJustifiedExistingDates.reverse();
    this.justifiedExistingDates.reverse();
    this.sans = false;
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
    let cssa = this.color.getPopUpClass();
    let seen = absence.SeenByTutelaryUTC == null ? "nem" : absence.SeenByTutelaryUTC;
    this.presentAlert(
      absence.TypeName + " (" + absence.Subject + ")",
      absence.Teacher,
      "<ul>" +
      "<li>Dátum: " + absence.LessonStartTime.substring(0, 10) + "</li>" +
      "<li>Állapot: " + absence.JustificationStateName + "</li>" +
      "<li>Mulasztás módja: " + absence.ModeName + "</li>" +
      "<li>Szülő látta: " + seen + "</li></ul>",
      cssa
    );
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
