import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ModalController, IonSlides, MenuController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ActivatedRoute, Router } from '@angular/router';
import { ColorService } from '../_services/color.service';
import * as HighCharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import { promise } from 'protractor';
import { Observable, BehaviorSubject } from 'rxjs';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
more(HighCharts);

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.page.html',
  styleUrls: ['./color-picker.page.scss'],
})
export class ColorPickerPage implements OnInit {

  @ViewChild('slides', { static: true }) slides: IonSlides;

  public color: string;
  public fiveColor: string;
  public fourColor: string;
  public threeColor: string;
  public twoColor: string;
  public oneColor: string;
  public noneColor: string;
  public focused: number;
  public title: string;


  constructor(
    public colorService: ColorService,

    private storage: Storage,
    private router: Router,
    private Route: ActivatedRoute,
    private firebase: FirebaseX,
    private menuCtrl: MenuController,
  ) {
    this.color = "#00CC00";
    this.focused = 0;
    this.title = "Értékelések";
  }

  async ngOnInit() {
    this.menuCtrl.enable(false);
    let a;
    let color = (a = await this.storage.get('cardColor')) != null ? a : "&&&&&";

    this.fiveColor = this.colorService.cardColors.fiveColor;
    this.fourColor = this.colorService.cardColors.fourColor;
    this.threeColor = this.colorService.cardColors.threeColor;
    this.twoColor = this.colorService.cardColors.twoColor;
    this.oneColor = this.colorService.cardColors.oneColor;
    this.noneColor = this.colorService.cardColors.noneColor;

    this.firebase.setScreenName('color-picker');
  }

  async ionViewDidEnter() {
    var parent = this;
    let myChart = HighCharts.chart('pie_0', {
      chart: {
        type: 'pie',
        //color
        backgroundColor: this.colorService.getChartBgColor(),
      },
      credits: {
        enabled: false
      },
      title: {
        text: "Grafikon",
        //color
        style: {
          color: this.colorService.getChartTextColor(),
          fontWeight: 'bold'
        }
      },
      xAxis: {
      },
      yAxis: {
        title: {
          text: 'Darabszám'
        },
        plotLines: [
          {
            value: 4,
            color: this.colorService.getChartPlotLineColor(0),
            width: 2,
            zIndex: 9999,
            dashStyle: "Dash",
            label: {
              text: 'Átlag',
              //color
              style: {
                color: this.colorService.getChartTextColor(),
              }
            }
          }
        ]
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
            //color
            color: this.colorService.getChartTextColor(),
          },
          events: {
            click: function (event) {
              parent.changeColor(parseInt(event.point.name.substring(0, 1)));
              parent.ionViewDidEnter();
            }.bind(parent)
          },
        },
        pie: {
          colors: [this.fiveColor, this.fourColor, this.threeColor, this.twoColor, this.oneColor]
        }
      },
      series: [{
        type: undefined,
        name: 'Jegyek',
        data: [{
          name: '5-ös',
          y: 30,
        },
        {
          name: '4-es',
          y: 20,
        },
        {
          name: '3-as',
          y: 15,
        },
        {
          name: '2-es',
          y: 10,
        },
        {
          name: '1-es',
          y: 5,
        },
        ],
        width: 5,
        zIndex: 3
      },],
    });
  }

  async ionViewWillLeave() {
    await this.menuCtrl.enable(true)
  }

  async ionSlideWillChange() {
    this.focused = await this.slides.getActiveIndex();
    switch (this.focused) {
      case 0:
        this.title = "Értékelések";
        break;
      case 1:
        this.title = "Átlagok";
        break;
      case 2:
        this.title = "Statisztikák";
        this.ionViewDidEnter();
        break;
    }
  }

  async getData(day: number) {
    if (await this.slides.getActiveIndex() == this.focused) {
      //the segment's ionChange event wasn't fired by a slide moving
      this.focused = day;
      this.slides.slideTo(day);
      switch (day) {
        case 0:
          this.title = "Értékelések";
          break;
        case 1:
          this.title = "Átlagok";
          break;
        case 2:
          this.title = "Statisztikák";
          this.ionViewDidEnter();
          break;
      }
    }
  }

  setColor(color: string) {
    this.color = color;
  }

  returnColor(grade: number) {
    switch (grade) {
      case 5:
        return this.fiveColor;
        break;
      case 4:
        return this.fourColor;
        break;
      case 3:
        return this.threeColor;
        break;
      case 2:
        return this.twoColor;
        break;
      case 1:
        return this.oneColor;
        break;
      case 0:
        return this.noneColor;
        break;
    }
  }

  async changeColor(grade: number) {
    switch (grade) {
      case 5:
        this.fiveColor = this.color;
        this.colorService.cardColors.fiveColor = this.color;
        await this.storage.set('cardColor', this.colorService.cardColors);
        break;
      case 4:
        this.fourColor = this.color;
        this.colorService.cardColors.fourColor = this.color;
        await this.storage.set('cardColor', this.colorService.cardColors);
        break;
      case 3:
        this.threeColor = this.color;
        this.colorService.cardColors.threeColor = this.color;
        await this.storage.set('cardColor', this.colorService.cardColors);
        break;
      case 2:
        this.twoColor = this.color;
        this.colorService.cardColors.twoColor = this.color;
        await this.storage.set('cardColor', this.colorService.cardColors);
        break;
      case 1:
        this.oneColor = this.color;
        this.colorService.cardColors.oneColor = this.color;
        await this.storage.set('cardColor', this.colorService.cardColors);
        break;
      case 0:
        this.noneColor = this.color;
        this.colorService.cardColors.noneColor = this.color;
        await this.storage.set('cardColor', this.colorService.cardColors);
        break;
    }
  }

  async goBack() {
    await this.storage.set('cardColor', this.fiveColor + "&" + this.fourColor + "&" + this.threeColor + "&" + this.twoColor + "&" + this.oneColor + "&" + this.noneColor);
    this.Route.queryParams.subscribe(params => {
      this.router.navigateByUrl(params["from"]);
    })
  }

}
