import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherHomework, StudentHomework, HomeworkResponse } from 'src/app/_models/homework';
import { KretaService } from 'src/app/_services/kreta.service';
import {AlertController, ToastController } from '@ionic/angular';
import {IonSlides} from "@ionic/angular";
import { ColorService } from 'src/app/_services/color.service';
import { DataService } from 'src/app/_services/data.service';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
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
  }

  showInfo(item: any) {
    let css = this.color.getPopUpClass();
    this.presentAlert(
      item.Rogzito,
      this.subject,
      "<ul>" +
      "<li>Óra száma: " + item.Oraszam + "</li>" +
      "<li>Tanár rögzítette? " + (item.IsTanarRogzitette == true ? 'igen' : 'nem') + "</li>" +
      "<li>Feladva: " + item.FeladasDatuma.substring(0, 10) + "</li>" +
      "<li>Határidő: " + item.Hatarido.substring(0, 10) + "</li>" +
      "</ul>",
      css
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

  getData(day: number) {
    this.focused = day;
    this.slides.slideTo(day);
  }

  async ionSlideWillChange() {
    this.focused = await this.slides.getActiveIndex();
  }

  goBack() {
    this.router.navigateByUrl(this.fromRoute);
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 10000,
      closeButtonText: "OK",
      cssClass: this.color.getToastClass(),
      showCloseButton: true,
    });
    toast.present();
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
        this.presentToast('A házi feladatot sikeresen hozzáadtuk!')
        this.homeworkText = null;
        this.sans = true;
        this.teacherHomeworkId = homeworkResponse.TanarHaziFeladatId;
        this.studentHomeworks = await this.kreta.getStudentHomeworks(null, null, this.teacherHomeworkId);
        this.focused = 1;
        this.isTHFE = true;
        this.sans = false;
      }
    } else {
      this.presentAlert('Hibás szöveg!', null, 'Kérlek ellenőrizd, hogy kitöltötted-e a házi feladat szövege mezőt!', this.color.getPopUpClass());
    }
  }
  async deleteHomework(id: number) {
    if(await this.kreta.deleteStudentHomework(id)) {
      this.presentToast('Házi feladat sikeresen törölve!');
      this.sans = true;
      this.studentHomeworks = await this.kreta.getStudentHomeworks(null, null, this.teacherHomeworkId);
      this.sans = false;
    };
    
  }

}
