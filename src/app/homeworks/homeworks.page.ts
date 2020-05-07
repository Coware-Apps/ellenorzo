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
  public componentState: 'loading' | 'loaded' | 'empty' = 'loading';
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
    await this.loadData();
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

  async loadData(forceRefresh: boolean = false) {
    this.componentState = 'loading';
    let tt = await this.userManager.currentUser.getLesson(
      this.fDate.getWeekFirst(this.extraWeekIndex),
      this.fDate.getWeekLast(this.extraWeekIndex),
      this.extraWeekIndex == 0 ? forceRefresh : true
    );
    this.homeworkLessons = (
      this.collapsyfyService.collapsifyByDates(
        tt.filter(hl => hl.TeacherHomeworkId != null),
        "StartTime",
        "StartTime"
      )
    ).map(usd => {
      usd.showAll = true;
      return usd;
    });
    this.componentState = this.homeworkLessons.length == 0 ? 'empty' : 'loaded';
  }
  showInfo(teacherHomework: TeacherHomework) {
    this.prompt.teacherHomeworkAlert(teacherHomework, teacherHomework.Tantargy);
  }
  openHomeworks(lesson: Lesson) {
    this.dataService.setData('currentLesson', lesson);
    this.router.navigateByUrl('/timetable-homeworks?id=currentLesson');
  }
  async doRefresh($event) {
    await this.loadData(true);
    $event.target.complete();
  }
  swipe(event) {
    if (this.componentState == 'loading') return;

    if (event.direction === 2) {
      //swiped left, needs to load page to the right
      this.extraWeekIndex++;
      this.loadData();
    } else {
      //swiped right, needs to load page to the left
      this.extraWeekIndex--;
      this.loadData();
    }
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

    return show;
  }
}