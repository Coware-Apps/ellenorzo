import { Student, evaluation, Absence, Note } from '../_models/student';
import { Token } from '../_models/token';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';
import { Component, Input } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { FormattedDateService } from '../_services/formatted-date.service';
import { ColorService } from '../_services/color.service';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {
  //i would use list here but fuck me, this is typescript
  public monthlyEvaluations: Array<evaluation>;
  public tokens: Token;
  public access_token: string;
  public monthlyAverage: any;
  public hasItLoaded: boolean = false
  public sans: boolean = true;
  public thisMonth: number;
  public fiveColor: string;
  public fourColor: string;
  public threeColor: string;
  public twoColor: string;
  public oneColor: string;
  public noneColor: string;
  public monthsName: string[];
  public showingMonth: number;
  public allData: Array<any>;


  public showEvaluations: boolean;
  public showAbsences: boolean;
  public showNotes: boolean;

  @Input() data: string;

  //for the selector
  customPopoverOptions: any = {
    subHeader: 'Megjelenítés',
    cssClass: this.color.getPopUpClass(),
  };


  constructor(
    private navRouter: Router,
    private dataService: DataService,
    private storage: Storage,
    private color: ColorService,
    private alertCtrl: AlertController,

    public fDate: FormattedDateService,
    public Students: Student,
    public kreta: KretaService,
    public student: Student,
  ) {
    this.allData = [];
    this.thisMonth = new Date().getMonth();
    this.monthsName = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
    this.showEvaluations = true;
    this.showAbsences = true;
    this.showNotes = true;
  }

  showOrHide(type: string) {
    if (type == "evaluations") {
      this.showEvaluations = this.showEvaluations ? false : true;

    } else if (type == "absences") {
      this.showAbsences = this.showAbsences ? false : true;;

    } else if (type == "notes") {
      this.showNotes = this.showNotes ? false : true;;

    }
  }

  getMoreData(item: any) {
    let css = this.color.getPopUpClass();
    if (item.AbsenceId != null) {
      let seen = item.SeenByTutelaryUTC == null ? "nem" : item.SeenByTutelaryUTC;
      this.presentAlert(
        item.TypeName + " (" + item.Subject + ")",
        item.Teacher,
        "<ul>" +
        "<li>Dátum: " + item.LessonStartTime.substring(0, 10) + "</li>" +
        "<li>Állapot: " + item.JustificationStateName + "</li>" +
        "<li>Mulasztás módja: " + item.ModeName + "</li>" +
        "<li>Szülő látta: " + seen + "</li></ul>",
        css
      );
    }
    if (item.NoteId != null) {
      let seen = item.SeenByTutelaryUTC == null ? "nem" : item.SeenByTutelaryUTC.substring(0, 10);

      this.presentAlert(
        item.Title,
        item.Teacher,
        "<ul>" +
        "<li>Típus: " + item.Type + "</li>" +
        "<li>Létrehozva: " + item.CreatingTime.substring(0, 10) + "</li>" +
        "<li>Gondviselő látta: " + seen + "</li></ul>" +
        "Tartalom: " + item.Content,
        css
      );
    }
  }

  getShadowColor(numberValue: number, form: string) {
    if (form == "Mark") {
      switch (numberValue) {
        case 5:
        return this.fiveColor;
        case 4:
        return this.fourColor;
        case 3:
        return this.threeColor;
        case 2:
        return this.twoColor;
        case 1:
        return this.oneColor;

        default:
          return this.noneColor
      }
    } else if (form == 'Percent') {
      if (numberValue < 50) {
        return this.oneColor;
      } else if (numberValue < 60 && numberValue >= 50) {
        return this.twoColor;
      } else if (numberValue < 70 && numberValue >= 60) {
        return this.threeColor;
      } else if (numberValue < 80 && numberValue >= 70) {
        return this.fourColor;
      } else if (numberValue >= 80) {
        return this.fiveColor;
      }
    } else {
      return this.noneColor
    }
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

  themeIf(theme: string) {
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
    }
  }

  public async graphOrAlert(subject: string, item: evaluation) {
    if (item == null) {
      //Form == 'Mark'
      this.monthlyEvaluations = [];

      for (let i = 0; i < this.allData.length; i++) {
        if (this.allData[i].EvaluationId != null && this.allData[i].Subject == subject && this.allData[i].Form == "Mark") {
          this.monthlyEvaluations.push(this.allData[i]);
        }
      }
      this.dataService.setData('0', this.monthlyEvaluations);
      this.navRouter.navigateByUrl('/monthly-average?id=0');
    } else {
      //Form == 'Percent' || Form == 'Text'
      this.presentAlert(
        item.Subject,
        item.Teacher,
        "<ul>" +
        "<li>Típus: " + item.FormName + "</li>" +
        "<li>Létrehozva: " + item.CreatingTime.substring(0, 10) + "</li>" +
        "<li>Dátum: " + item.Date.substring(0, 10) + "</li>" +
        "<li>Értékelés módja: " + item.Mode + "</li>" +
        "</ul>" +
        (item.Form == 'Text' ? "Tartalom: " + item.Value : ''),
        this.color.getPopUpClass());
    }
  }

  public async ngOnInit() {
    this.sans = true;

    let currentMonth = new Date().getMonth() + 1;
    //the month to show (on init it is the current month)
    this.showingMonth = currentMonth;

    let Student = (await this.kreta.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today")));

    let allEvaluations = Student.Evaluations;
    let allAbsences = Student.Absences;
    let allNotes = Student.Notes;

    for (let i = 0; i < allEvaluations.length; i++) {
      const element = allEvaluations[i];
      if (new Date(element.CreatingTime).getMonth() + 1 == this.showingMonth) {
        this.allData.push(element);
      }
    }

    for (let i = 0; i < allAbsences.length; i++) {
      const element = allAbsences[i];
      if (new Date(element.LessonStartTime).getMonth() + 1 == this.showingMonth) {
        this.allData.push(element);
      }
    }

    for (let i = 0; i < allNotes.length; i++) {
      const element = allNotes[i];
      if (new Date(element.CreatingTime).getMonth() + 1 == this.showingMonth) {
        this.allData.push(element);
      }
    }

    this.allData = this.allData.sort((a, b) => a.CreatingTime.split('-')[2].split('T')[0] - b.CreatingTime.split('-')[2].split('T')[0]).reverse();


    this.sans = false;
    this.hasItLoaded = true;
  }

  async ionViewDidEnter() {
    let a;

    let color = (a = await this.storage.get('cardColor')) != null ? a : "&&&&&";

    this.fiveColor = color.split('&')[0] != "" ? color.split('&')[0] : "#00CC66";
    this.fourColor = color.split('&')[1] != "" ? color.split('&')[1] : "#FFFF66";
    this.threeColor = color.split('&')[2] != "" ? color.split('&')[2] : "#FF9933";
    this.twoColor = color.split('&')[3] != "" ? color.split('&')[3] : "#663300";
    this.oneColor = color.split('&')[4] != "" ? color.split('&')[4] : "#FF0000";
    this.noneColor = color.split('&')[5] != "" ? color.split('&')[5] : "#9933FF";
  }

  async showPicker() {
    this.navRouter.navigateByUrl('/color-picker?from=home');
  }

}