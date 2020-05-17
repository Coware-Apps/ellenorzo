import { Component, OnInit, OnDestroy } from '@angular/core';
import { TeacherHomework, StudentHomework } from '../_models/homework';
import { FormattedDateService } from '../_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { UserManagerService } from '../_services/user-manager.service';
import { Subject } from 'rxjs';
import { AppService } from '../_services/app.service';
import { takeUntil } from 'rxjs/operators';
import { Lesson } from '../_models/lesson';
import { CollapsifyService, UniversalSortedData } from '../_services/collapsify.service';
import { DataService } from '../_services/data.service';
import { Router } from '@angular/router';
import 'hammerjs';
import { HwBackButtonService } from '../_services/hw-back-button.service';

@Component({
  selector: 'app-homeworks',
  templateUrl: './homeworks.page.html',
  styleUrls: ['./homeworks.page.scss'],
})
export class HomeworksPage implements OnInit, OnDestroy {
  public teacherHomeworks: TeacherHomework[] = [];
  public studentHomeworks: StudentHomework[] = [];
  public homeworkLessons: UniversalSortedData[] = [];
  public extraWeekIndex: number = 0;
  public componentState: 'loading' | 'loaded' | 'empty' | 'loadedProgress' | 'error' = 'loading';
  public unsubscribe$: Subject<void>;

  constructor(
    public fDate: FormattedDateService,
    public app: AppService,

    private hw: HwBackButtonService,
    private userManager: UserManagerService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private collapsyfyService: CollapsifyService,
    private dataService: DataService,
    private router: Router,
  ) { }

  async ngOnInit() {
    this.firebase.setScreenName('homeworks');
    this.unsubscribe$ = new Subject();
    this.hw.registerHwBackButton(this.unsubscribe$);
    this.loadData();
    this.userManager.reloader.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
      if (value == 'reload') {
        this.loadData();
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  async loadData(forceRefresh: boolean = false, event?) {
    this.userManager.currentUser.getAsyncAsObservableWithCache([
      {
        name: "getLesson",
        cacheKey: "lesson",
        params: [
          this.fDate.getWeekFirst(this.extraWeekIndex),
          this.fDate.getWeekLast(this.extraWeekIndex),
          true
        ]
      }
    ],
      this.extraWeekIndex != 0 || forceRefresh,
      this.extraWeekIndex != 0
    ).subscribe(
      {
        next: d => {
          if (d[0]) {
            this.homeworkLessons = (
              this.collapsyfyService.collapsifyByDates(
                d[0].filter(hl => hl.TeacherHomeworkId != null),
                "StartTime",
                "StartTime"
              )
            ).map(usd => {
              usd.showAll = true;
              return usd;
            });
            this.componentState = "loadedProgress";
          } else {
            if (this.extraWeekIndex != 0) {
              this.homeworkLessons = [];
              this.componentState = 'error'
            }
          }
        },
        complete: () => {
          if (event) event.target.complete();

          let empty = true;
          this.homeworkLessons.forEach(hl => {
            if (hl.data && hl.data.length > 0) {
              empty = false;
            }
          });
          this.componentState = empty ? 'empty' : 'loaded'
        },
        error: (error) => {
          console.error(error);

          if (event) event.target.complete();

          throw error;
        }
      }
    )
  }
  showInfo(teacherHomework: TeacherHomework) {
    this.prompt.teacherHomeworkAlert(teacherHomework, teacherHomework.Tantargy);
  }
  openHomeworks(lesson: Lesson) {
    this.dataService.setData('currentLesson', lesson);
    this.router.navigateByUrl('/timetable-homeworks?id=currentLesson');
  }
  async doRefresh($event) {
    this.loadData(true, $event);
  }
  swipe(event) {
    if (this.componentState == 'loading') return;

    if (event.direction === 2) {
      //swiped left, needs to load page to the right
      this.getNextWeek();
    } else {
      //swiped right, needs to load page to the left
      this.getPrevWeek();
    }
  }
  getNextWeek() {
    this.componentState = 'loading';
    this.extraWeekIndex++;
    this.loadData(true, null);
  }
  getPrevWeek() {
    this.componentState = 'loading';
    this.extraWeekIndex--;
    this.loadData(true, null);
  }
  async filterChanged() {
    await this.app.changeConfig('doHomeworkFilter', !this.app.doHomeworkFilter);
  }
  showGroup(data: Lesson[] | any) {
    let returnVal = false;
    data.forEach(l => {
      if (!l.IsHaziFeladatMegoldva) {
        returnVal = true;
      }
    });

    if (!this.app.doHomeworkFilter) returnVal = true;

    return returnVal;
  }
  showCompletedComponent() {
    let show = true;
    this.homeworkLessons.forEach(usd => {
      if (this.showGroup(usd.data)) {
        show = false;
      }
    });

    if (this.componentState == 'loading') show = false;

    return show;
  }
}