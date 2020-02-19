import { Component, OnInit, ViewChild } from '@angular/core';
import { Token } from '../_models/token';
import { Storage } from '@ionic/storage';
import { Lesson } from '../_models/lesson';
import { ThemeService } from '../_services/theme.service';
import { AlertController, IonSlides } from '@ionic/angular';
import { FormattedDateService } from '../_services/formatted-date.service';
import { KretaService } from '../_services/kreta.service';
import { Router } from '@angular/router';
import { DataService } from '../_services/data.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';

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
  public currentWeekIndex;
  public message;
  public unfocusFooterButton: boolean;
  public days: day[] = [
    {
      name: "Vasárnap",
      shortName: "Va",
      index: 6,
      show: false,
    },
    {
      name: "Hétfő",
      shortName: "Hé",
      index: 0,
      show: false,
    },
    {
      name: "Kedd",
      shortName: "Ke",
      index: 1,
      show: false,
    },
    {
      name: "Szerda",
      shortName: "Sz",
      index: 2,
      show: false,
    },
    {
      name: "Csütörtök",
      shortName: "Cs",
      index: 3,
      show: false,
    },
    {
      name: "Péntek",
      shortName: "Pé",
      index: 4,
      show: false,
    },
    {
      name: "Szombat",
      shortName: "Szo",
      index: 5,
      show: false,
    }];

  constructor(
    public storage: Storage,
    public kreta: KretaService,
    public alertCtrl: AlertController,
    private navRouter: Router,
    private dataService: DataService,

    private theme: ThemeService,
    private fDate: FormattedDateService,
    private firebase: FirebaseX,
    private prompt: PromptService,
  ) {
    this.focused = 0;
    this.currentWeekIndex = 0;
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
    this.sans = true;
    let now = new Date();

    //getting the first day and last day to show
    let weekFirst;
    let weekLast;
    let today = now.getDay();
    console.log("today", today);
    if (today == 0 || today == 6) {
      weekFirst = this.fDate.getWeekFirst(1);
      weekLast = this.fDate.getWeekLast(1);
      this.focused = 0;
    } else {
      weekFirst = this.fDate.getWeekFirst();
      weekLast = this.fDate.getWeekLast();
      this.focused = now.getDay() - 1;
    }

    //getting the timetable data from the server
    this.timetable = await this.kreta.getLesson(weekFirst, weekLast);

    this.dataToScreen(weekFirst, weekLast);
    this.sans = false;
    this.slides.slideTo(this.focused);

    //firebase
    this.firebase.setScreenName('timetable');
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
    let start = new Date(StartTime);
    let end = new Date(EndTime);
    return start.getHours() + ":" + (start.getMinutes() >= 10 ? start.getMinutes() : "0" + start.getMinutes()) + "-" + end.getHours() + ":" + (end.getMinutes() >= 10 ? end.getMinutes() : "0" + end.getMinutes());
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
    this.currentWeekIndex++;
    let weekFirst = this.fDate.getWeekFirst(this.currentWeekIndex);
    let weekLast = this.fDate.getWeekLast(this.currentWeekIndex);

    if (this.currentWeekIndex != 0) {
      //not caching extra weeks (timetable requests are pretty quick, and there is an issue with the storage overfill on ionic :(  )
      this.timetable = await this.kreta.getLesson(weekFirst, weekLast, true);
    } else {
      this.timetable = await this.kreta.getLesson(weekFirst, weekLast);
    }

    this.dataToScreen(weekFirst, weekLast);
    this.focused = 0;
    this.slides.slideTo(this.focused);
    this.sans = false;
  }

  async getPrevWeek() {
    this.sans = true;
    this.currentWeekIndex--;
    let weekFirst = this.fDate.getWeekFirst(this.currentWeekIndex);
    let weekLast = this.fDate.getWeekLast(this.currentWeekIndex);

    if (this.currentWeekIndex != 0) {
      //not caching extra weeks (timetable requests are pretty quick, and there is an issue with the storage overfill on ionic :(  )
      this.timetable = await this.kreta.getLesson(weekFirst, weekLast, true);
    } else {
      this.timetable = await this.kreta.getLesson(weekFirst, weekLast);
    }

    console.log("timetable", this.timetable);

    this.dataToScreen(weekFirst, weekLast);
    this.focused = 0;
    this.slides.slideTo(this.focused);
    this.sans = false;
  }

  dataToScreen(weekFirst: string, weekLast: string) {
    //getting the date that is shown in brackets in the header
    this.weekToFrom = this.fDate.addZeroToNumber(weekFirst.split('-')[1]) + '.' + this.fDate.addZeroToNumber(weekFirst.split('-')[2]) + "-" + this.fDate.addZeroToNumber(weekLast.split('-')[1]) + '.' + this.fDate.addZeroToNumber(weekLast.split('-')[2]);
    this.days.forEach(day => {
      day.show = false;
    });

    this.timetable.forEach(lesson => {
      let i = this.getDayName(lesson.StartTime.toString())
      lesson.DayOfWeek = i - 1;
      this.days[i].show = true;
      console.log(`showing days[${i}]`);
    });

    this.timetable.sort((a, b) => new Date(a.StartTime).valueOf() - new Date(b.StartTime).valueOf());
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
