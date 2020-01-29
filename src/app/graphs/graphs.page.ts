import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../_services/data.service';
import * as HighCharts from 'highcharts';
import { evaluation } from '../_models/student';
import { WeighedAvgCalcService } from '../_services/weighed-avg-calc.service';
import more from 'highcharts/highcharts-more';
import { IonSlides } from '@ionic/angular';
import { ColorService } from '../_services/color.service';
more(HighCharts);

export interface subjectWithGrade {
  subjectName: string;
  grade: grade;
}

export interface grade {
  numVal: number;
  weight: string;
}

@Component({
  selector: 'app-graphs',
  templateUrl: './graphs.page.html',
  styleUrls: ['./graphs.page.scss'],
})
export class GraphsPage implements OnInit {
  //Why you might ask? Because it can't be empty. Typescript.
  @ViewChild('slides', { static: true }) slides: IonSlides;
  private unGroupedGrades: Array<subjectWithGrade> = [{ subjectName: '', grade: { numVal: 1, weight: '' } }];

  public helper: Array<string> = [];
  public subjectCount: number = 0;
  public howMany: Array<number> = [];
  public howManyGrades: number = 0;
  public title: string;
  public average: number
  public graphTitle: string;
  public groupedGrades: any;
  public linecolumn: boolean;
  public focused: number;
  public lineColumnButtons: boolean;
  public active: string;
  public months: string[];

  evaluations: Array<evaluation> = [];
  statisticsType: string;
  statisticsGrouping: boolean;

