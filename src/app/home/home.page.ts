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
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';

interface MonthlyGrades {
  index: number;
  header: string;
  data: any[];
  firstEntryCreatingTime: number;
  showEvaluations: boolean;
  showAbsences: boolean;
  showNotes: boolean;
  showAll: boolean;
}

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
  public allDataByMonths: Array<MonthlyGrades>;

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
    private firebase: FirebaseX,
    private prompt: PromptService,

    public fDate: FormattedDateService,
    public Students: Student,
    public kreta: KretaService,
    public student: Student,
  ) {
    this.allData = [];
    this.allDataByMonths = [];
    this.thisMonth = new Date().getMonth();
    this.monthsName = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
    this.showEvaluations = true;
    this.showAbsences = true;
    this.showNotes = true;
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
      this.allData.push(element);
    }

    for (let i = 0; i < allAbsences.length; i++) {
      const element = allAbsences[i];
      this.allData.push(element);
    }

    for (let i = 0; i < allNotes.length; i++) {
      const element = allNotes[i];
      this.allData.push(element);
    }

    let months: number[] = [];

    this.allData.forEach(element => {
      let creatingMonth = new Date(element.CreatingTime).getMonth();
      if (!months.includes(creatingMonth)) {
        months.push(creatingMonth);
      }
    });

    let i = 0;
    months.forEach(month => {
      let monthlyData: any[] = [];
      this.allData.forEach(item => {
        if (new Date(item.CreatingTime).getMonth() == month) {
          monthlyData.push(item);
        }
      });

      monthlyData.sort((a, b) => new Date(b.CreatingTime).valueOf() - new Date(a.CreatingTime).valueOf());

      this.allDataByMonths.push({
        index: i,
        header: this.monthsName[month],
        data: monthlyData,
        firstEntryCreatingTime: new Date(monthlyData[monthlyData.length - 1].CreatingTime).valueOf(),
        showEvaluations: true,
        showAbsences: true,
        showNotes: true,
        showAll: true,
      });
      i++;
    });

    this.allDataByMonths.sort((a, b) => b.firstEntryCreatingTime - a.firstEntryCreatingTime);

    console.log('months', months);
    console.log('allDataByMonths', this.allDataByMonths);
    //sort the data


    this.sans = false;
    this.hasItLoaded = true;

    this.firebase.setScreenName('home');
  }


  showOrHide(type: string, monthlyGrades: MonthlyGrades) {
    if (type == "evaluations") {
      monthlyGrades.showEvaluations = monthlyGrades.showEvaluations ? false : true;
    } else if (type == "absences") {
      monthlyGrades.showAbsences = monthlyGrades.showAbsences ? false : true;
    } else if (type == "notes") {
      monthlyGrades.showNotes = monthlyGrades.showNotes ? false : true;
    }
  }

  showOrHideMonth(monthlyGrades: MonthlyGrades) {
    monthlyGrades.showAll = monthlyGrades.showAll == true ? false : true;
  }

  getMoreData(item: any) {
    let css = this.color.getPopUpClass();
    if (item.AbsenceId != null) {
      this.prompt.absenceAlert(item);
    } else if (item.NoteId != null) {
      this.prompt.noteAlert(item);
    } else if(item.EvaluationId != null) {
      this.prompt.evaluationAlert(item);
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

  themeIf(theme: string) {
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
    }
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