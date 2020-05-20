import { Component, OnInit } from '@angular/core';
import { AlertController, MenuController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../_services/data.service';
import * as HighCharts from 'highcharts';
import { evaluation } from '../_models/student';
import { ColorService } from '../_services/color.service';
import { FormattedDateService } from '../_services/formatted-date.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';

@Component({
  selector: 'app-monthly-average',
  templateUrl: './monthly-average.page.html',
  styleUrls: ['./monthly-average.page.scss'],
})
export class MonthlyAveragePage implements OnInit {
  public monthlySubjectData: evaluation[];
  public grades = [];
  public average = 0;
  public sumOfWeighedGrades = 0;
  public weightSum = 0;
  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private alertCtrl: AlertController,
    private color: ColorService,
    private fDate: FormattedDateService,
    private firebase: FirebaseX,
    private menuCtrl: MenuController,
  ) {
    this.route.queryParams.subscribe(params => {
      this.monthlySubjectData = dataService.getData(params.id);
    });
  }

  throwBackValue(array: string[]) {
    let returnVal: string;
    for (let i = 0; i < array.length; i++) {
      if (i != array.length - 1) {
        returnVal = (array[i] + ", ")
      }
      else {
        returnVal += array[i];
      }
    }
    return returnVal;
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
    for (let i = 0; i < this.monthlySubjectData.length; i++) {
      if (this.monthlySubjectData[i].Form == "Mark" && this.monthlySubjectData[i].Type == "MidYear") {
        this.grades[i] = this.monthlySubjectData[i].NumberValue;
        this.sumOfWeighedGrades += this.monthlySubjectData[i].NumberValue * (parseInt(this.monthlySubjectData[i].Weight.split("%")[0]));
        this.weightSum += parseInt(this.monthlySubjectData[i].Weight.split("%")[0]);
      }
    }
    this.average = Math.round(this.sumOfWeighedGrades / this.weightSum * 100) / 100;

    let myChart = HighCharts.chart('container', {
      chart: {
        type: 'line',
        //color
        backgroundColor: this.color.getChartBgColor(),
      },
      credits: {
        enabled: false
      },
      title: {
        text: 'Grafikon',
        //color
        style: {
          color: this.color.getChartTextColor(),
          fontWeight: 'bold'
        }
      },
      xAxis: {
      },
      yAxis: {
        min: 1,
        max: 5,
        title: {
          text: 'Értékelés',
          //color
          style: {
            color: this.color.getChartTextColor(),
            fontWeight: 'bold'
          }
        },
        plotLines: [
          {
            value: this.average,
            color: this.color.getChartPlotLineColor(0),
            width: 2,
            zIndex: 2,
            dashStyle: "ShortDash",
            label: {
              text: 'Átlag',
              //color
              style: {
                color: this.color.getChartTextColor(),
              }
            }
          }
        ]
      },
      series: [{
        name: 'Jegyek',
        data: this.grades,
        width: 5,
        zIndex: 3,
        type: undefined,
        color: this.color.getChartSeriesColor(),
      }],
      //color
      legend: {
        itemStyle: {
          color: this.color.getChartTextColor(),
        },
      }
    });
  }

  async ionViewWillLeave() {
    await this.menuCtrl.enable(true)
  }

  themeIf(theme: string) {
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
    }
  }

  async getMoreData(item: evaluation) {
    let date = new Date(item.Date);
    let t = new Date(item.CreatingTime)
    let formattedDate = this.fDate.formatDate(date);
    let time = t.getHours() + ":" + t.getMinutes();
    this.presentAlert(item.NumberValue + this.themeIf(item.Theme), item.Weight,
      "<ul>" +
      "<li>Dátum: " + formattedDate + "</li>" +
      "<li>Létrehozva: " + time + "</li>" +
      "<li>Típus: " + item.Mode + "</li>" +
      "<li>Leírás: " + item.FormName + "</li></ul>",
      this.color.getPopUpClass())
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


  ngOnInit() {
    this.firebase.setScreenName('monthly-average');
  }

}
