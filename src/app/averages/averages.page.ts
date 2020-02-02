import { Component, OnInit } from '@angular/core';
import { Student } from '../_models/student';
import { FormattedDateService } from '../_services/formatted-date.service';
import { ModalController } from '@ionic/angular';
import { AverageGraphsPage } from '../average-graphs/average-graphs.page';
import { ColorService } from '../_services/color.service';
import { KretaService } from '../_services/kreta.service';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { promise } from 'protractor';
import { DataService } from '../_services/data.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';


@Component({
  selector: 'app-averages',
  templateUrl: './averages.page.html',
  styleUrls: ['./averages.page.scss'],
})
export class AveragesPage implements OnInit {

  public student: Student;
  public sans: boolean;
  private shadowcolor: string;

  constructor(
    public color: ColorService,

    private fDate: FormattedDateService,
    private kretaService: KretaService,
    private modalCtrl: ModalController,
    private storage: Storage,
    private navRouter: Router,
    private data: DataService,
    private firebase: FirebaseX,
  ) { }

  async ngOnInit() {
    this.sans = true;
    //using the same cache as statistics (there is a minor difference in response time for more data but this way we can cache both together)
    this.student = await this.kretaService.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"));
    //this.student = await this.dataService.getStudent(this.fDate.getDate("thisYearBegin"), this.fDate.getDate("today"));
    this.sans = false;
    this.firebase.setScreenName('averages');
  }

  async ionViewDidEnter() {
    let a;
    this.shadowcolor = (a = await this.storage.get('cardColor')) != null ? a : "&&&&&";
  }

  async showModal(subject: string, classValue: number) {
    this.data.setData("subject", subject);
    this.data.setData("student", this.student);
    this.data.setData("classValue", classValue);
    this.navRouter.navigateByUrl("/average-graphs?fromRoute=averages");
  }

  getShadowColor(average: number) {

    if (this.shadowcolor == null) {
      return this.color.getContrast();
    }

    if (average >= 4.5) {
      return this.shadowcolor.split('&')[0] != "" ? this.shadowcolor.split('&')[0] : "#00CC66";
    }
    else if (average < 4.5 && average >= 3.5) {
      return this.shadowcolor.split('&')[1] != "" ? this.shadowcolor.split('&')[1] : "#FFFF66";
    }
    else if (average < 3.5 && average >= 2.5) {
      return this.shadowcolor.split('&')[2] != "" ? this.shadowcolor.split('&')[2] : "#FF9933";
    }
    else if (average < 2.5 && average >= 1.5) {
      return this.shadowcolor.split('&')[3] != "" ? this.shadowcolor.split('&')[3] : "#663300";
    }
    else if (average < 1.5) {
      return this.shadowcolor.split('&')[4] != "" ? this.shadowcolor.split('&')[4] : "#FF0000";
    }
  }
  async showPicker() {
    this.navRouter.navigateByUrl('/color-picker?from=averages');
  }
}
