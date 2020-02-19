import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherHomework, StudentHomework, HomeworkResponse } from 'src/app/_models/homework';
import { KretaService } from 'src/app/_services/kreta.service';
import {AlertController, ToastController } from '@ionic/angular';
import {IonSlides} from "@ionic/angular";
import { ColorService } from 'src/app/_services/color.service';
import { DataService } from 'src/app/_services/data.service';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from 'src/app/_services/prompt.service';
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
    private kreta: KretaService,
    private router: Router,
    private color: ColorService,
    private alertCtrl: AlertController,
    private data: DataService,
    private fDate: FormattedDateService,
    private toastCtrl: ToastController,
    private firebase: FirebaseX,
    private prompt: PromptService,
  ) {
    this.teacherHomeworkId = null;
    this.focused = 0;
    this.sans = true;
  }

  async ngOnInit() {
    this.sans = true;
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
        this.teacherHomeworks = await this.kreta.getTeacherHomeworks(null, null, this.teacherHomeworkId);
        if (this.isTHFE == true) {
          this.studentHomeworks = await this.kreta.getStudentHomeworks(null, null, this.teacherHomeworkId);
        }
      }
    });
    console.log('this.isTHFE', this.isTHFE);
    this.sans = false;
    this.firebase.setScreenName('timetable-homeworks');
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

  goBack() {
    this.router.navigateByUrl(this.fromRoute);
  }

  async addHomework() {

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

      let homeworkResponse: HomeworkResponse;
      if ((homeworkResponse = await this.kreta.addStudentHomework(lesson, this.homeworkText)).HozzaadottTanuloHaziFeladatId != null) {
        this.prompt.toast('A házi feladatot sikeresen hozzáadtuk!', true);
        this.homeworkText = null;
        this.sans = true;
        this.teacherHomeworkId = homeworkResponse.TanarHaziFeladatId;
        this.studentHomeworks = await this.kreta.getStudentHomeworks(null, null, this.teacherHomeworkId);
        this.focused = 1;
        this.isTHFE = true;
        this.sans = false;
      }
    } else {
      this.prompt.missingTextAlert('Kérlek ellenőrizd, hogy kitöltötted-e a házi feladat szövege mezőt!');
    }
  }
  async deleteHomework(id: number) {
    if(await this.kreta.deleteStudentHomework(id)) {
      this.prompt.toast('Házi feladat sikeresen törölve!', true);
      this.sans = true;
      this.studentHomeworks = await this.kreta.getStudentHomeworks(null, null, this.teacherHomeworkId);
      this.sans = false;
    };
    
  }

}