  constructor(
    public wAC: WeighedAvgCalcService,

    private dataService: DataService,
    private color: ColorService,
  ) {
    this.focused = 0;
    this.lineColumnButtons = false;
    this.months = ['január', "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
  }


  //groupBy
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

  async ngOnInit() {
    this.evaluations = await this.dataService.getData("statisticsData");
    this.statisticsType = await this.dataService.getData("statisticsType");
    this.statisticsGrouping = await this.dataService.getData("statisticsGrouping");
    this.graphTitle = this.dataService.getData('graphTitle');

    for (let i = 0; i < this.evaluations.length; i++) {

      if (this.evaluations[i].Form == "Mark" && this.evaluations[i].Type == "MidYear") {
        this.howManyGrades++;

        if (this.statisticsGrouping) {
          //I swear I will kill whoever made this shit to work like this.
          this.unGroupedGrades[i] = { subjectName: 'placeHolder', grade: { numVal: 1, weight: '' } };
          this.unGroupedGrades[i].grade.numVal = this.evaluations[i].NumberValue;
          this.unGroupedGrades[i].grade.weight = this.evaluations[i].Weight;
          this.unGroupedGrades[i].subjectName = this.evaluations[i].Subject;
        }

        if (!this.helper.includes(this.evaluations[i].Subject)) {
          this.helper.push(this.evaluations[i].Subject);
          this.subjectCount++;
        }
      }
    }

    if (this.statisticsGrouping) {
      this.howMany = Array(this.subjectCount).fill(0).map((x, i) => i);
      //grouping the grades
      this.groupedGrades = this.groupBy(this.unGroupedGrades, entry => entry.subjectName)
    }
    else {
      this.howMany = Array(1).fill(0).map((x, i) => i);
      this.title = "Összátlag: ";
    }
  }

  ionViewDidEnter() {
    this.chartSwitch(this.statisticsType);
  }

  chartSwitch(statisticsType: string) {
    switch (statisticsType) {
      case "line":
        this.active = "line";
        this.showLine(this.evaluations, this.statisticsGrouping);
        break;
      case "column":
        this.active = "column";
        this.showColumn(this.evaluations, this.statisticsGrouping);
        break;
      case "pie":
        this.showPie(this.evaluations, this.statisticsGrouping);
        break;
      case "line-column":
        this.linecolumn = true;
        this.showColumn(this.evaluations, this.statisticsGrouping);
        this.showLine(this.evaluations, this.statisticsGrouping);
        break;
      case "line-column-buttons":
        this.showLine(this.evaluations, this.statisticsGrouping);
        this.lineColumnButtons = true;
        this.active = "line";
        break;
    }
  }

  getNumVals(subjectKey: string) {
    let returnVal: string[] = [];
    for (let i = 0; i < this.groupedGrades.get(subjectKey).length; i++) {
      const element = this.groupedGrades.get(subjectKey)[i];
      returnVal.push(element.grade.numVal);
    }
    return returnVal;
  }

  getAvg(subjectKey: string) {
    let returnVal: grade[] = [];
    for (let i = 0; i < this.groupedGrades.get(subjectKey).length; i++) {
      const element = this.groupedGrades.get(subjectKey)[i];
      returnVal.push(element.grade);
    }
    return Math.round(this.wAC.averageNumWeight(returnVal) * 100) / 100;;
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

  showLine(evaluations: evaluation[], grouping: boolean) {
    if (grouping && !this.linecolumn) {
      for (let i = 0; i < this.helper.length; i++) {
        let myChart = HighCharts.chart(this.helper[i], {
          chart: {
            type: 'line',
            //color
            backgroundColor: this.color.getChartBgColor(),
          },
          credits: {
            enabled: false
          },
          title: {
            text: this.helper[i] + " (" + this.graphTitle + ")",
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
              text: 'Értékelés',
              //color
              style: {
                color: this.color.getChartTextColor(),
                fontWeight: 'bold'
              }
            },
            min: 1,
            max: 5,
            plotLines: [
              {
                value: this.getAvg(this.helper[i]),
                color: "red",
                width: 2,
                zIndex: 2,
                dashStyle: "Dash",
                label: {
                  text: 'Átlag'
                }
              }
            ]
          },
          series: [{
            type: undefined,
            name: 'Jegyek',
            data: this.getNumVals(this.helper[i]).reverse(),
            //color
            color: this.color.getChartSeriesColor(),
            width: 5,
            zIndex: 3
          }],
          legend: {
            itemStyle: {
              color: this.color.getChartTextColor(),
            },
          }
        });
      }
    }
    else if (!grouping && !this.linecolumn) {
      let xData: Array<number> = [];
      let average: number;
      //series
      for (let i = 0; i < evaluations.length; i++) {
        if (evaluations[i].Form == "Mark" && evaluations[i].Type == "MidYear" && evaluations[i].NumberValue != null) {
          xData.push(evaluations[i].NumberValue);
        }
      }

      //average
      average = this.wAC.average(evaluations);
      this.average = Math.round(average * 100) / 100;

      let myChart = HighCharts.chart('container', {
        chart: {
          type: 'line'
        },
        credits: {
          enabled: false
        },
        title: {
          text: this.graphTitle
        },
        xAxis: {
        },
        yAxis: {
          title: {
            text: 'Értékelés'
          },
          plotLines: [
            {
              value: average,
              color: "red",
              width: 2,
              zIndex: 2,
              dashStyle: "Dash",
              label: {
                text: 'Átlag'
              }
            }
          ]
        },
        series: [{
          name: 'Jegyek',
          data: xData,
          width: 5,
          zIndex: 3,
          type: undefined
        }],
      });

    }
    else if (this.linecolumn) {
      for (let i = 0; i < this.helper.length; i++) {
        console.log("[CHARTS] Attempting chart at " + "line_" + this.helper[i]);
        let myChart = HighCharts.chart("line_" + this.helper[i], {
          chart: {
            type: 'line'
          },
          credits: {
            enabled: false
          },
          title: {
            text: this.helper[i] + " (" + this.graphTitle + ")"
          },
          xAxis: {
          },
          yAxis: {
            title: {
              text: 'Értékelés'
            },
            plotLines: [
              {
                value: this.getAvg(this.helper[i]),
                color: "red",
                width: 2,
                zIndex: 2,
                dashStyle: "Dash",
                label: {
                  text: 'Átlag'
                }
              }
            ]
          },
          series: [{
            type: undefined,
            name: 'Jegyek',
            data: this.getNumVals(this.helper[i]).reverse(),
            width: 5,
            zIndex: 3
          }]
        });
      }
    }
  }
  showColumn(evaluations: evaluation[], grouping: boolean) {
    if (grouping && !this.linecolumn) {
      for (let i = 0; i < this.helper.length; i++) {
        let xData: number[] = [0, 0, 0, 0, 0];
        let average: number;
        let dataCollection = this.getNumVals(this.helper[i]);
        //series
        for (let i = 0; i < dataCollection.length; i++) {
          switch (parseInt(dataCollection[i])) {
            case 5:
              xData[0]++;
              break;
            case 4:
              xData[1]++;
              break;
            case 3:
              xData[2]++;
              break;
            case 2:
              xData[3]++;
              break;
            case 1:
              xData[4]++;
              break;
          }
        }

        //average
        average = this.getAvg(this.helper[i]);

        let myChart = HighCharts.chart(this.helper[i], {
          chart: {
            type: 'column',
            //color
            backgroundColor: this.color.getChartBgColor(),
          },
          credits: {
            enabled: false
          },
          title: {
            text: this.helper[i] + " (" + this.graphTitle + ")",
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
            },
          },
          plotOptions: {
            series: {
              dataLabels: {
                enabled: true
              },
              color: this.color.getChartSeriesColor(),
            }
          },
          series: [{
            name: 'Jegyek',
            data: xData,
            width: 5,
            zIndex: 3,
            type: undefined
          }],
          legend: {
            itemStyle: {
              color: this.color.getChartTextColor(),
            },
          }
        });
      }
    }
    else if (!grouping && !this.linecolumn) {
      let xData: number[] = [0, 0, 0, 0, 0];
      let average: number;
      //series
      for (let i = 0; i < evaluations.length; i++) {
        if (evaluations[i].Form == "Mark" && evaluations[i].Type == "MidYear" && evaluations[i].NumberValue != null) {
          switch (evaluations[i].NumberValue) {
            case 5:
              xData[0]++;
              break;
            case 4:
              xData[1]++;
              break;
            case 3:
              xData[2]++;
              break;
            case 2:
              xData[3]++;
              break;
            case 1:
              xData[4]++;
              break;
          }
        }
      }

      //average
      average = this.wAC.average(evaluations);
      this.average = Math.round(average * 100) / 100;

      let myChart = HighCharts.chart('container', {
        chart: {
          type: 'column'
        },
        credits: {
          enabled: false
        },
        title: {
          text: this.graphTitle
        },
        xAxis: {
          categories: ['5', '4', '3', '2', '1'],
        },
        yAxis: {
          title: {
            text: 'Darabszám'
          },
          plotLines: [
            {
              value: average,
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
              enabled: true
            }
          }
        },
        series: [{
          name: 'Jegyek',
          data: xData,
          width: 5,
          zIndex: 3,
          type: undefined
        }],
      });

    } else if (this.linecolumn) {
      for (let i = 0; i < this.helper.length; i++) {
        let xData: number[] = [0, 0, 0, 0, 0];
        let average: number;
        let dataCollection = this.getNumVals(this.helper[i]);
        //series
        for (let i = 0; i < dataCollection.length; i++) {
          switch (parseInt(dataCollection[i])) {
            case 5:
              xData[0]++;
              break;
            case 4:
              xData[1]++;
              break;
            case 3:
              xData[2]++;
              break;
            case 2:
              xData[3]++;
              break;
            case 1:
              xData[4]++;
              break;
          }
        }

        //average
        average = this.getAvg(this.helper[i]);
        console.log("[CHARTS] Attempting chart at " + "column_" + this.helper[i]);

        let myChart = HighCharts.chart("column_" + this.helper[i], {
          chart: {
            type: 'column',
          },
          credits: {
            enabled: false
          },
          title: {
            text: this.helper[i] + " (" + this.graphTitle + ")"
          },
          xAxis: {
            categories: ['5', '4', '3', '2', '1'],
          },
          yAxis: {
            title: {
              text: 'Darabszám'
            }
          },
          plotOptions: {
            series: {
              dataLabels: {
                enabled: true
              }
            }
          },
          series: [{
            name: 'Jegyek',
            data: xData,
            width: 5,
            zIndex: 3,
            type: undefined
          }],
        });
      }
    }
  }
  showPie(evaluations: evaluation[], grouping: boolean) {
    if (grouping) {

    }
    else {
      let xData: number[] = [0, 0, 0, 0, 0];
      let average: number;
      //series
      for (let i = 0; i < evaluations.length; i++) {
        if (evaluations[i].Form == "Mark" && evaluations[i].Type == "MidYear" && evaluations[i].NumberValue != null) {
          switch (evaluations[i].NumberValue) {
            case 5:
              xData[0]++;
              break;
            case 4:
              xData[1]++;
              break;
            case 3:
              xData[2]++;
              break;
            case 2:
              xData[3]++;
              break;
            case 1:
              xData[4]++;
              break;
          }
        }
      }

      //average
      average = this.wAC.average(evaluations);
      this.average = Math.round(average * 100) / 100;

      let myChart = HighCharts.chart('container', {
        chart: {
          type: 'pie',
        },
        credits: {
          enabled: false
        },
        title: {
          text: this.graphTitle
        },
        xAxis: {
        },
        yAxis: {
          title: {
            text: 'Darabszám'
          },
          plotLines: [
            {
              value: average,
              color: this.color.getChartPlotLineColor(0),
              width: 2,
              zIndex: 9999,
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
        plotOptions: {
          series: {
            dataLabels: {
              enabled: true,
              format: '<b>{point.name}</b>: {point.percentage:.1f} %',
              //color
              color: this.color.getChartTextColor(),
            }
          }
        },
        series: [{
          type: undefined,
          name: 'Jegyek',
          data: [{
            name: '5-ös',
            y: xData[0]
          },
          {
            name: '4-es',
            y: xData[1]
          },
          {
            name: '3-as',
            y: xData[2]
          },
          {
            name: '2-es',
            y: xData[3]
          },
          {
            name: '1-es',
            y: xData[4]
          },
          ],
          width: 5,
          zIndex: 3
        },],
      });
    }
  }
}
