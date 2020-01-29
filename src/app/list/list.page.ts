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
  public monday: boolean;
  public tuesday: boolean;
  public wednesday: boolean;
  public thursday: boolean;
  public friday: boolean;
  public saturday: boolean;
  public sunday: boolean;
  public focused: number;
  public days: string[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  public days2: number[] = [];
  public currentDate: Date;
  public weekToFrom: string;
  public currentWeekIndex;
  public message;
  public unfocusFooterButton: boolean;

  constructor(
    public storage: Storage,
    public kreta: KretaService,
    public alertCtrl: AlertController,
    private navRouter: Router,
    private dataService: DataService,

    private theme: ThemeService,
    private fDate: FormattedDateService,
  ) {
    this.monday = false;
    this.tuesday = false;
    this.wednesday = false;
    this.thursday = false;
    this.friday = false;
    this.saturday = false;
    this.sunday = false;
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

  async getMoreData(lesson: Lesson) {
    let cssa = await this.storage.get('theme') == "custom" ? "timeTableAlert" : "";
    this.presentAlert(
      lesson.Subject,
      lesson.Teacher,
      "<ul>" +
      "<li>Időpont: " + this.getTime(lesson.StartTime, lesson.EndTime) + "</li>" +
      "<li>Csoport: " + lesson.ClassGroup + "</li>" +
      "<li>Terem: " + lesson.ClassRoom + "</li></ul>",
      cssa
    );
  }

  async presentAlert(header: string, subHeader: string, message: string, css: string) {
    const alert = await this.alertCtrl.create({
      cssClass: css,
      header: header,
      subHeader: subHeader,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
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
    return d.getDay() - 1;
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

  async ngOnInit() {
    this.sans = true;
    let now = new Date(); 

    let weekFirst;
    let weekLast;

    let today = now.getDay();
    if (today == 6 || today == 7) {
      weekFirst = this.fDate.getWeekFirst(1);
      weekLast = this.fDate.getWeekLast(1);
      this.focused = 0;
    } else {
      weekFirst = this.fDate.getWeekFirst();
      weekLast = this.fDate.getWeekLast();
      this.focused = now.getDay() - 1;
    }

    this.timetable = await this.kreta.getLesson(weekFirst, weekLast);


    this.slides.slideTo(this.focused);
    this.dataToScreen(weekFirst, weekLast);
    this.sans = false;
  }

  addZeroToNumber(n: any) {
    if (n < 10) {
      return "0" + n;
    } else {
      return n;
    }
  }

  dataToScreen(weekFirst: string, weekLast: string) {
    //nulling out the days (note that this function only works with data that is printed on the screen)
    this.monday = false;
    this.tuesday = false;
    this.wednesday = false;
    this.thursday = false;
    this.friday = false;
    this.saturday = false;
    this.sunday = false;
    this.days2 = [];

    //getting the date that is shown in brackets
    this.weekToFrom = this.addZeroToNumber(weekFirst.split('-')[1]) + '.' + this.addZeroToNumber(weekFirst.split('-')[2]) + "-" + this.addZeroToNumber(weekLast.split('-')[1]) + '.' + this.addZeroToNumber(weekLast.split('-')[2]);

    this.timetable.forEach(x => {
      let i = this.getDayName(x.StartTime.toString())
      x["DayOfWeek"] = i;

      if (!this.days2.includes(i)) {
        this.days2.push(i);
        switch (i) {
          case 0:
            this.monday = true;
            break;
          case 1:
            this.tuesday = true;
            break;
          case 2:
            this.wednesday = true;
            break;
          case 3:
            this.thursday = true;
            break;
          case 4:
            this.friday = true;
            break;
          case 5:
            this.saturday = true;
            break;
          case 6:
            this.sunday = true;
            break;
        }
      }
    });
  }
}
