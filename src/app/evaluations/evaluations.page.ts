import { Component, OnInit, getDebugNode } from '@angular/core';
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
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { DataLoaderService } from '../_services/data-loader.service';
import { Observable, Subscription } from 'rxjs';
import { UniversalSortedData, CollapsifyService } from '../_services/collapsify.service';

interface SelectOption {
  name: string;
  id: string;
  show: boolean;
  empty: boolean;
  data: evaluation[] | UniversalSortedData[];
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
  public evaluations: Observable<evaluation[]>;
  public loadedEvaluations: evaluation[];
  public sans: boolean;
  public showProgressBar: boolean;
  public fiveColor: string;
  public fourColor: string;
  public threeColor: string;
  public twoColor: string;
  public oneColor: string;
  public noneColor: string;
  public selected: string;
  public groups: string;
  public selectOptions: SelectOption[] = [{
    name: "Tantárgyanként",
    id: "bySubject",
    show: true,
    empty: false,
    data: [],
  },
  {
    name: "Dátum alapján",
    id: "byDate",
    show: true,
    empty: false,
    data: [],
  },
  {
    name: "Félévi értékelések",
    id: "halfYear",
    show: true,
    empty: false,
    data: [],
  },
  {
    name: "Év végi értékelések",
    id: "endYear",
    show: true,
    empty: false,
    data: [],
  },
  {
    name: "Egyéb értékelések",
    id: "other",
    show: true,
    empty: false,
    data: [],
  }]
  public selectOptionsWithData: Observable<SelectOption[]>

  private student: Student;
  private studentSubscription: Subscription;

  constructor(
    public fDate: FormattedDateService,

    private color: ColorService,
    private storage: Storage,
    private data: DataService,
    private navRouter: Router,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private dataLoader: DataLoaderService,
    private collapsify: CollapsifyService,
  ) {
    this.dates = [];
    this.subjects = [];
    this.selected = "bySubject";
    this.sans = true;
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.selectOptionsWithData = new Observable<SelectOption[]>((observer) => {
      this.studentSubscription = this.dataLoader.student.subscribe(subscriptionData => {
        if (subscriptionData.type == "skeleton") {
          //there is no data in the storage, showing skeleton text until the server responds
        } else if (subscriptionData.type == "placeholder") {
          //there is data in the storage, showing that data until the server responds, disabling skeleton text
          this.loadedEvaluations = subscriptionData.data.Evaluations;
          observer.next(this.formatEvaluations(subscriptionData.data.Evaluations));
          this.sans = false;
        } else {
          //the server has now responded, disabling progress bar and skeleton text if it's still there
          this.loadedEvaluations = subscriptionData.data.Evaluations;
          //only storing the entire student when the site has completely loaded, because we only need it for when the user clicks the average-graphs button
          this.student = subscriptionData.data;
          observer.next(this.formatEvaluations(subscriptionData.data.Evaluations));
          this.showProgressBar = false;
          this.sans = false;
        }
      });
      this.dataLoader.initializeStudent();
    });

    this.firebase.setScreenName('evaluations');
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

  formatEvaluations(evaluations: evaluation[]): SelectOption[] {
    this.selectOptions.forEach(option => {
      switch (option.id) {
        case 'bySubject':
          option.data = this.collapsify.collapsifyByNames(this.getMidYearEvaluations(evaluations), 'Subject', 'CreatingTime');
          break;
        case 'byDate':
          option.data = this.collapsify.collapsifyByDates(this.getMidYearEvaluations(evaluations), 'CreatingTime');
          break;
        case 'halfYear':
          option.data = this.getHalfYearEvaluations(evaluations);
          break;
        case 'endYear':
          option.data = this.getEndYearEvaluations(evaluations);
          break;
        case 'other':
          option.data = this.getOtherEvaluations(evaluations);
          break;
      }
    });

    return this.selectOptions;
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

  getMoreData(evaluation: evaluation) {
    this.prompt.evaluationAlert(evaluation);
  }

  async selectorChanged(event) {
    this.selectOptions.forEach(option => {
      if (option.id == event.detail.value) {
        this.selected = option.id;
      }
    });
  }

  //#region Evaluation Filters
  getMidYearEvaluations(evaluations: evaluation[]): evaluation[] {
    let returnVal: evaluation[] = [];
    evaluations.forEach(evaluation => {
      if (evaluation.Type == 'MidYear') {
        returnVal.push(evaluation);
      }
    });
    return returnVal;
  }
  getHalfYearEvaluations(evaluations: evaluation[]): evaluation[] {
    let returnVal: evaluation[] = [];
    evaluations.forEach(evaluation => {
      if (evaluation.Type == 'HalfYear') {
        returnVal.push(evaluation);
      }
    });
    return returnVal;
  }
  getEndYearEvaluations(evaluations: evaluation[]): evaluation[] {
    let returnVal: evaluation[] = [];
    evaluations.forEach(evaluation => {
      if (evaluation.Type == 'EndYear') {
        returnVal.push(evaluation);
      }
    });
    return returnVal;
  }
  getOtherEvaluations(evaluations: evaluation[]): evaluation[] {
    let returnVal: evaluation[] = [];
    evaluations.forEach(evaluation => {
      if (evaluation.Type != 'EndYear' && evaluation.Type != 'MidYear' && evaluation.Type != 'HalfYear') {
        returnVal.push(evaluation);
      }
    });
    return returnVal;
  }
  //#endregion

  themeIf(theme: string) {
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
    }
  }

  getShadowColor(numberValue: number, form: string, Value?: string) {
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
    } else if (form == 'Diligence' || form == 'Deportment') {
      if (Value == 'Példás') {
        return this.fiveColor;
      } else if (Value == 'Jó') {
        return this.fourColor;
      } else if (Value == 'Változó') {
        return this.threeColor;
      } else if (Value == 'Hanyag') {
        return this.oneColor;
      }
    } else {
      return this.noneColor;
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
