import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherHomework, StudentHomework, HomeworkResponse } from 'src/app/_models/homework';
import { KretaService } from 'src/app/_services/kreta.service';
import { IonSlides, MenuController, LoadingController } from "@ionic/angular";
import { DataService } from 'src/app/_services/data.service';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from 'src/app/_services/prompt.service';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-timetable-homeworks',
  templateUrl: './timetable-homeworks.page.html',
  styleUrls: ['./timetable-homeworks.page.scss'],
})
export class TimetableHomeworksPage implements OnInit {

  @ViewChild('slides', { static: true }) slides: IonSlides;
  public subject: string;
  public teacherHomeworks: TeacherHomework[];
  public studentHomeworks: StudentHomework[];
  public teacherHomeworkId: number;
  public focused: number;
  public sans: boolean;
  public isTHFE: boolean;
  public homeworkText: string;

  private fromRoute: string;
  private lessonId: number;
  private CalendarOraType: string;
  private StartTime: Date;

  constructor(
    private actRoute: ActivatedRoute,
    private userManager: UserManagerService,
    private router: Router,
    private data: DataService,
    private fDate: FormattedDateService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private menuCtrl: MenuController,
    private translator: TranslateService,
    private loadingCtrl: LoadingController,
  ) {
    this.teacherHomeworkId = null;
    this.focused = 0;
    this.sans = true;
  }

  async ngOnInit() {
    this.menuCtrl.enable(false);
    this.actRoute.queryParams.subscribe(async (params) => {
      let id = params['id'];
      this.teacherHomeworkId = this.data.getData(id).TeacherHomeworkId;
      this.subject = this.data.getData(id).Subject;
      this.fromRoute = this.data.getData(id).fromRoute;
      this.isTHFE = this.data.getData(id).IsTanuloHaziFeladatEnabled;
      this.lessonId = this.data.getData(id).lessonId;
      this.CalendarOraType = this.data.getData(id).CalendarOraType;
      this.StartTime = this.data.getData(id).StartTime;

      if (this.teacherHomeworkId != null) {
        this.teacherHomeworks = await this.userManager.currentUser.getTeacherHomeworks(null, null, this.teacherHomeworkId);
        console.log('this.teacherHomeworks', this.teacherHomeworks);
        if (this.isTHFE == true) {
          this.studentHomeworks = await this.userManager.currentUser.getStudentHomeworks(null, null, this.teacherHomeworkId);
          console.log('this.studentHomeworks', this.studentHomeworks);
        }
      }
      this.sans = false;
    });
    this.firebase.setScreenName('timetable-homeworks');
  }

  async ionViewWillLeave() {
    await this.menuCtrl.enable(true)
  }

  showInfo(teacherHomework: TeacherHomework) {
    this.prompt.teacherHomeworkAlert(teacherHomework, this.subject)
  }

  async getData(event: any) {
    if (await this.slides.getActiveIndex() == this.focused) {
      //the segment's ionChange event wasn't fired by a slide moving
      let day = event.detail.value;
      this.focused = day;
      this.slides.slideTo(day);
    }
  }

  async ionSlideWillChange() {
    this.focused = await this.slides.getActiveIndex();
  }

  async goBack() {
    this.router.navigateByUrl(this.fromRoute);
  }

  getHomeworkText(t: string) {
    return t.replace(/\n/g, '<br>').replace(/<br\/>/g, '<br>')
  }

  areAllTeacherHomeworksEmpty() {
    let returnval = true;
    this.teacherHomeworks.forEach(TH => {
      if (TH.Szoveg != "") {
        returnval = false;
      }
    });

    return returnval;
  }

  async addHomework() {
    await this.userManager.currentUser.clearUserCacheByCategory("lesson");
    console.log('homeworkText', this.homeworkText);
    let loading = await this.loadingCtrl.create({
      message: this.translator.instant('pages.timetable-homeworks.loadingText'),
      spinner: 'crescent'
    });
    loading.present();

    if (this.homeworkText != null) {
      //"2020. 01. 17. 0:00:00" TODO
      let sTBefore = this.StartTime;
      console.log('startTime before: ', sTBefore);
      let StartTime = this.fDate.formatDateKRETA(new Date(this.StartTime));
      console.log('startTime: ', StartTime);

      let lesson = {
        teacherHomeworkId: this.teacherHomeworkId,
        Subject: this.subject,
        IsTanuloHaziFeladatEnabled: this.isTHFE,
        lessonId: this.lessonId,
        CalendarOraType: this.CalendarOraType,
        StartTime: StartTime,
      }

      try {
        let homeworkResponse: HomeworkResponse;
        if ((homeworkResponse = await this.userManager.currentUser.addStudentHomework(lesson, this.homeworkText)).HozzaadottTanuloHaziFeladatId != null) {
          this.prompt.toast(this.translator.instant('pages.timetable-homeworks.successfullyAddedToastText'), true);
          this.homeworkText = null;
          this.sans = true;
          this.teacherHomeworkId = homeworkResponse.TanarHaziFeladatId;
          this.studentHomeworks = await this.userManager.currentUser.getStudentHomeworks(null, null, this.teacherHomeworkId);
          this.focused = 1;
          this.isTHFE = true;
          this.sans = false;
        }
      } catch (error) {
        console.error(error);
      }

    } else {
      this.prompt.missingTextAlert(this.translator.instant('pages.timetable-homeworks.checkFieldAlertText'));
    }
    loading.dismiss();
  }
  async deleteHomework(id: number) {
    let loading = await this.loadingCtrl.create({
      message: this.translator.instant('pages.timetable-homeworks.loadingText'),
      spinner: 'crescent'
    });
    loading.present();
    try {
      if (await this.userManager.currentUser.deleteStudentHomework(id)) {
        this.prompt.toast(this.translator.instant('pages.timetable-homeworks.successfullyDeletedToastText'), true);
        this.sans = true;
        this.studentHomeworks = await this.userManager.currentUser.getStudentHomeworks(null, null, this.teacherHomeworkId);
        this.sans = false;
      };
    } catch (error) {
      console.error(error);
    }
    loading.dismiss();
  }

}
