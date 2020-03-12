import { Component, OnInit } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { TeacherHomework, StudentHomework } from '../_models/homework';
import { FormattedDateService } from '../_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { PromptService } from '../_services/prompt.service';
import { UserManagerService } from '../_services/user-manager.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-homeworks',
  templateUrl: './homeworks.page.html',
  styleUrls: ['./homeworks.page.scss'],
})
export class HomeworksPage implements OnInit {
  public teacherHomeworks: TeacherHomework[] = [];
  public studentHomeworks: StudentHomework[] = [];
  public sans: boolean;
  private reloaderSubscription: Subscription;
  constructor(
    public fDate: FormattedDateService,

    private userManager: UserManagerService,
    private firebase: FirebaseX,
    private prompt: PromptService,
  ) { }

  async ngOnInit() {
    this.firebase.setScreenName('homeworks');
  }

  async ionViewDidEnter() {
    await this.loadData();
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.sans = true;
        this.loadData();
      }
    });
  }

  private async loadData() {
    this.sans = true;
    this.teacherHomeworks = await this.userManager.currentUser.getTeacherHomeworks(this.fDate.getDate("today"), this.fDate.getDate("today"));
    this.studentHomeworks = await this.userManager.currentUser.getStudentHomeworks(this.fDate.getDate("today"), this.fDate.getDate("today"));
    this.sans = false;
  }

  ionViewWillLeave() {
    this.reloaderSubscription.unsubscribe();
  }

  showInfo(teacherHomework: TeacherHomework) {
    this.prompt.teacherHomeworkAlert(teacherHomework, teacherHomework.Tantargy);
  }
  getHeaderDate(): string {
    return this.fDate.formatDateWithZerosAndDots(new Date());
  }
}
