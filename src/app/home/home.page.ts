import { Student, evaluation } from '../_models/student';
import { Token } from '../_models/token';
import { Router } from '@angular/router';
import { Component, Input } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { FormattedDateService } from '../_services/formatted-date.service';
import { ColorService } from '../_services/color.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { CollapsibleStudent } from '../_models/student';
import { Observable, Subscription } from 'rxjs';
import { AppService } from '../_services/app.service';
import { UserManagerService } from '../_services/user-manager.service';
import { MenuController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { CollapsibleCombined } from '../_models/user';
import { Test } from '../_models/test';
import { Message } from '../_models/message';
import { DataService } from '../_services/data.service';

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
  public monthsName: string[];
  public showingMonth: number;
  public allData: Array<any>;
  public showProgressBar: boolean;
  public formattedCombined: Observable<CollapsibleCombined[]>;
  public unsubOnLeave = true;
  public isEmpty: boolean = false;

  private combinedSubscription: Subscription;
  private reloaderSubscription: Subscription;

  @Input() data: string;

  //for the selector
  customPopoverOptions: any = {
    subHeader: 'Megjelenítés',
    cssClass: this.color.getPopUpClass(),
  };


  constructor(
    public userManager: UserManagerService,
    public fDate: FormattedDateService,
    public Students: Student,
    public kreta: KretaService,
    public student: Student,
    public app: AppService,

    private navRouter: Router,
    private color: ColorService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private menuCtrl: MenuController,
    private translator: TranslateService,
    private dataService: DataService,
    private router: Router,
  ) {
    this.allData = [];
    this.thisMonth = new Date().getMonth();
    this.monthsName = this.translator.instant("dates.monthNames");
    this.sans = true;
    this.showProgressBar = true;
  }

  public async ngOnInit() {
    this.menuCtrl.enable(true);
    this.subscribeToData();
    this.subscribeToReloader();
    await this.loadData();
    this.firebase.setScreenName('home');
  }
  ionViewDidEnter() {
    //optionally refreshing data
    if (this.dataService.getData('refreshHome') == true) {
      this.ngOnInit();
      this.dataService.setData('refreshHome', false);
    }
  }
  private async loadData() {
    let currentMonth = new Date().getMonth() + 1;
    //the month to show (on init it is the current month)
    this.showingMonth = currentMonth;
    let requestsToDo = [];
    this.app.homeRequests.forEach(r => {
      if (r.show == true) {
        requestsToDo.push(r.requestName);
      }
    });
    this.userManager.currentUser.initializeCombined(requestsToDo);
  }
  private subscribeToData() {
    if (this.combinedSubscription == null || this.combinedSubscription.closed) {
      this.formattedCombined = new Observable<CollapsibleCombined[]>((observer) => {
        this.combinedSubscription = this.userManager.currentUser.combined.subscribe(subscriptionData => {
          if (subscriptionData.type == "skeleton") {
            this.sans = true;
            this.showProgressBar = true;
            //there is no data in the storage, showing skeleton text until the server responds
          } else if (subscriptionData.type == "placeholder") {
            //there is data in the storage, showing that data until the server responds, disabling skeleton text
            observer.next(this.formatCombined(
              subscriptionData.Student,
              subscriptionData.Tests,
              subscriptionData.MessageList,
              subscriptionData.Events
            ));
            this.sans = false;
            this.showProgressBar = true;
          } else {
            //the server has now responded, disabling progress bar and skeleton text if it's still there
            observer.next(this.formatCombined(
              subscriptionData.Student,
              subscriptionData.Tests,
              subscriptionData.MessageList,
              subscriptionData.Events
            ));
            this.showProgressBar = false;
            this.sans = false;
          }
        });
      });
    }
  }
  private subscribeToReloader() {
    if (this.reloaderSubscription == null || this.reloaderSubscription.closed) {
      this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
        if (value == 'reload') {
          this.sans = true;
          this.showProgressBar = true;
          this.combinedSubscription.unsubscribe();
          this.subscribeToData();
          this.loadData();
        }
      });
    }
  }
  ionViewWillLeave() {
    if (this.unsubOnLeave) {
      if (this.combinedSubscription != null || !this.combinedSubscription.closed) {
        this.combinedSubscription.unsubscribe();
      }
      if (this.reloaderSubscription != null || !this.reloaderSubscription.closed) {
        this.reloaderSubscription.unsubscribe();
      }
    }
    this.unsubOnLeave = true;
  }
  async doRefresh(event: any) {
    this.subscribeToData();
    this.showProgressBar = true;
    let requestsToDo = [];
    this.app.homeRequests.forEach(r => {
      if (r.show == true) {
        requestsToDo.push(r.requestName);
      }
    });
    await this.userManager.currentUser.updateCombined(requestsToDo);
    event.target.complete();
  }
  private formatCombined(student: Student, tests: Test[], messages: Message[], events: Event[]): CollapsibleCombined[] {
    let allDataByMonths = [];
    let allData = [];
    if (student != null) {
      if (student.Evaluations != null) {
        allData = allData.concat(student.Evaluations);
      }
      if (student.Absences != null) {
        allData = allData.concat(student.Absences);
      }
      if (student.Notes != null) {
        allData = allData.concat(student.Notes);
      }
    }
    if (messages[0] != null) {
      allData = allData.concat(messages);
    }
    if (tests[0] != null) {
      allData = allData.concat(tests);
    }
    if (events[0] != null) {
      allData = allData.concat(events);
    }

    if (allData[0] != null) {
      let months: number[] = [];
      for (let i = 0; i < allData.length; i++) {
        let creatingMonth = new Date(this.getDateField(allData[i])).getMonth();
        if (!months.includes(creatingMonth)) {
          months.push(creatingMonth);
        }
        allData[i].opened = false;
      }

      let i = 0;
      months.forEach(month => {
        let monthlyData: any[] = [];
        allData.forEach(item => {
          if (new Date(this.getDateField(item)).getMonth() == month) {
            monthlyData.push(item);
          }
        });

        monthlyData.sort((a, b) => new Date(this.getDateField(b)).valueOf() - new Date(this.getDateField(a)).valueOf());

        allDataByMonths.push({
          index: i,
          header: this.monthsName[month],
          data: monthlyData,
          firstEntryCreatingTime: new Date(this.getDateField(monthlyData[monthlyData.length - 1])).valueOf(),
          showEvaluations: true,
          showAbsences: true,
          showDocs: true,
          showMessages: true,
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

      this.isEmpty = false;
      return allDataByMonths;
    } else {
      this.isEmpty = true;
      return [];
    }
  }
  private getDateField(item: any) {
    if (item.CreatingTime != null) {
      return item.CreatingTime;
    } else if (item.Date != null) {
      return item.Date;
    } else if (item.uzenet != null) {
      return item.uzenet.kuldesDatum;
    } else {
      return item.Datum;
    }
  }
  showOrHide(type: string, monthlyGrades: CollapsibleCombined) {
    if (type == "evaluations") {
      monthlyGrades.showEvaluations = monthlyGrades.showEvaluations ? false : true;
    } else if (type == "absences") {
      monthlyGrades.showAbsences = monthlyGrades.showAbsences ? false : true;
    } else if (type == "docs") {
      monthlyGrades.showDocs = monthlyGrades.showDocs ? false : true;
    } else if (type == "messages") {
      monthlyGrades.showMessages = monthlyGrades.showMessages ? false : true;
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
    } else {
      return this.color.cardColors.noneColor
    }
  }
  themeIf(theme: string) {
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
    }
  }
  async showPicker() {
    this.unsubOnLeave = false;
    this.navRouter.navigateByUrl('/color-picker?from=home');
  }
  goToHomeSettings() {
    this.unsubOnLeave = false;
    this.router.navigateByUrl('home/home-settings');
  }
  async openMessage(message: Message) {
    if (!message.isElolvasva) {
      await this.userManager.currentUser.setMessageAsRead(message.uzenet.azonosito);
    }
    this.dataService.setData('messageId', message.azonosito);
    this.router.navigateByUrl('/messages/read-message');
  }
  isRequestEnabled(r: string) {
    let returnVal = false;
    this.app.homeRequests.forEach(req => {
      if (req.requestName == r && req.show) {
        returnVal = true;
      }
    });
    return returnVal;
  }
  getLongItemText(text: string) {
    if (text.length > 100) {
      return text.substring(0, 100) + '...';
    } else {
      return text;
    }
  }
  isOpenableNeeded(text: string) {
    if (text.length > 100) {
      return this.translator.instant('pages.home.readMoreText');
    } else {
      return '';
    }
  }
  urlify(text: string) {
    var urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
    return text.replace(urlRegex, function (url) {
      return `<a href="${url}">${url}</a>`;
    });
  }
}