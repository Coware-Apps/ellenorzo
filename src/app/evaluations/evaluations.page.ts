import { Component, OnInit } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { Student, evaluation } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { ColorService } from '../_services/color.service';
import { AverageGraphsPage } from '../average-graphs/average-graphs.page';
import { Storage } from '@ionic/storage';
import { AlertController, ModalController } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from '../_services/data.service';
import { Router } from '@angular/router';

interface selectOption {
  name: string;
  id: string;
  show: boolean;
  empty: boolean;
}
@Component({
  selector: 'app-evaluations',
  templateUrl: './evaluations.page.html',
  styleUrls: ['./evaluations.page.scss'],
})
export class EvaluationsPage implements OnInit {

  //for the selector
  customPopoverOptions: any = {
    subHeader: 'Rendezés és megjelenítés',
    cssClass: this.color.getPopUpClass(),
  };

  public dates: string[];
  public subjects: string[];
  public evaluations: evaluation[];
  public sans: boolean;
  public fiveColor: string;
  public fourColor: string;
  public threeColor: string;
  public twoColor: string;
  public oneColor: string;
  public noneColor: string;
  public selected: string;
  public groups: string;
  public selectOptions: selectOption[] = [{
    name: "Tantárgyanként",
    id: "bySubject",
    show: true,
    empty: false,
  },
  {
    name: "Dátum alapján",
    id: "byDate",
    show: true,
    empty: false,
  },
  {
    name: "Félévi értékelések",
    id: "halfYear",
    show: true,
    empty: false,
  },
  {
    name: "Év végi értékelések",
    id: "endYear",
    show: true,
    empty: false,
  },
  {
    name: "Egyéb értékelések",
    id: "other",
    show: true,
    empty: false,
  }]

  private student: Student;

  constructor(
    private kreta: KretaService,
    public fDate: FormattedDateService,

    private color: ColorService,
    private storage: Storage,
    private alertCtrl: AlertController,
    private data: DataService,
    private navRouter: Router,
  ) {
    this.dates = [];
    this.subjects = [];
    this.selected = "bySubject";
  }

  async ngOnInit() {
    this.sans = true;
    this.evaluations = (this.student = await this.kreta.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"))).Evaluations;
    this.evaluations.forEach(evaluation => {
      if (!this.dates.includes(evaluation.Date)) {
        this.dates.push(evaluation.Date);
      }
      if (!this.subjects.includes(evaluation.Subject)) {
        this.subjects.push(evaluation.Subject);
      }
    });
    this.dates.sort((a, b) => new Date(a).valueOf() - new Date(b).valueOf()).reverse();
    this.sans = false;
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

  getMoreData(evaluation: evaluation) {
    if (evaluation.Form == "Mark") {
      let date = new Date(evaluation.Date);
      let formattedDate = this.fDate.formatDate(date);
      let time = date.getHours() + ":" + date.getMinutes();
      this.presentAlert(evaluation.NumberValue + this.themeIf(evaluation.Theme), evaluation.Weight,
        "<ul>" +
        "<li>Dátum: " + formattedDate + "</li>" +
        "<li>Létrehozva: " + time + "</li>" +
        "<li>Típus: " + evaluation.Mode + "</li>" +
        "<li>Leírás: " + evaluation.FormName + "</li></ul>", this.color.getPopUpClass())
    } else {
      //Form == 'Percent' || Form == 'Text'
      this.presentAlert(
        evaluation.Subject,
        evaluation.Teacher,
        "<ul>" +
        "<li>Típus: " + evaluation.FormName + "</li>" +
        "<li>Létrehozva: " + evaluation.CreatingTime.substring(0, 10) + "</li>" +
        "<li>Dátum: " + evaluation.Date.substring(0, 10) + "</li>" +
        "<li>Értékelés módja: " + evaluation.Mode + "</li>" +
        "</ul>" +
        (evaluation.Form == 'Text' ? "Tartalom: " + evaluation.Value : ''),
        this.color.getPopUpClass());
    }
  }

  async selectorChanged(event) {
      this.selectOptions.forEach(option => {
        if (option.id == event.detail.value) {
          this.selected = option.id;
        }
      });
  }

  getEvaluations(dateOrSubject: string, byDate: boolean = true, HalfYear: boolean = false, EndYear: boolean = false, other: boolean = false, selectOption: number = 0): evaluation[] {
    //returns the evaluations that have dateOrSubject Date (byDate == true) or dateOrSubject Subject (ByDate == false) or by types
    let returnVal: evaluation[] = [];
    this.evaluations.forEach(evaluation => {
      if (evaluation.Date == dateOrSubject && byDate) {
        returnVal.push(evaluation);
      } else if (evaluation.Subject == dateOrSubject && !byDate) {
        returnVal.push(evaluation);
      }

      if (HalfYear && evaluation.Type == 'HalfYear') {
        returnVal.push(evaluation); 
      }
      if (EndYear && evaluation.Type == 'EndYear') {
        returnVal.push(evaluation); 
      }
      if (other && evaluation.Type != 'HalfYear' && evaluation.Type != 'EndYear' && evaluation.Type != 'MidYear') {  
        returnVal.push(evaluation);
      }
    });

    if (returnVal.length > 0) {
      this.selectOptions[selectOption].empty = false;
    } else {
      this.selectOptions[selectOption].empty = true;
    }
    return returnVal;
  }

  doMidYearEvaluationsExist(dateOrSubject: string, byDate: boolean = true): boolean {
    //returns true if evaluations that have dateOrSubject Date (byDate == true) or dateOrSubject Subject (ByDate == false) and are MidYear type exist
    let returnVal: boolean = false;
    this.evaluations.forEach(evaluation => {
      if (evaluation.Date == dateOrSubject && evaluation.Type == 'MidYear' && byDate) {
        returnVal = true;
      } else if (evaluation.Subject == dateOrSubject && evaluation.Type == 'MidYear' && !byDate) {
        returnVal = true;
      }
    });
    return returnVal;
  }

  themeIf(theme: string) {
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
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

  //could be a cool feature, but it doesn't work
  getIconColor(subject: string) {
    this.student.SubjectAverages.forEach(subjectAvg => {
      if (subjectAvg.Subject == subject) {
        return this.getShadowColor(subjectAvg.ClassValue, "Mark");
      }
    });
  }

  async showModal(subject: string) {
    let student = this.student;
    let classValue: number;
    this.student.SubjectAverages.forEach(subjectAvg => {
      if (subjectAvg.Subject == subject) {
        classValue = subjectAvg.ClassValue;
      }
    });

    this.data.setData("subject", subject);
    this.data.setData("student", this.student);
    this.data.setData("classValue", classValue);
    this.navRouter.navigateByUrl("/average-graphs?fromRoute=evaluations");
  }

}
