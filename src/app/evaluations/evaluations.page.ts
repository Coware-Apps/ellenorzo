import { Component, OnInit, getDebugNode, ViewChild } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { Student, evaluation } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { ColorService } from '../_services/color.service';
import { AverageGraphsPage } from '../average-graphs/average-graphs.page';
import { Storage } from '@ionic/storage';
import { AlertController, ModalController, IonSelect } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from '../_services/data.service';
import { Router } from '@angular/router';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { Observable, Subscription, Subject, BehaviorSubject } from 'rxjs';
import { UniversalSortedData, CollapsifyService } from '../_services/collapsify.service';
import { AppService } from '../_services/app.service';
import { UserManagerService } from '../_services/user-manager.service';
import { TranslateService } from '@ngx-translate/core';

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

  @ViewChild('categorySelector', null) categorySelector: IonSelect;

  //for the selector
  customAlertOptions: any = {
    subHeader: this.translator.instant('pages.evaluations.categorySelectorTitle'),
    cssClass: this.color.getPopUpClass(),
  };

  public dates: string[];
  public subjects: string[];
  public evaluations: Observable<evaluation[]>;
  public loadedEvaluations: evaluation[];
  public sans: boolean;
  public showProgressBar: boolean;
  public selected: string;
  public groups: string;
  public selectOptions: SelectOption[] = [{
    name: this.translator.instant(`pages.evaluations.categorySelector.bySubject`),
    id: "bySubject",
    show: true,
    empty: false,
    data: [],
  },
  {
    name: this.translator.instant(`pages.evaluations.categorySelector.byDate`),
    id: "byDate",
    show: true,
    empty: false,
    data: [],
  },
  {
    name: this.translator.instant(`pages.evaluations.categorySelector.halfYear`),
    id: "halfYear",
    show: true,
    empty: false,
    data: [],
  },
  {
    name: this.translator.instant(`pages.evaluations.categorySelector.endYear`),
    id: "endYear",
    show: true,
    empty: false,
    data: [],
  },
  {
    name: this.translator.instant(`pages.evaluations.categorySelector.other`),
    id: "other",
    show: true,
    empty: false,
    data: [],
  }]
  public selectOptionsWithData: Subject<SelectOption[]>

  private student: Student;
  private studentSubscription: Subscription;
  private reloaderSubscription: Subscription;

  constructor(
    public fDate: FormattedDateService,
    public app: AppService,

    private color: ColorService,
    private data: DataService,
    private navRouter: Router,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private userManager: UserManagerService,
    private collapsify: CollapsifyService,
    private translator: TranslateService,
  ) {
    this.dates = [];
    this.subjects = [];
    this.selected = "bySubject";
    this.sans = true;
    this.showProgressBar = true;
  }

  ngOnInit() {
    this.firebase.setScreenName('evaluations');
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
    this.selectOptionsWithData = new Subject<SelectOption[]>();
    this.studentSubscription = this.userManager.currentUser.student.subscribe(subscriptionData => {
      if (subscriptionData.type == "skeleton") {
        this.sans = true;
        this.showProgressBar = true;
        //there is no data in the storage, showing skeleton text until the server responds
      } else if (subscriptionData.type == "placeholder") {
        //there is data in the storage, showing that data until the server responds, disabling skeleton text
        this.loadedEvaluations = subscriptionData.data.Evaluations;
        let evaluations = this.formatEvaluations(subscriptionData.data.Evaluations);
        this.selectOptionsWithData.next(evaluations);
        this.sans = false;
        this.showProgressBar = true;
      } else {
        //the server has now responded, disabling progress bar and skeleton text if it's still there
        this.loadedEvaluations = subscriptionData.data.Evaluations;
        //only storing the entire student when the site has completely loaded, because we only need it for when the user clicks the average-graphs button
        this.student = subscriptionData.data;
        this.selectOptionsWithData.next(this.formatEvaluations(subscriptionData.data.Evaluations));
        this.showProgressBar = false;
        this.sans = false;
      }
    });
    await this.userManager.currentUser.initializeStudent();
  }

  ionViewWillLeave() {
    this.studentSubscription.unsubscribe();
    this.reloaderSubscription.unsubscribe();
  }

  openCategorySelector(event: UIEvent) {
    this.categorySelector.interface = 'popover';
    this.categorySelector.open(event);
  }

  async doRefresh(event: any) {
    this.showProgressBar = true;
    await this.userManager.currentUser.updateStudent();
    event.target.complete();
  }

  formatEvaluations(evaluations: evaluation[]): SelectOption[] {
    this.selectOptions.forEach(option => {
      switch (option.id) {
        case 'bySubject':
          option.data = this.collapsify.collapsifyByNames(this.getMidYearEvaluations(evaluations), 'Subject', 'CreatingTime');
          option.data.sort((x, y) => x.index - y.index);
          let optionData = option.data;
          optionData.forEach(collapsibleGroup => {
            if (collapsibleGroup.index != 0 && collapsibleGroup.index != 1) {
              collapsibleGroup.showAll = false;
            };
          });
          option.data = optionData;
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
          return this.color.cardColors.fiveColor;
        case 4:
          return this.color.cardColors.fourColor;
        case 3:
          return this.color.cardColors.threeColor;
        case 2:
          return this.color.cardColors.twoColor;
        case 1:
          return this.color.cardColors.oneColor;

        default:
          return this.color.cardColors.noneColor
      }
    } else if (form == 'Percent') {
      if (numberValue < 50) {
        return this.color.cardColors.oneColor;
      } else if (numberValue < 60 && numberValue >= 50) {
        return this.color.cardColors.twoColor;
      } else if (numberValue < 70 && numberValue >= 60) {
        return this.color.cardColors.threeColor;
      } else if (numberValue < 80 && numberValue >= 70) {
        return this.color.cardColors.fourColor;
      } else if (numberValue >= 80) {
        return this.color.cardColors.fiveColor;
      }
    } else if (form == 'Diligence' || form == 'Deportment') {
      if (Value == 'Példás') {
        return this.color.cardColors.fiveColor;
      } else if (Value == 'Jó') {
        return this.color.cardColors.fourColor;
      } else if (Value == 'Változó') {
        return this.color.cardColors.threeColor;
      } else if (Value == 'Hanyag') {
        return this.color.cardColors.oneColor;
      }
    } else {
      return this.color.cardColors.noneColor;
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
    this.sans = true;
    this.showProgressBar = true;
    this.navRouter.navigateByUrl("/average-graphs?fromRoute=evaluations");
  }

}
