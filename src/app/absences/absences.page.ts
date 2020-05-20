import { Component, OnInit, ViewChild } from '@angular/core';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Student } from '../_models/student';
import { IonSlides, IonContent } from '@ionic/angular';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';
import { Subject } from 'rxjs';
import { AppService } from '../_services/app.service';
import { UserManagerService } from '../_services/user-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { HwBackButtonService } from '../_services/hw-back-button.service';
import { takeUntil } from 'rxjs/operators';
import { KretaError } from '../_exceptions/kreta-exception';

interface AbsenceGroup {
  data: UniversalSortedData[];
  name: string;
  fullName: string;
}
@Component({
  selector: 'app-absences',
  templateUrl: './absences.page.html',
  styleUrls: ['./absences.page.scss'],
})
export class AbsencesPage implements OnInit {
  @ViewChild('slides', { static: true }) slides: IonSlides;
  @ViewChild('scroll', { static: true }) content: IonContent;

  public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
  public focused: number;
  public title: string;
  public a: boolean;
  public totalAbsences: number;
  public allAbsences: AbsenceGroup[] = [];
  public error: KretaError;

  public unsubscribe$: Subject<void>;

  constructor(
    public fDate: FormattedDateService,
    public app: AppService,

    private hw: HwBackButtonService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private collapsifyService: CollapsifyService,
    private userManager: UserManagerService,
    private translator: TranslateService,
  ) {
    this.focused = 0;
    this.title = this.translator.instant('pages.absences.justifiedTitle');
    this.a = false;
    this.totalAbsences = 0;
  }

  async ngOnInit() {
    this.firebase.setScreenName('absences');
  }

  async ionViewWillEnter() {
    this.unsubscribe$ = new Subject();
    this.hw.registerHwBackButton(this.unsubscribe$);
    this.userManager.reloader.pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
      if (val == 'reload') {
        this.componentState = 'loading';
        this.loadData();
      }
    });
    this.loadData();
  }

  ionViewWillLeave() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private async loadData(forceRefresh: boolean = false, event?) {


    this.userManager.currentUser.getAsyncAsObservableWithCache<[Student]>(
      [{
        name: "getStudent",
        cacheKey: "student",
        params: [null, null, true]
      }],
      forceRefresh
    ).pipe(takeUntil(this.unsubscribe$)).subscribe(
      {
        next: d => {
          if (d[0]) {
            this.totalAbsences = this.getTotalMinutes(d[0]);
            this.allAbsences = this.formatStudent(d[0]);
            this.componentState == 'loadedProgress'
          }
        },
        complete: () => {
          if (event) event.target.complete();

          this.setComponentState();
        },
        error: (error) => {
          console.error(error);
          this.error = error;

          if (event) event.target.complete();

          if (!this.allAbsences || (this.allAbsences && this.allAbsences.length == 0)) {
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

  private setComponentState() {
    if (!this.allAbsences) {
      this.componentState = 'error'
    } else if (
      this.allAbsences.findIndex(absGroup => absGroup.data && absGroup.data.length > 0) == -1
    ) {
      this.componentState = 'empty'
    } else {
      this.componentState = 'loaded'
    }
  }

  private formatStudent(student: Student): AbsenceGroup[] {
    const categories: string[] = [
      'Justified',
      'BeJustified',
      'UnJustified'
    ]

    return categories.map(c => {
      return {
        name: c.charAt(0).toLowerCase() + c.slice(1),
        data:
          this.collapsifyService.closeAllOpenTop(
            this.collapsifyService.collapsifyByDates(
              student.Absences.filter(abs => abs.JustificationState == c),
              'LessonStartTime'
            )
          ),
        fullName: this.translator.instant(`pages.absences.${c.charAt(0).toLowerCase() + c.slice(1)}`),
      }
    });
  }

  private getTotalMinutes(student: Student): number {
    let r = 0;
    student.Absences.forEach(abs => {
      if (abs.Type == 'Delay') {
        r += abs.DelayTimeMinutes;
      } else {
        r += 45;
      }
    });
    return r;
  }

  async ionSlideWillChange() {
    this.focused = await this.slides.getActiveIndex();
    const keys = ['justifiedTitle', 'beJustifiedTitle', 'unJustifiedTitle'];

    this.title = this.translator.instant(`pages.absences.${keys[this.focused]}`)
  }

  async getData(event: any) {
    if (await this.slides.getActiveIndex() == this.focused) {
      //the segment's ionChange event wasn't fired by a slide moving
      this.focused = event.detail.value;
      const keys = ['justifiedTitle', 'beJustifiedTitle', 'unJustifiedTitle'];

      this.slides.slideTo(this.focused);
      this.title = this.translator.instant(`pages.absences.${keys[this.focused]}`)
    }
  }

  async doRefresh(event?) {
    if (this.componentState == 'error') {
      this.componentState = 'loading';
    } else {
      this.componentState = 'loadedProgress';
    }
    this.loadData(true, event);
  }

  scrollToTop() {
    this.content.scrollToTop(300);
  }

  ionScroll(event) {
    this.a = event.detail.scrollTop != 0;
  }

  showTotal() {
    this.prompt.presentUniversalAlert(
      this.translator.instant('pages.absences.totalAlert.title'),
      null,
      this.translator.instant('pages.absences.totalAlert.totalText') +
      ": " +
      (this.totalAbsences - this.totalAbsences % 45) / 45 +
      " " +
      this.translator.instant('pages.absences.totalAlert.hourUnit') +
      " " +
      this.totalAbsences % 45 +
      " " +
      this.translator.instant('pages.absences.totalAlert.minuteUnit')
    );
  }
}
