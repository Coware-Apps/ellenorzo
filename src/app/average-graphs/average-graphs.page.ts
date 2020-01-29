import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Student, evaluation } from '../_models/student';
import { ModalController, AlertController, IonSlides, NavController } from '@ionic/angular';
import * as HighCharts from 'highcharts';
import More from 'highcharts/highcharts-more';
import { ThemeService } from '../_services/theme.service';
import { ColorService } from '../_services/color.service';
import { WeighedAvgCalcService } from '../_services/weighed-avg-calc.service';
import { FormattedDateService } from '../_services/formatted-date.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../_services/data.service';


interface grade {
  grade: number;
  weight: string;
  extraId: number;

  //1-5 ért.
  FormName: string;
  //description
  Mode: string;
  Date: string;

  Theme?: string;
}

interface numWeight {
  numVal: number;
  weight: string;
}

@Component({
  selector: 'app-average-graphs',
  templateUrl: './average-graphs.page.html',
  styleUrls: ['./average-graphs.page.scss'],
})
export class AverageGraphsPage implements OnInit {

  @ViewChild('slides', { static: true }) slides: IonSlides;

  public grades: Array<grade>;
  public forwardInactive: boolean;
  public backwardInactive: boolean;
  public contrast: string;
  public newGrade;
  public newPercent;
  public focused: string;
  public unfilled: boolean;
  public subject: string;
  public student: Student;
  public classValue: number;

  private graphData: number;
  private graphType: string;
  private LineData: Array<number>;
  private ColumnData: Array<number>;
  private graphTextColor;
  private wacData: numWeight[];
  private id: number;
  private fromRoute: string;

  constructor(
    private modalCtrl: ModalController,
    private theme: ThemeService,
    private color: ColorService,
    private wac: WeighedAvgCalcService,
    private alertCtrl: AlertController,
    private fDate: FormattedDateService,
    private router: Router,
    private route: ActivatedRoute,
    private data: DataService,
  ) {
    this.grades = [];
    this.ColumnData = [0, 0, 0, 0, 0];
    this.LineData = [];
    this.graphTextColor = "#000000";
    this.contrast = this.color.getContrast();
    this.wacData = [];
    this.id = 1;
    this.focused = 'gauge';
    this.unfilled = false;
    this.route.queryParams.subscribe(params => {
      this.fromRoute = params["fromRoute"];
    });
    this.student = this.data.getData("student");
    this.subject = this.data.getData("subject");
    this.classValue = this.data.getData("classValue");
  }

  ngOnInit() {
    this.fillStartData();
  }

  fillStartData() {
    for (let i = 0; i < this.student.Evaluations.length; i++) {
      const element = this.student.Evaluations[i];
      if (this.subject == element.Subject && element.NumberValue != 0 && element.Form == "Mark" && element.Type == "MidYear") {
        //grades list
        this.grades.push({ grade: element.NumberValue, weight: element.Weight, extraId: 0, FormName: element.FormName, Mode: element.Mode, Date: element.CreatingTime, Theme: element.Theme });
        //line
        this.LineData.push(element.NumberValue);
        //column
        switch (element.NumberValue) {
          case 1:
            this.ColumnData[0] = this.ColumnData[0] + 1;
            break;

          case 2:
            this.ColumnData[1] = this.ColumnData[1] + 1;
            break;

          case 3:
            this.ColumnData[2] = this.ColumnData[2] + 1;
            break;

          case 4:
            this.ColumnData[3] = this.ColumnData[3] + 1;
            break;

          case 5:
            this.ColumnData[4] = this.ColumnData[4] + 1;
            break;
        }
      }
    }
    for (let i = 0; i < this.student.SubjectAverages.length; i++) {
      if (this.student.SubjectAverages[i].Subject == this.subject && this.student.SubjectAverages[i].Value != 0) {
        this.graphData = this.student.SubjectAverages[i].Value;
      }
    }

    this.LineData.reverse();
  }

  async goBack() {
    this.router.navigateByUrl(this.fromRoute);
  }

  async ionSlideWillChange() {
    let position = await this.slides.getActiveIndex();
    switch (position) {
      case 0:
        this.focused = "gauge";
        break;
      case 1:
        this.focused = "line";
        break;
      case 2:
        this.focused = "column";
        break;
    }
  }

