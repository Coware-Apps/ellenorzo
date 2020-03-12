import { Component, OnInit, ViewChild } from '@angular/core';
import { Student, evaluation } from '../_models/student';
import { Storage } from '@ionic/storage';
import { DataService } from '../_services/data.service';
import { Router } from '@angular/router';
import { IonSlides, IonSelect } from '@ionic/angular';
import { WeighedAvgCalcService } from '../_services/weighed-avg-calc.service';
import * as HighCharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import { Subscription } from 'rxjs';
import { ColorService } from '../_services/color.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { UserManagerService } from '../_services/user-manager.service';
import { TranslateService } from '@ngx-translate/core';
more(HighCharts);

interface ChartData {
  title: string;
  data: number[];
  average: number;
  numOfGrades: number;
  subject: string;
}
interface selectorEvent {
  detail: {
    value: string;
  }
}

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss']
})
export class StatisticsPage implements OnInit {

  //for the selector
  customPopoverOptions: any = {
    subHeader: this.translator.instant('pages.statistics.categorySelector.subHeader'),
    message: this.translator.instant('pages.statistics.categorySelector.message'),
    cssClass: this.color.getPopUpClass(),
  };

  @ViewChild('slides', { static: true }) slides: IonSlides;
  @ViewChild('categorySelector', null) categorySelector: IonSelect;

  public sans: boolean;
  public focused: number;
  //how many graphs are we showing
  public howMany: number;
  public lineData: ChartData[];
  public columnData: ChartData[];
  public pieData: ChartData[];
  public showGraphs: boolean;
  public filled = false;
  //we literate through this when printing data
  public dataArray: number[];
  public selected: string;
  public showProgressBar: boolean;

  private evaluations: evaluation[];
  private studentSubscription: Subscription;
  private reloaderSubscription: Subscription;
  private mockSelector: selectorEvent;

  constructor(
    public student: Student,
    public wAC: WeighedAvgCalcService,

    private storage: Storage,
    private dataService: DataService,
    private navRouter: Router,
    private color: ColorService,
    private firebase: FirebaseX,
    private userManager: UserManagerService,
    private translator: TranslateService,
  ) {
    this.focused = 0;
    this.mockSelector = { detail: { value: "yearly" } };
    this.filled = false;
    this.dataArray = [0];
    this.showGraphs = false;
    this.selected = "yearly";
    this.showProgressBar = true;
  }

  async ngOnInit() {
    this.firebase.setScreenName('statistics');
  }

