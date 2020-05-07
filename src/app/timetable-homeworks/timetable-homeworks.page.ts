import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeacherHomework, StudentHomework, HomeworkResponse } from 'src/app/_models/homework';
import { IonSlides, MenuController, LoadingController } from "@ionic/angular";
import { DataService } from 'src/app/_services/data.service';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from 'src/app/_services/prompt.service';
import { UserManagerService } from 'src/app/_services/user-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { Lesson } from '../_models/lesson';
import { JwtDecodeHelper } from '../_helpers/jwt-decode-helper';
@Component({
  selector: 'app-timetable-homeworks',
  templateUrl: './timetable-homeworks.page.html',
  styleUrls: ['./timetable-homeworks.page.scss'],
})
export class TimetableHomeworksPage implements OnInit {

  @ViewChild('slides', { static: true }) slides: IonSlides;
  public focused: number;
  public sans: boolean;
  public homeworkText: string;
  public lesson: Lesson;
  public teacherHomeworks: TeacherHomework[];
  public studentHomeworks: StudentHomework[];

  constructor(
    private actRoute: ActivatedRoute,
    private userManager: UserManagerService,
    private data: DataService,
    private fDate: FormattedDateService,
    private firebase: FirebaseX,
    private prompt: PromptService,
    private menuCtrl: MenuController,
    private translator: TranslateService,
    private loadingCtrl: LoadingController,
    private jwtHelper: JwtDecodeHelper,
  ) {
    this.focused = 0;
    this.sans = true;
  }

  async ngOnInit() {
    this.menuCtrl.enable(false);
    this.actRoute.queryParams.subscribe(async (params) => {
      let id = params['id'];

      this.lesson = this.data.getData(id);

      if (this.lesson.TeacherHomeworkId != null) {
        this.teacherHomeworks = await this.userManager.currentUser.getTeacherHomeworks(null, null, +this.lesson.TeacherHomeworkId);
        console.log('this.teacherHomeworks', this.teacherHomeworks);
        if (this.lesson.IsTanuloHaziFeladatEnabled == true) {
          this.studentHomeworks = await this.userManager.currentUser.getStudentHomeworks(null, null, +this.lesson.TeacherHomeworkId);
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
    this.prompt.teacherHomeworkAlert(teacherHomework, this.lesson.Subject)
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
    let loading = await this.loadingCtrl.create({
      message: this.translator.instant('pages.timetable-homeworks.loadingText'),
      spinner: 'crescent'
    });
    loading.present();

    if (this.homeworkText != null) {
      //"2020. 01. 17. 0:00:00" TODO
      let sTBefore = this.lesson.StartTime;
      console.log('startTime before: ', sTBefore);
      let StartTime = this.fDate.formatDateKRETA(new Date(this.lesson.StartTime));
      console.log('startTime: ', StartTime);

      let lesson = {
        teacherHomeworkId: this.lesson.TeacherHomeworkId,
        Subject: this.lesson.Subject,
        IsTanuloHaziFeladatEnabled: this.lesson.IsTanuloHaziFeladatEnabled,
        lessonId: this.lesson.LessonId,
        CalendarOraType: this.lesson.CalendarOraType,
        StartTime: StartTime,
      }

      try {
        let homeworkResponse: HomeworkResponse;
        if ((homeworkResponse = await this.userManager.currentUser.addStudentHomework(lesson, this.homeworkText)).HozzaadottTanuloHaziFeladatId != null) {
          this.prompt.toast(this.translator.instant('pages.timetable-homeworks.successfullyAddedToastText'), true);
          this.homeworkText = null;
          this.sans = true;

          //this.teacherHomeworkId = homeworkResponse.TanarHaziFeladatId;

          this.studentHomeworks = await this.userManager.currentUser.getStudentHomeworks(null, null, +this.lesson.TeacherHomeworkId);
          this.focused = 1;

          //this.isTHFE = true;

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
        this.studentHomeworks = await this.userManager.currentUser.getStudentHomeworks(null, null, +this.lesson.TeacherHomeworkId);
        this.sans = false;
      };
    } catch (error) {
      console.error(error);
    }
    loading.dismiss();
  }
  async changeState() {
    try {
      await this.userManager.currentUser.changeHomeworkState(this.lesson.IsHaziFeladatMegoldva, +this.lesson.TeacherHomeworkId);
    } catch (error) {
      throw error;
    }
  }
  showCompletedBar() {
    return this.lesson.TeacherHomeworkId && this.jwtHelper.decodeToken(this.userManager.currentUser.tokens.access_token).role == 'Student';
  }
}