  changeGraph(position: number) {
    this.slides.slideTo(position);
    switch (position) {
      case 0:
        this.focused = "gauge";
        break;
      case 1:
        this.focused = "line";
        break;
      case 2:
        this.focused = "column";
        break;
    }
  }

  addGrade() {
    if (this.newGrade < 6 && this.newGrade > 0 && this.newPercent > 0 && this.newPercent < 350) {
      this.unfilled = false;
      //for the list
      this.grades.push({ grade: this.newGrade, weight: this.newPercent + "%", extraId: this.id, FormName: "", Mode: "", Date: "" });

      //getting new average
      this.wacData = [];
      for (let i = 0; i < this.grades.length; i++) {
        this.wacData.push({ numVal: this.grades[i].grade, weight: this.grades[i].weight })
      }

      this.graphData = Math.round(this.wac.averageNumWeight(this.wacData) * 100) / 100;

      //column
      switch (this.newGrade) {
        case 1:
          this.ColumnData[0] = this.ColumnData[0] + 1;
          break;

        case 2:
          this.ColumnData[1] = this.ColumnData[1] + 1;
          break;

        case 3:
          this.ColumnData[2] = this.ColumnData[2] + 1;
          break;

        case 4:
          this.ColumnData[3] = this.ColumnData[3] + 1;
          break;

        case 5:
          this.ColumnData[4] = this.ColumnData[4] + 1;
          break;
      }

      //line
      this.LineData.push(this.newGrade);

      this.drawGraphTypes('all');
      this.id++;
    } else {
      this.unfilled = true;
    }
  }

  removeGrade(id: number) {
    let toRemove = 0;
    let toRemoveWeight = "";

    for (let i = 0; i < this.grades.length; i++) {
      if (this.grades[i].extraId == id) {
        toRemove = this.grades[i].grade;
        toRemoveWeight = this.grades[i].weight;
        this.grades.splice(i, 1);
        break;
      }
    }

    //getting new average
    for (let i = 0; i < this.wacData.length; i++) {
      if (this.wacData[i].numVal == toRemove && this.wacData[i].weight == toRemoveWeight) {
        this.wacData.splice(i, 1);
        break;
      }
    }

    this.graphData = Math.round(this.wac.averageNumWeight(this.wacData) * 100) / 100;

    //column
    switch (toRemove) {
      case 1:
        this.ColumnData[0] = this.ColumnData[0] - 1;
        break;

      case 2:
        this.ColumnData[1] = this.ColumnData[1] - 1;
        break;

      case 3:
        this.ColumnData[2] = this.ColumnData[2] - 1;
        break;

      case 4:
        this.ColumnData[3] = this.ColumnData[3] - 1;
        break;

      case 5:
        this.ColumnData[4] = this.ColumnData[4] - 1;
        break;
    }

    //line
    for (let i = 0; i < this.LineData.length; i++) {
      if (this.LineData[i] == toRemove) {
        this.LineData.splice(i, 1);
        break;
      }
    }

    this.drawGraphTypes('all');
  }

  ionViewDidEnter() {
    this.drawGraphTypes("all");
  }

  drawGraphTypes(graphType) {
    switch (graphType) {
      case "gauge":
        this.drawGauge();
        break;

      case "line":
        this.drawLine();
        break;

      case "column":
        this.drawColumn();
        break;

      case "all":
        this.drawColumn('column');
        this.drawLine('line');
        this.drawGauge('gauge');
        break;

      default:
        break;
    }
  }

