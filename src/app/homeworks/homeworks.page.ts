import { Component, OnInit } from '@angular/core';
import { KretaService } from '../_services/kreta.service';
import { TeacherHomework, StudentHomework } from '../_models/homework';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Lesson } from '../_models/lesson';
import { ColorService } from '../_services/color.service';
import { AlertController } from '@ionic/angular';

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
  ) { }

  async ngOnInit() {
    this.sans = true;
    this.teacherHomeworks = await this.kreta.getTeacherHomeworks(this.fDate.getDate("today"), this.fDate.getDate("today")); 
    this.studentHomeworks = await this.kreta.getStudentHomeworks(this.fDate.getDate("today"), this.fDate.getDate("today")); 
    this.sans = false;
  }

  showInfo(item: any) {
    let css = this.color.getPopUpClass();
      this.presentAlert(
        item.Rogzito,
        item.Tantargy,
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
}
