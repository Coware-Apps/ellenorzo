import { Component, OnInit, ViewChild } from '@angular/core';
import { Token } from '../_models/token';
import { Storage } from '@ionic/storage';
import { Lesson } from '../_models/lesson';
import { ThemeService } from '../_services/theme.service';
import { AlertController, IonSlides, MenuController } from '@ionic/angular';
import { FormattedDateService } from '../_services/formatted-date.service';
import { KretaService } from '../_services/kreta.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { UserManagerService } from '../_services/user-manager.service';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

interface day {
  name: string,
  shortName: string,
  index: number,
  show: boolean,
}
@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss']
})
export class ListPage implements OnInit {

  @ViewChild('slides', { static: true }) slides: IonSlides;

  public timetable: Lesson[];
  public tokens: Token;
  public whichDay: string = "today";
  public showingDay: string;
  public sans: boolean = true;
  public focused: number;
  public currentDate: Date;
  public weekToFrom: string;
  public message;
  public unfocusFooterButton: boolean;
  weekFirst: Date;
  weekLast: Date;
  startingWeekFirst: Date;
  startingWeekLast: Date;
  public days: day[] = [
    {
      name: this.translator.instant('dates.days.sunday.name'),
      shortName: this.translator.instant('dates.days.sunday.shortName'),
      index: 6,
      show: false,
    },
    {
      name: this.translator.instant('dates.days.monday.name'),
      shortName: this.translator.instant('dates.days.monday.shortName'),
      index: 0,
      show: false,
    },
    {
      name: this.translator.instant('dates.days.tuesday.name'),
      shortName: this.translator.instant('dates.days.tuesday.shortName'),
      index: 1,
      show: false,
    },
    {
      name: this.translator.instant('dates.days.wednesday.name'),
      shortName: this.translator.instant('dates.days.wednesday.shortName'),
      index: 2,
      show: false,
    },
    {
      name: this.translator.instant('dates.days.thursday.name'),
      shortName: this.translator.instant('dates.days.thursday.shortName'),
      index: 3,
      show: false,
    },
    {
      name: this.translator.instant('dates.days.friday.name'),
      shortName: this.translator.instant('dates.days.friday.shortName'),
      index: 4,
      show: false,
    },
    {
      name: this.translator.instant('dates.days.saturday.name'),
      shortName: this.translator.instant('dates.days.saturday.shortName'),
      index: 5,
      show: false,
    }];
  private reloaderSubscription: Subscription;

  constructor(
    public storage: Storage,
    public userManager: UserManagerService,
    public alertCtrl: AlertController,
    private navRouter: Router,
    private dataService: DataService,

    private theme: ThemeService,
    private fDate: FormattedDateService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private menuCtrl: MenuController,
    private translator: TranslateService,
  ) {
    this.focused = 0;
    this.message = "";

    this.theme.currentTheme.subscribe(theme => {
      if (theme == "light") {
        this.unfocusFooterButton = false;
      } else {
        this.unfocusFooterButton = true;
      }
    });
  }

  async ngOnInit() {
    //firebase
    this.firebase.setScreenName('timetable');
  }