  async ionViewDidEnter() {
    await this.loadData();
    this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
      if (value == 'reload') {
        this.sans = true;
        this.showProgressBar = true;
        this.studentSubscription.unsubscribe();
        this.loadData();
      }
    });
  }
  private async loadData() {
    this.sans = true;
    this.showProgressBar = true;
    this.selected = "yearly";
    this.studentSubscription = this.userManager.currentUser.student.subscribe(subscriptionData => {
      if (subscriptionData.type == "skeleton") {
        //there is no data in the storage, showing skeleton text until the server responds
      } else if (subscriptionData.type == "placeholder") {
        //there is data in the storage, showing that data until the server responds, disabling skeleton text
        this.evaluations = subscriptionData.data.Evaluations;
        this.selectorChanged(this.mockSelector, true, true);
        this.sans = false;
      } else {
        //the server has now responded, disabling progress bar and skeleton text if it's still there
        this.evaluations = subscriptionData.data.Evaluations;
        this.selectorChanged(this.mockSelector, true, true);
        this.showProgressBar = false;
        this.sans = false;
      }
    });
    await this.userManager.currentUser.initializeStudent();
  }

  ionViewWillLeave() {
    this.studentSubscription.unsubscribe();
    this.reloaderSubscription.unsubscribe();
  }

  async ionSlideWillChange() {
    this.focused = await this.slides.getActiveIndex();
  }

  openCategorySelector(event: UIEvent) {
    this.categorySelector.open(event);
  }

  async getData(event: any) {
    if (await this.slides.getActiveIndex() == this.focused) {
      //the segment's ionChange event wasn't fired by a slide moving
      let day = event.detail.value;
      this.focused = day;
      this.slides.slideTo(day);
    }
  }

  async doRefresh(event: any) {
    this.showProgressBar = true;
    await this.userManager.currentUser.updateStudent();
    event.target.complete();
  }

  //help for migration
  async selectorChanged(event, draw: boolean = false, fill: boolean = true) {
    //if draw is true, it will draw the graphs, if not it will only fill the data accordingly
    if (fill) {
      var date = new Date();
      switch (event.detail.value) {
        case "yBySubject":
          this.dataService.setData("statisticsData", this.evaluations);
          this.dataService.setData("statisticsType", "line-column-buttons");
          this.dataService.setData("statisticsGrouping", true);
          this.dataService.setData("graphTitle", this.translator.instant('pages.statistics.averageGraphsFullYearTitle'));
          this.navRouter.navigateByUrl('/graphs');
          break;
        case "yearly":
          this.fillChartData(
            this.evaluations,
            this.translator.instant('pages.statistics.yearlyTitle'),
            false
          );
          break;
        case "mBySubject":
          this.dataService.setData("statisticsData", this.filter(date, this.evaluations));
          this.dataService.setData("statisticsType", "line-column-buttons");
          this.dataService.setData("statisticsGrouping", true);
          this.dataService.setData("graphTitle", (date.getMonth() + 1) + ". " + this.translator.instant('pages.statistics.averageGraphMonthTitle'));
          this.navRouter.navigateByUrl('/graphs');
          break;
        case "monthly":
          this.fillChartData(
            this.filter(new Date(), this.evaluations),
            this.translator.instant('pages.statistics.yearlyTitle'),
            false);
          break;
      }
      this.filled = true;
      this.showGraphs = true;
    }

    if (draw) {
      this.showLine(this.lineData);
      this.showColumn(this.columnData);
      this.showPie(this.pieData);
    }
  }

  filter(date: Date, evaluations: evaluation[]) {
    //returns the evaluations from the current month
    let monthlyEval: Array<evaluation> = [];
    for (let i = 0; i < evaluations.length; i++) {
      if (parseInt(evaluations[i].Date.split('-')[1]) == date.getMonth() + 1) {
        monthlyEval.push(evaluations[i]);
      }
    }
    return monthlyEval;
  }

  fillChartData(evaluations: evaluation[], title: string, grouping: boolean) {
    //fills linedata, columndata, piedata with according data
    this.lineData = [];
    this.columnData = [];
    this.pieData = [];
    if (grouping) {

    }
    else {
      let lineData: number[] = [];
      let pieAndColumnData: number[] = [0, 0, 0, 0, 0]
      let average: number = this.wAC.average(evaluations);
      let numOfGrades: number = 0;

      for (let i = 0; i < evaluations.length; i++) {
        const element = evaluations[i];
        if (element.Form == 'Mark' && element.Type == 'MidYear' && element.NumberValue != null) {
          lineData.push(element.NumberValue);
          numOfGrades++;
          switch (element.NumberValue) {
            case 5:
              pieAndColumnData[0]++;
              break;
            case 4:
              pieAndColumnData[1]++;
              break;
            case 3:
              pieAndColumnData[2]++;
              break;
            case 2:
              pieAndColumnData[3]++;
              break;
            case 1:
              pieAndColumnData[4]++;
              break;
          }
        }
      }

      lineData.reverse();

      this.lineData.push({ title: title, data: lineData, average: average, numOfGrades: numOfGrades, subject: "" });
      this.columnData.push({ title: title, data: pieAndColumnData, average: average, numOfGrades: numOfGrades, subject: "" });
      this.pieData.push({ title: title, data: pieAndColumnData, average: average, numOfGrades: numOfGrades, subject: "" });

      //filling literator for printing
      this.dataArray = [];
      for (let i = 0; i < this.pieData.length; i++) {
        this.dataArray.push(i);
      }
      this.showGraphs = true;
    }
  }

  //migrating from graphs

  groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
      const key = keyGetter(item);
      const collection = map.get(key);
      if (!collection) {
        map.set(key, [item]);
      } else {
        collection.push(item);
      }
    });
    return map;
  }

  showLine(lineData: ChartData[]) {
    //draws line charts lineData.length times with lineData (div container id syntax: line_<number>)
    for (let i = 0; i < lineData.length; i++) {
      let id = "line" + i;
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
          text: lineData[i].title,
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
            text: this.translator.instant('graphs.evaluations.line.yText'),
            //color
            style: {
              color: this.color.getChartTextColor(),
              fontWeight: 'bold'
            }
          },
          plotLines: [
            {
              value: lineData[i].average,
              color: this.color.getChartPlotLineColor(0),
              width: 2,
              zIndex: 2,
              dashStyle: "Dash",
              label: {
                text: this.translator.instant('graphs.evaluations.line.averageText'),
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
          name: this.translator.instant('graphs.evaluations.line.seriesName'),
          data: lineData[i].data,
          width: 5,
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
  }

  showColumn(columnData: ChartData[]) {
    //draws column charts columnData.length times with columnData (div container id syntax: column_<number>)
    for (let i = 0; i < columnData.length; i++) {
      const element = columnData[i];
      let myChart = HighCharts.chart('column_' + i, {
        chart: {
          type: 'column',
          //color
          backgroundColor: this.color.getChartBgColor(),
        },
        credits: {
          enabled: false
        },
        title: {
          text: element.title,
          //color
          style: {
            color: this.color.getChartTextColor(),
            fontWeight: 'bold'
          }
        },
        xAxis: {
          categories: ['5', '4', '3', '2', '1'],
        },
        yAxis: {
          title: {
            text: this.translator.instant('graphs.evaluations.column.yText'),
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
          name: this.translator.instant('graphs.evaluations.column.seriesName'),
          data: element.data,
          width: 5,
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
  }

  returnPieColors(): string[] {
    let returnVal: string[] = [];
    for (const key in this.color.cardColors) {
      if (this.color.cardColors.hasOwnProperty(key)) {
        const element = this.color.cardColors[key];
        returnVal.push(element);
      }
    }
    return returnVal;
  }
  async showPie(pieData: ChartData[]) {
    //draws pie charts pieData.length times with pieData (div container id syntax: pie_<number>)

    for (let i = 0; i < pieData.length; i++) {
      const element = pieData[i];
      let myChart = HighCharts.chart('pie_' + i, {
        chart: {
          type: 'pie',
          //color
          backgroundColor: this.color.getChartBgColor(),
        },
        credits: {
          enabled: false
        },
        title: {
          text: element.title,
          //color
          style: {
            color: this.color.getChartTextColor(),
            fontWeight: 'bold'
          }
        },
        xAxis: {
        },
        yAxis: {
          title: {
            text: this.translator.instant('graphs.evaluations.pie.yText'),
          }
        },
        plotOptions: {
          series: {
            dataLabels: {
              enabled: true,
              format: '<b>{point.name}</b>: {point.percentage:.1f} %',
              color: this.color.getChartTextColor(),
            }
          },
          pie: {
            colors: this.returnPieColors(),
          }
        },
        series: [{
          type: undefined,
          name: this.translator.instant('graphs.evaluations.pie.seriesName'),
          data: [{
            name: this.translator.instant('graphs.evaluations.pie.5Text'),
            y: element.data[0],
          },
          {
            name: this.translator.instant('graphs.evaluations.pie.4Text'),
            y: element.data[1],
          },
          {
            name: this.translator.instant('graphs.evaluations.pie.3Text'),
            y: element.data[2],
          },
          {
            name: this.translator.instant('graphs.evaluations.pie.2Text'),
            y: element.data[3],
          },
          {
            name: this.translator.instant('graphs.evaluations.pie.1Text'),
            y: element.data[4],
          },
          ],
          width: 5,
          zIndex: 3
        },],
      });
    }
  }
}
