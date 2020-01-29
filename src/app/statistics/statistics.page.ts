import { Component, OnInit, ViewChild } from '@angular/core';
import { FormattedDateService } from '../_services/formatted-date.service';
import { Student, evaluation } from '../_models/student';
import { Storage } from '@ionic/storage';
import { DataService } from '../_services/data.service';
import { Router } from '@angular/router';
import { ThemeService } from '../_services/theme.service';
import { KretaService } from '../_services/kreta.service';
import { IonSlides } from '@ionic/angular';
import { WeighedAvgCalcService } from '../_services/weighed-avg-calc.service';
import * as HighCharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import { BehaviorSubject } from 'rxjs';
import { ColorService } from '../_services/color.service';
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
    subHeader: 'Megjelenítés',
    message: 'Válaszd ki milyen adatok jelenjenek meg a grafikonokon!',
    cssClass: this.color.getPopUpClass(),
  };

  @ViewChild('slides', { static: true }) slides: IonSlides;

  public sans: boolean;
  public focused: number;
  public title: string;
  //how many graphs are we showing
  public howMany: number;
  public lineData: ChartData[];
  public columnData: ChartData[];
  public pieData: ChartData[];
  public showGraphs: boolean;
  public filled = false;
  //we literate through this when printing data
  public dataArray: number[];
  loader = new BehaviorSubject("init");
  public selected: string;

  private evaluations: evaluation[];
  private mockSelector: selectorEvent;

  constructor(
    public student: Student,
    public wAC: WeighedAvgCalcService,

    private kretaService: KretaService,
    private dateService: FormattedDateService,
    private storage: Storage,
    private dataService: DataService,
    private navRouter: Router,
    private theme: ThemeService,
    private color: ColorService,
  ) {
    this.focused = 0;
    this.title = "Vonal";
    this.mockSelector = { detail: { value: "yearly" } };
    this.filled = false;
    this.dataArray = [0];
    this.showGraphs = false;
    this.selected = "yearly";
  }

  async ngOnInit() {
    this.loader.next("ngOnInit");
    this.sans = true;
    this.student = await this.kretaService.getStudent(this.dateService.getDate("thisYearBegin"), this.dateService.getDate("today"));
    this.evaluations = this.student.Evaluations;
    this.selectorChanged(this.mockSelector, false, true);
    this.sans = false;
    this.loader.next("initialized");
  }

  async ionViewDidEnter() {
    this.loader.subscribe(val => {
      if (val == "initialized") {
        this.selectorChanged(this.mockSelector, true, false);
        this.loader.next("drawn");
      }
    });
  }

  async ionSlideWillChange() {
    this.focused = await this.slides.getActiveIndex();
    switch (this.focused) {
      case 0:
        this.title = "Vonal";
        break;
      case 1:
        this.title = "Oszlop";
        break;
      case 2:
        this.title = "Kör";
        break;
    }
  }

  getData(day: number) {
    this.focused = day;
    this.slides.slideTo(day);
    switch (day) {
      case 0:
        this.title = "Vonal";
        break;
      case 1:
        this.title = "Oszlop";
        break;
      case 2:
        this.title = "Kör";
        break;
    }
  }

  //help for migration
  async selectorChanged(event, draw: boolean = false, fill: boolean = true) {
    //if draw is true, it will draw the graphs, if not it will only fill the data accordingly
    if (fill) {
      var date = new Date();
      switch (event.detail.value) {
        case "yBySubject":
          this.dataService.setData("statisticsData", this.student.Evaluations);
          this.dataService.setData("statisticsType", "line-column-buttons");
          this.dataService.setData("statisticsGrouping", true);
          this.dataService.setData("graphTitle", date.getFullYear());
          this.navRouter.navigateByUrl('/graphs');
          break;
        case "yearly":
          this.fillChartData(this.evaluations, "Éves összesített statisztika", false);
          break;
        case "mBySubject":
          this.dataService.setData("statisticsData", this.filter(date, this.evaluations));
          this.dataService.setData("statisticsType", "line-column-buttons");
          this.dataService.setData("statisticsGrouping", true);
          this.dataService.setData("graphTitle", (date.getMonth() + 1) + ". hónap");
          this.navRouter.navigateByUrl('/graphs');
          break;
        case "monthly":
          this.fillChartData(this.filter(new Date(), this.evaluations), "Havi összesített statisztika", false);
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
      let average: number = this.wAC.average(this.evaluations);
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
            text: 'Értékelés',
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
          type: undefined,
          name: 'Jegyek',
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

  returnPieColors(colors: string[]): string[] {
    let changedColors: string[] = [];

    for (let i = 0; i < colors.length; i++) {
      if (colors[i] == "") {
        switch (i) {
          case 0:
            changedColors[0] = "#00CC66";
            break;
          case 1:
            changedColors[1] = "#FFFF66";
            break;
          case 2:
            changedColors[2] = "#FF9933";
            break;
          case 3:
            changedColors[3] = "#663300";
            break;
          case 4:
            changedColors[4] = "#FF0000";
            break;
        }
      } else {
        changedColors[i] = colors[i];
      }
    }
    return changedColors;

  }
  async showPie(pieData: ChartData[]) {
    //draws pie charts pieData.length times with pieData (div container id syntax: pie_<number>)
    let a;
    let colors = (a = await this.storage.get('cardColor')) != null ? a : "&&&&&";
    colors = colors.split("&");

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
            text: 'Darabszám'
          },
          plotLines: [
            {
              value: element.average,
              color: "red",
              width: 2,
              zIndex: 9999,
              dashStyle: "Dash",
              label: {
                text: 'Átlag'
              }
            }
          ]
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
            colors: this.returnPieColors(colors),
          }
        },
        series: [{
          type: undefined,
          name: 'Jegyek',
          data: [{
            name: '5-ös',
            y: element.data[0],
          },
          {
            name: '4-es',
            y: element.data[1],
          },
          {
            name: '3-as',
            y: element.data[2],
          },
          {
            name: '2-es',
            y: element.data[3],
          },
          {
            name: '1-es',
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