  async ionViewDidEnter() {
    await this.menuCtrl.enable(true);
    await this.loadData();
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.sans = true;
        this.loadData();
      }
    });
  }

  private async loadData() {
    let now = new Date();
    //getting the first day and last day to show
    let today = now.getDay();
    if (today == 0 || today == 6) {
      this.weekFirst = new Date(this.fDate.getWeekFirstDate(1));
      this.weekLast = new Date(this.fDate.getWeekLastDate(1));
      this.startingWeekFirst = new Date(this.fDate.getWeekFirstDate(1));
      this.startingWeekLast = new Date(this.fDate.getWeekLastDate(1));
      this.focused = 0;
    } else {
      this.weekFirst = new Date(this.fDate.getWeekFirstDate());
      this.weekLast = new Date(this.fDate.getWeekLastDate());
      this.startingWeekFirst = new Date(this.fDate.getWeekFirstDate(0));
      this.startingWeekLast = new Date(this.fDate.getWeekLastDate(0));
      this.focused = now.getDay() - 1;
    }
    console.log(this.weekFirst + ' ' + this.weekLast);

    this.sans = true;
    //getting the timetable data from the server
    this.timetable = await this.userManager.currentUser.getLesson(
      this.fDate.formatDate(this.weekFirst),
      this.fDate.formatDate(this.weekLast)
    );
    this.dataToScreen(this.fDate.formatDate(this.weekFirst), this.fDate.formatDate(this.weekLast));
    this.sans = false;
    this.slides.slideTo(this.focused);
  }

  ionViewWillLeave() {
    this.reloaderSubscription.unsubscribe();
  }

  async getMoreData(lesson: Lesson) {
    this.prompt.lessonAlert(lesson);
  }

  openHomeworks(TeacherHomeworkId: number, Subject: string, isTHFE: boolean, lessonId: number, CalendarOraType: string, StartTime: Date) {
    this.dataService.setData('currentLesson', {
      TeacherHomeworkId: TeacherHomeworkId,
      Subject: Subject,
      IsTanuloHaziFeladatEnabled: isTHFE,
      lessonId: lessonId,
      CalendarOraType: CalendarOraType,
      StartTime: StartTime,
      fromRoute: 'list',
    });
    this.navRouter.navigateByUrl('/timetable-homeworks?id=currentLesson');
  }

  getTime(StartTime: Date, EndTime: Date) {
    let formatted = this.fDate.getTime(StartTime) + '-' + this.fDate.getTime(EndTime);
    return formatted;
  }

  async ionSlideWillChange() {
    this.focused = await this.slides.getActiveIndex();
  }

  getData(day: number) {
    this.focused = day;
    this.slides.slideTo(day);
  }

  getStateClass(item: any) {
    return {
      'ion-color': item.StateName == 'Elmaradt tanóra' || item.DeputyTeacher != "",
      'ion-color-danger': item.StateName == 'Elmaradt tanóra',
      'ion-color-warning': item.DeputyTeacher != ""
    };
  }

  getDayName(date: string) {
    let d = new Date(date);
    return d.getDay();
  }

  async getNextWeek() {
    this.sans = true;
    this.weekFirst.setDate(this.weekFirst.getDate() + 7);
    this.weekLast.setDate(this.weekLast.getDate() + 7);
    if (this.fDate.formatDate(this.weekFirst) != this.fDate.formatDate(this.startingWeekFirst)) {
      //not caching extra weeks (timetable requests are pretty quick, and there is an issue with the storage overfill on ionic :(  )
      this.timetable = await this.userManager.currentUser.getLesson(
        this.fDate.formatDate(this.weekFirst),
        this.fDate.formatDate(this.weekLast),
        true
      );
    } else {
      this.timetable = await this.userManager.currentUser.getLesson(
        this.fDate.formatDate(this.weekFirst),
        this.fDate.formatDate(this.weekLast),
      );
    }

    this.dataToScreen(
      this.fDate.formatDate(this.weekFirst),
      this.fDate.formatDate(this.weekLast),
    );
    this.focused = 0;
    this.slides.slideTo(this.focused);
    this.sans = false;
  }

  async getPrevWeek() {
    this.sans = true;
    this.weekFirst.setDate(this.weekFirst.getDate() - 7);
    this.weekLast.setDate(this.weekLast.getDate() - 7);
    if (this.fDate.formatDate(this.weekFirst) != this.fDate.formatDate(this.startingWeekFirst)) {
      //not caching extra weeks (timetable requests are pretty quick, and there is an issue with the storage overfill on ionic :(  )
      this.timetable = await this.userManager.currentUser.getLesson(
        this.fDate.formatDate(this.weekFirst),
        this.fDate.formatDate(this.weekLast),
        true
      );
    } else {
      this.timetable = await this.userManager.currentUser.getLesson(
        this.fDate.formatDate(this.weekFirst),
        this.fDate.formatDate(this.weekLast),
      );
    }

    this.dataToScreen(
      this.fDate.formatDate(this.weekFirst),
      this.fDate.formatDate(this.weekLast),
    );
    this.focused = 0;
    this.slides.slideTo(this.focused);
    this.sans = false;
  }

  dataToScreen(weekFirst: string, weekLast: string) {
    //getting the date that is shown in brackets in the header
    this.weekToFrom = this.fDate.addZeroToNumberByLength(
      weekFirst.split('-')[1]) + '.' +
      this.fDate.addZeroToNumberByLength(weekFirst.split('-')[2]) + "-" +
      this.fDate.addZeroToNumberByLength(weekLast.split('-')[1]) + '.' +
      this.fDate.addZeroToNumberByLength(weekLast.split('-')[2]);
    this.days.forEach(day => {
      day.show = false;
    });

    this.timetable.forEach(lesson => {
      let i = this.getDayName(lesson.StartTime.toString())
      lesson.DayOfWeek = i - 1;
      this.days[i].show = true;
    });

    this.timetable.sort((a, b) => new Date(a.StartTime).valueOf() - new Date(b.StartTime).valueOf());
  }

  hideHomeworkBtn(startTime: Date) {
    if (new Date(startTime).valueOf() > new Date().valueOf()) {
      return true;
    } else {
      return false;
    }
  }

  getShownDays(days: day[]) {
    let returnDays: day[] = [];

    days.forEach(day => {
      if (day.show) {
        returnDays.push(day);
      }
    });

    return returnDays;
  }
}
