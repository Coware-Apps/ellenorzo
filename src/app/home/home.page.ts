import { Student } from '../_models/student';
import { Router } from '@angular/router';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { FormattedDateService } from '../_services/formatted-date.service';
import { ColorService } from '../_services/color.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { CollapsibleStudent } from '../_models/student';
import { Subscription, Subject } from 'rxjs';
import { AppService } from '../_services/app.service';
import { UserManagerService } from '../_services/user-manager.service';
import { MenuController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { CollapsibleCombined } from '../_models/user';
import { Message } from '../_models/message';
import { HwBackButtonService } from '../_services/hw-back-button.service';
import { KretaError } from '../_exceptions/kreta-exception';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  public monthNames: string[];
  public formattedCombined: CollapsibleCombined[];
  public isEmpty: boolean = false;
  public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
  public error: KretaError;

  //categories
  showEvaluations: boolean = true;
  showAbsences: boolean = true;
  showDocs: boolean = true;
  showMessages: boolean = true;

  private unsubscribe$: Subject<void>;
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

    private hw: HwBackButtonService,
    private navRouter: Router,
    private color: ColorService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private menuCtrl: MenuController,
    private translator: TranslateService,
    private router: Router,
  ) {
    this.monthNames = this.translator.instant("dates.monthNames");
  }

  public async ngOnInit() {
    this.reloaderSubscription = this.userManager.reloader.subscribe(val => {
      if (val == 'reload') {
        this.formattedCombined = null;
        this.componentState = 'loading';
        this.loadData();
      }
    });
    this.firebase.setScreenName('home');
    this.loadData(false, null);
  }
  ionViewWillEnter() {
    this.menuCtrl.enable(true);
    this.unsubscribe$ = new Subject();
    this.hw.registerHwBackButton(this.unsubscribe$, true);
  }
  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  ngOnDestroy(): void {
    if (this.reloaderSubscription) this.reloaderSubscription.unsubscribe();
  }

  loadData(forceRefresh: boolean = false, event?) {
    let requestsToDo = [];

    this.app.homeRequests.forEach(r => {
      if (r.show) {
        requestsToDo.push({
          name: `get${r.requestName}`,
          cacheKey: r.cacheKey,
          params: r.defaultParams,
        })
      }
    })

    this.userManager.currentUser.getAsyncAsObservableWithCache<[]>(
      requestsToDo,
      forceRefresh
    ).subscribe(
      {
        next: d => {
          if (d && d.length > 0) {
            this.formattedCombined = this.formatCombined(d);
            this.componentState = 'loadedProgress';
          }
        },
        complete: () => {
          if (event) event.target.complete();

          let empty = true;
          if (this.formattedCombined) this.formattedCombined.forEach(e => {
            if (e.data.length > 0) empty = false;
          });
          this.componentState = empty ? 'empty' : 'loaded'
        },
        error: (error) => {
          console.error(error);
          this.error = error;

          if (event) event.target.complete();

          let empty = true;
          if (this.formattedCombined) this.formattedCombined.forEach(e => {
            if (e.data.length > 0) empty = false;
          });

          if (empty) {
            this.componentState = 'error';
            error.isHandled = true;
          } else {
            this.componentState = 'loaded'
          }

          throw error;
        }
      }
    )
  }

  async doRefresh(event?) {
    if (this.componentState == 'error') {
      this.componentState = 'loading';
    } else {
      this.componentState = 'loadedProgress';
    }
    this.loadData(true, event);
  }
  private formatCombined(input: any[]): CollapsibleCombined[] {

    let allDataByMonths = [];

    let allData = [];

    input.forEach((e, i) => {
      if (e.StudentId) {
        if (e.Evaluations) allData = allData.concat(e.Evaluations);
        if (e.Absences) allData = allData.concat(e.Absences);
        if (e.Notes) allData = allData.concat(e.Notes);
      } else if (e[0] && e[0].azonosito) {
        e.forEach(m => {
          if (m.tipus && m.tipus.azonosito == 1) allData.push(m)
        });
      } else {
        if (e) allData = allData.concat(e);
      }
    });
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
          header: this.monthNames[month],
          data: monthlyData,
          firstEntryCreatingTime: new Date(this.getDateField(monthlyData[monthlyData.length - 1])).valueOf(),
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
    } else {
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
  showOrHide(cat: string) {
    this[cat] = !this[cat];
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
  themeIf(theme: string) {
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
    }
  }
  async showPicker() {
    this.navRouter.navigateByUrl('/color-picker?from=home');
  }
  goToHomeSettings() {
    this.router.navigateByUrl('home/home-settings');
  }
  async openMessage(message: Message) {
    if (!message.isElolvasva) {
      await this.userManager.currentUser.setMessageAsRead(message.uzenet.azonosito);
    }
    this.router.navigateByUrl(`/messages/read-message?messageId=${message.azonosito}`);
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
  areAllRequestsEnabled() {
    let returnVal = true;
    this.app.homeRequests.forEach(r => {
      if (!r.show) returnVal = false;
    });

    return returnVal;
  }
}