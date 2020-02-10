import { Component, OnInit } from '@angular/core';
import { KretaService } from 'src/app/_services/kreta.service';
import { Storage } from '@ionic/storage';
import { FormattedDateService } from 'src/app/_services/formatted-date.service';
import { ColorService } from 'src/app/_services/color.service';
import * as HighCharts from 'highcharts';
import { AppService } from 'src/app/_services/app.service';
import { PromptService } from 'src/app/_services/prompt.service';
import { LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
interface TestData {
  UA: string;
  data: number[];
  average: number;
}

@Component({
  selector: 'app-user-agent',
  templateUrl: './user-agent.page.html',
  styleUrls: ['./user-agent.page.scss'],
})
export class UserAgentPage implements OnInit {
  public testData: TestData[];
  public currentUA: string;
  public hasItLoaded: boolean;
  constructor(
    public kreta: KretaService,
    private fDate: FormattedDateService,
    private color: ColorService,
    private app: AppService,
    private storage: Storage,
    private prompt: PromptService,
    private loadingCtrl: LoadingController,
    private router: Router,
  ) {
    this.currentUA = this.app.userAgent;
    this.testData = [];
    this.hasItLoaded = false;
  }

  ngOnInit() {

  }

  async saveUA() {
    await this.app.changeConfig('userAgent', this.currentUA);
    this.prompt.toast('User-Agent sikeresen elmentve!', true);
  }

  async testUA() {

    let antiSpamUA = await this.storage.get('antiSpamUA');
    let clickCount = antiSpamUA == null ? 0 : antiSpamUA.split('&')[1];
    let clickCooldownUntil = antiSpamUA == null ? 0 : Number(antiSpamUA.split('&')[0]) + 3600000;
    clickCount++;
    let canClick: boolean = false;

    if (antiSpamUA == null) {
      //not yet set, the user has never clicked it
      canClick = true;
      console.log('[ANTISPAM] Can click, has never clicked before');
    } else if (clickCooldownUntil > new Date().valueOf() && clickCount > 5) {
      //we are in the same hour as the last click and in that hour they clicked 5 times
      let now = new Date().valueOf();
      let cooldown = new Date(clickCooldownUntil - now).getMinutes() + ':' + new Date(clickCooldownUntil - now).getSeconds();
      this.prompt.toast('Óránként 5 User-Agent Lab lekérés engedélyezett! (' + cooldown + ')', true);
      console.log('[ANTISPAM] Cant click');
      canClick = false;
    } else {
      console.log('[ANTISPAM] Can click ');
      if (new Date(clickCooldownUntil).valueOf() < new Date().valueOf()) {
        //the one hour cooldown has passed
        clickCount = 1;
      }
      canClick = true;
    }

    //anti-spam
    if (canClick) {
      let loading = await this.loadingCtrl.create({
        message: 'Kréta szerverrel való kommunikáció folyamatban...',
        spinner: "lines",
      });
      await loading.present();
      let currentTest: TestData = {
        UA: this.currentUA,
        data: [],
        average: 0,
      };
      //getting the first day and last day to show
      let weekFirst;
      let weekLast;
      let today = new Date().getDay();
      console.log("today", today);
      if (today == 0 || today == 6) {
        weekFirst = this.fDate.getWeekFirst(1);
        weekLast = this.fDate.getWeekLast(1);
      } else {
        weekFirst = this.fDate.getWeekFirst();
        weekLast = this.fDate.getWeekLast();
      }

      for (let i = 0; i < 5; i++) {
        currentTest.data.push(await this.kreta.getLessonLAB(weekFirst, weekLast, this.currentUA));
        await this.delay(2000);
      }

      let average = 0;
      currentTest.data.forEach(time => {
        average += time;
      })
      average = average / currentTest.data.length;
      currentTest.average = average;

      this.testData.push(currentTest);
      this.hasItLoaded = true;
      this.showLine(this.testData);

      if (clickCount == 5) {
        this.prompt.toast('Óránkénti 5 teszt lekérés limit elérve!', true);
      }
      antiSpamUA = new Date().valueOf() + '&' + clickCount;
      await this.storage.set('antiSpamUA', antiSpamUA);
      await loading.dismiss();
    }
  }

  showLine(lineData: TestData[]) {
    let myChart: HighCharts.Chart;
    let averageSum = 0;
    lineData.forEach(d => {
      averageSum = averageSum + d.average;
    });
    let n = averageSum / this.testData.length;

    for (let i = 0; i < lineData.length; i++) {
      let id = "line";
      if (i == 0) {
        myChart = HighCharts.chart(id, {
          chart: {
            type: 'line',
            //color
            backgroundColor: this.color.getChartBgColor(),
          },
          credits: {
            enabled: false
          },
          title: {
            text: "KRÉTA válaszidő User-Agent alapján",
            //color
            style: {
              color: this.color.getChartTextColor(),
              fontWeight: 'bold'
            }
          },
          xAxis: {

          },
          yAxis: {
            min: 0,
            title: {
              text: 'Idő [ms]',
              //color
              style: {
                color: this.color.getChartTextColor(),
                fontWeight: 'bold'
              }
            },
            plotLines: [
              {
                value: n,
                color: this.color.getChartPlotLineColor(0),
                width: 2,
                zIndex: 2,
                dashStyle: "Dash",
                label: {
                  text: 'Átlag lekérési idő',
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
            name: lineData[i].UA,
            data: lineData[i].data,
            width: 5,
            zIndex: 3,
          }],
          //color
          legend: {
            itemStyle: {
              color: this.color.getChartTextColor(),
            },
          }
        });
      } else {
        myChart.addSeries({
          type: undefined,
          name: lineData[i].UA,
          data: lineData[i].data,
          width: 5,
          zIndex: 3,
        }, true);
      }
    }
  }

  resetUA() {
    this.currentUA = this.app.getStockUserAgent();
    this.storage.set('userAgent', this.currentUA);
  }

  goBack() {
    this.router.navigate(['settings']);
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
