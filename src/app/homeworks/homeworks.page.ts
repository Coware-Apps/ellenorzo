import { Component, OnInit } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { TeacherHomework, StudentHomework } from '../_models/homework';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Lesson } from '../_models/lesson';
import { ColorService } from '../_services/color.service';
import { AlertController } from '@ionic/angular';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';

@Component({
  selector: 'app-homeworks',
  templateUrl: './homeworks.page.html',
  styleUrls: ['./homeworks.page.scss'],
})
export class HomeworksPage implements OnInit {
  public teacherHomeworks: TeacherHomework[];
  public studentHomeworks: StudentHomework[];
  public sans: boolean;

  constructor(
    public fDate: FormattedDateService,

    private kreta: KretaService,
    private color: ColorService,
    private alertCtrl: AlertController,
    private firebase: FirebaseX,
    private prompt: PromptService,
  ) { }

  async ngOnInit() {
    this.sans = true;
    this.teacherHomeworks = await this.kreta.getTeacherHomeworks(this.fDate.getDate("today"), this.fDate.getDate("today")); 
    this.studentHomeworks = await this.kreta.getStudentHomeworks(this.fDate.getDate("today"), this.fDate.getDate("today")); 
    this.sans = false;

    this.firebase.setScreenName('homeworks');
  }

  showInfo(teacherHomework: TeacherHomework) {
    this.prompt.teacherHomeworkAlert(teacherHomework, teacherHomework.Tantargy);
  }
}
