import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ModalController, IonSlides } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { ActivatedRoute, Router } from '@angular/router';
import { ColorService } from '../_services/color.service';
import * as HighCharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import { promise } from 'protractor';
import { Observable, BehaviorSubject } from 'rxjs';
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

  public p = this;


  constructor(
    public colorService: ColorService,

    private storage: Storage,
    private router: Router,
    private Route: ActivatedRoute,
  ) {
    this.color = "#FFFFFF";
    this.focused = 0;
    this.title = "A hónap jegyei";
  }

  async ngOnInit() {
    let a;
    let color = (a = await this.storage.get('cardColor')) != null ? a : "&&&&&";

    this.fiveColor = color.split('&')[0] != "" ? color.split('&')[0] : "#00CC66";
    this.fourColor = color.split('&')[1] != "" ? color.split('&')[1] : "#FFFF66";
    this.threeColor = color.split('&')[2] != "" ? color.split('&')[2] : "#FF9933";
    this.twoColor = color.split('&')[3] != "" ? color.split('&')[3] : "#663300";
    this.oneColor = color.split('&')[4] != "" ? color.split('&')[4] : "#FF0000";
    this.noneColor = color.split('&')[5] != "" ? color.split('&')[5] : "#9933FF";
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

  getData(day: number) {
    this.focused = day;
    this.slides.slideTo(day);
    switch (day) {
      case 0:
        this.title = "Főoldal";
        break;
      case 1:
        this.title = "Átlagok";
        break;
      case 2:
        this.title = "Értékelések";
        this.ionViewDidEnter();
        break;
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
        break;
      case 4:
        this.fourColor = this.color;
        break;
      case 3:
        this.threeColor = this.color;
        break;
      case 2:
        this.twoColor = this.color;
        break;
      case 1:
        this.oneColor = this.color;
        break;
      case 0:
        this.noneColor = this.color;
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