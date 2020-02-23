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
import { DataLoaderService } from '../_services/data-loader.service';
import { CollapsibleStudent } from '../_models/student';
import { Observable, Subscription } from 'rxjs';
import { AppService } from '../_services/app.service';

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
  public showProgressBar: boolean;
  public formattedStudent: Observable<CollapsibleStudent[]>;

  private studentSubscription: Subscription;

  @Input() data: string;

  //for the selector
  customPopoverOptions: any = {
    subHeader: 'Megjelenítés',
    cssClass: this.color.getPopUpClass(),
  };


  constructor(
    public dataLoader: DataLoaderService,
    public fDate: FormattedDateService,
    public Students: Student,
    public kreta: KretaService,
    public student: Student,
    public app: AppService,

    private navRouter: Router,
    private storage: Storage,
    private color: ColorService,
    private firebase: FirebaseX,
    private prompt: PromptService,
  ) {
    this.allData = [];
    this.thisMonth = new Date().getMonth();
    this.monthsName = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
    this.sans = true;
    this.showProgressBar = true;
  }

  public async ngOnInit() {
    let currentMonth = new Date().getMonth() + 1;
    //the month to show (on init it is the current month)
    this.showingMonth = currentMonth;

    this.formattedStudent = new Observable<CollapsibleStudent[]>((observer) => {
      this.studentSubscription = this.dataLoader.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          //there is no data in the storage, showing skeleton text until the server responds
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data until the server responds, disabling skeleton text
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

    this.firebase.setScreenName('home');
  }

  ionViewWillLeave() {
    this.studentSubscription.unsubscribe();
  }

  async doRefresh(event: any) {
    console.log("begin operation");
    this.showProgressBar = true;
    await this.dataLoader.updateStudent();
    event.target.complete();
  }

  public formatStudent(student: Student): CollapsibleStudent[] {
    let allDataByMonths = [];
    let allEvaluations = student.Evaluations;
    let allAbsences = student.Absences;
    let allNotes = student.Notes;
    let allData: Array<any> = [];

    for (let i = 0; i < allEvaluations.length; i++) {
      let element = allEvaluations[i];
      allData.push(element);
    }

    for (let i = 0; i < allAbsences.length; i++) {
      let element = allAbsences[i];
      allData.push(element);
    }

    for (let i = 0; i < allNotes.length; i++) {
      let element = allNotes[i];
      allData.push(element);
    }

    let months: number[] = [];

    allData.forEach(element => {
      let creatingMonth = new Date(element.CreatingTime).getMonth();
      if (!months.includes(creatingMonth)) {
        months.push(creatingMonth);
      }
    });

    let i = 0;
    months.forEach(month => {
      let monthlyData: any[] = [];
      allData.forEach(item => {
        if (new Date(item.CreatingTime).getMonth() == month) {
          monthlyData.push(item);
        }
      });

      monthlyData.sort((a, b) => new Date(b.CreatingTime).valueOf() - new Date(a.CreatingTime).valueOf());

      allDataByMonths.push({
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

    allDataByMonths.sort((a, b) => b.firstEntryCreatingTime - a.firstEntryCreatingTime);
    for (let i = 0; i < allDataByMonths.length; i++) {
      if (i == 0) {
        allDataByMonths[i].showAll = true;
      } else {
        allDataByMonths[i].showAll = false;
      }
    }
    return allDataByMonths;
  }

  showOrHide(type: string, monthlyGrades: CollapsibleStudent) {
    if (type == "evaluations") {
      monthlyGrades.showEvaluations = monthlyGrades.showEvaluations ? false : true;
    } else if (type == "absences") {
      monthlyGrades.showAbsences = monthlyGrades.showAbsences ? false : true;
    } else if (type == "notes") {
      monthlyGrades.showNotes = monthlyGrades.showNotes ? false : true;
    }
  }

  showOrHideMonth(monthlyGrades: CollapsibleStudent) {
    monthlyGrades.showAll = monthlyGrades.showAll == true ? false : true;
  }

  getMoreData(item: any) {
    let css = this.color.getPopUpClass();
    if (item.AbsenceId != null) {
      this.prompt.absenceAlert(item);
    } else if (item.NoteId != null) {
      this.prompt.noteAlert(item);
    } else if (item.EvaluationId != null) {
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