  drawGauge(id: string = 'container') {
    let myChart = HighCharts.chart(id, {

      chart: {
        type: 'gauge',
        plotBackgroundColor: this.color.getChartBgColor(),
        plotBorderWidth: 0,
        plotShadow: false,
        height: 300,
        backgroundColor: this.color.getChartBgColor(),
      },

      plotOptions: {
        gauge: {
          pivot: {
            backgroundColor: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
              stops: [
                [0, this.color.getChartSeriesColor()],
                [1, this.color.getChartSeriesColor()]
              ]
            }
          }
        }
      },

      credits: {
        enabled: false
      },

      title: {
        text: (this.subject + ' átlag'),
        style: {
          color: this.color.getChartTextColor(),
          fontWeight: 'bold'
        }
      },

      pane: {
        startAngle: -135,
        endAngle: 135,
        background: [{
          backgroundColor: {
            linearGradient: {
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 1
            },
            stops: [
              [0, this.color.getChartBgColor()],
              [1, this.color.getChartBgColor()]
            ]
          },
        }]
      },

      // the value axis
      yAxis: {
        min: 1,
        max: 5,

        title: {
        },
        plotBands: [{
          from: 1,
          to: 1.5,
          color: '#f70505' // red
        }, {
          from: 1.5,
          to: 2.5,
          color: '#f75205' // orange
        }, {
          from: 2.5,
          to: 3.5,
          color: '#ffd000' // yellow
        }, {
          from: 3.5,
          to: 4.5,
          color: '#a2ff00' // light green
        }, {
          from: 4.5,
          to: 5,
          color: '#09d102' // green
        }]
      },

      series: [{
        name: 'Átlag',
        data: [this.graphData],
        type: undefined,
        title: 'Átlag',
        dial: {
          backgroundColor: this.color.getChartSeriesColor(),
        },
        //color
        style: {
          color: this.color.getChartTextColor(),
        }
      },
      {
        name: 'Osztályátlag',
        data: [this.classValue],
        type: undefined,
        dial: {
          backgroundColor: this.color.getChartSeriesColor(),
        },
      }],
    });
  }

  drawLine(id: string = 'container') {
    let myChart = HighCharts.chart(id, {
      chart: {
        type: 'line',
        //color
        backgroundColor: this.color.getChartBgColor(),
      },
      credits: {
        enabled: false
      },
      title: {
        text: (this.subject + ' átlag'),
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
            value: this.graphData,
            color: this.color.getChartPlotLineColor(0),
            width: 2,
            zIndex: 3,
            dashStyle: "Dash",
            label: {
              text: 'Átlag',
              //color
              style: {
                color: this.color.getChartTextColor(),
              }
            }
          },
          {
            value: this.classValue,
            color: this.color.getChartPlotLineColor(1),
            width: 2,
            zIndex: 2,
            dashStyle: "Dot",
            label: {
              text: 'Osztályátlag',
              //textAlign doesn't work but is needed to use x offset
              textAlign: 'left',
              x: 90,
              //color
              style: {
                color: this.color.getChartTextColor(),
              }
            }
          }
        ]
      },
      series: [{
        type: undefined,
        name: 'Jegyek',
        data: this.LineData,
        zIndex: 3,
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

  drawColumn(id: string = 'container') {
    let myChart = HighCharts.chart(id, {
      chart: {
        type: 'column',
        //color
        backgroundColor: this.color.getChartBgColor(),
      },
      credits: {
        enabled: false
      },
      title: {
        text: (this.subject + ' átlag'),
        //color
        style: {
          color: this.color.getChartTextColor(),
          fontWeight: 'bold'
        }
      },
      xAxis: {
        categories: ['1', '2', '3', '4', '5'],
      },
      yAxis: {
        title: {
          text: 'Darabszám',
          //color
          style: {
            color: this.color.getChartTextColor(),
            fontWeight: 'bold'
          }
        }
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true
          },
          //color
          color: this.color.getChartSeriesColor(),
        }
      },
      series: [{
        name: 'Jegyek',
        data: this.ColumnData,
        zIndex: 3,
        type: undefined
      }],
      //color
      legend: {
        itemStyle: {
          color: this.color.getChartTextColor(),
        },
      }
    });
  }

  themeIf(theme: string) {
    if (theme == null || theme == "") {
      return "";
    } else {
      return " - " + theme;
    }
  }

  showAlert(item: grade) {
    let date = new Date(item.Date);
    let formattedDate = this.fDate.formatDate(date);
    let time = date.getHours() + ":" + date.getMinutes();
    this.presentAlert(item.grade + this.themeIf(item.Theme), item.weight,
      "<ul>" +
      "<li>Dátum: " + formattedDate + "</li>" +
      "<li>Létrehozva: " + time + "</li>" +
      "<li>Típus: " + item.Mode + "</li>" +
      "<li>Leírás: " + item.FormName + "</li></ul>", this.color.getPopUpClass())
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