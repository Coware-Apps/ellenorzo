import { Component, OnInit, ViewChild } from "@angular/core";
import { DataService } from "../_services/data.service";
import { Router } from "@angular/router";
import { IonSlides, IonSelect } from "@ionic/angular";
import { WeighedAvgCalcService } from "../_services/weighed-avg-calc.service";
import * as HighCharts from "highcharts";
import more from "highcharts/highcharts-more";
import { Subject } from "rxjs";
import { UserManagerService } from "../_services/user-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { HwBackButtonService } from "../_services/hw-back-button.service";
import { takeUntil } from "rxjs/operators";
import { KretaError } from "../_exceptions/kreta-exception";
import { FirebaseService } from "../_services/firebase.service";
import { ThemeService } from "../_services/theme.service";
import { AppService } from "../_services/app.service";
import { Evaluation } from "../_models/kreta-v3/evaluation";
more(HighCharts);

interface ChartData {
    title: string;
    data: number[];
    average: number;
    numOfGrades: number;
    subject: string;
}
interface LineChartData {
    title: string;
    data: Evaluation[];
    average: number;
    numOfGrades: number;
    subject: string;
}
interface selectorEvent {
    detail: {
        value: string;
    };
}

@Component({
    selector: "app-statistics",
    templateUrl: "./statistics.page.html",
    styleUrls: ["./statistics.page.scss"],
})
export class StatisticsPage implements OnInit {
    //for the selector
    customPopoverOptions: any = {
        subHeader: this.translator.instant("pages.statistics.categorySelector.subHeader"),
        message: this.translator.instant("pages.statistics.categorySelector.message"),
        cssClass: this.theme.getPopUpClass(),
    };

    @ViewChild("slides", { static: true }) slides: IonSlides;
    @ViewChild("categorySelector") categorySelector: IonSelect;

    public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
    public focused: number;
    //how many graphs are we showing
    public lineData: LineChartData[];
    public columnData: ChartData[];
    public pieData: ChartData[];
    public showGraphs: boolean;
    public filled = false;
    //we literate through this when printing data
    public dataArray: number[];
    public selected: string;
    public error: KretaError;
    public evaluations: Evaluation[];

    public unsubscribe$: Subject<void>;
    private mockSelector: selectorEvent;

    constructor(
        public wAC: WeighedAvgCalcService,
        public app: AppService,

        private hw: HwBackButtonService,
        private dataService: DataService,
        private navRouter: Router,
        private firebase: FirebaseService,
        private userManager: UserManagerService,
        private translator: TranslateService,
        private theme: ThemeService
    ) {
        this.focused = 0;
        this.mockSelector = { detail: { value: "yearly" } };
        this.filled = false;
        this.dataArray = [0];
        this.showGraphs = false;
        this.selected = "yearly";
    }

    async ngOnInit() {
        this.firebase.setScreenName("statistics");
    }

    async ionViewWillEnter() {
        this.unsubscribe$ = new Subject();
        this.hw.registerHwBackButton(this.unsubscribe$);
        this.userManager.reloader.subscribe(val => {
            if (val == "reload") {
                this.componentState = "loading";
                this.loadData();
            }
        });
        this.loadData();
    }

    loadData(forceRefresh: boolean = false, event?) {
        this.userManager.currentUser
            .getAsyncAsObservableWithCache<[Evaluation[]]>(
                [
                    {
                        name: "getEvaluationsV3",
                        cacheKey: "v3Evaluations",
                        params: [],
                    },
                ],
                forceRefresh
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: d => {
                    this.evaluations = d[0];
                    if (d[0]) {
                        this.evaluations = d[0];
                        this.selectorChanged(this.mockSelector, true, true);
                    }
                },
                complete: () => {
                    if (event) event.target.complete();

                    this.setComponentState();
                },
                error: error => {
                    console.error(error);
                    this.error = error;

                    if (event) event.target.complete();

                    if (!this.evaluations || this.evaluations.length == 0) {
                        this.componentState = "error";
                        error.isHandled = true;
                    } else {
                        this.componentState = "loaded";
                    }
                    throw error;
                },
            });
    }

    private setComponentState() {
        if (!this.evaluations || !this.evaluations) {
            this.componentState = "error";
        } else if (this.evaluations.length == 0) {
            this.componentState = "empty";
        } else {
            this.componentState = "loaded";
        }
    }

    ionViewWillLeave() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    async ionSlideWillChange() {
        this.focused = await this.slides.getActiveIndex();
    }

    openCategorySelector(event: UIEvent) {
        this.categorySelector.open(event);
    }

    async getData(event: any) {
        if ((await this.slides.getActiveIndex()) == this.focused) {
            //the segment's ionChange event wasn't fired by a slide moving
            this.focused = event.detail.value;
            this.slides.slideTo(event.detail.value);
        }
    }

    async doRefresh(event?) {
        if (this.componentState == "error") {
            this.componentState = "loading";
        } else {
            this.componentState = "loadedProgress";
        }
        this.loadData(true, event);
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
                    this.dataService.setData(
                        "graphTitle",
                        this.translator.instant("pages.statistics.averageGraphsFullYearTitle")
                    );
                    this.navRouter.navigateByUrl("/graphs");
                    break;
                case "yearly":
                    this.fillChartData(
                        this.evaluations,
                        this.translator.instant("pages.statistics.yearlyTitle"),
                        false
                    );
                    break;
                case "mBySubject":
                    this.dataService.setData("statisticsData", this.filter(date, this.evaluations));
                    this.dataService.setData("statisticsType", "line-column-buttons");
                    this.dataService.setData("statisticsGrouping", true);
                    this.dataService.setData(
                        "graphTitle",
                        date.getMonth() +
                            1 +
                            ". " +
                            this.translator.instant("pages.statistics.averageGraphMonthTitle")
                    );
                    this.navRouter.navigateByUrl("/graphs");
                    break;
                case "monthly":
                    this.fillChartData(
                        this.filter(new Date(), this.evaluations),
                        this.translator.instant("pages.statistics.yearlyTitle"),
                        false
                    );
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

    filter(date: Date, evaluations: Evaluation[]) {
        //returns the evaluations from the current month
        let monthlyEval: Array<Evaluation> = [];
        for (let i = 0; i < evaluations.length; i++) {
            if (new Date(evaluations[i].KeszitesDatuma).getMonth() == date.getMonth()) {
                monthlyEval.push(evaluations[i]);
            }
        }
        return monthlyEval;
    }

    fillChartData(evaluations: Evaluation[], title: string, grouping: boolean) {
        //fills linedata, columndata, piedata with according data
        this.lineData = [];
        this.columnData = [];
        this.pieData = [];
        if (grouping) {
        } else {
            let lineData: Evaluation[] = [];
            let pieAndColumnData: number[] = [0, 0, 0, 0, 0];
            let average: number = this.wAC.averageV3(evaluations);
            let numOfGrades: number = 0;

            for (let i = 0; i < evaluations.length; i++) {
                const element = evaluations[i];
                if (
                    element.ErtekFajta?.Nev == "Osztalyzat" &&
                    element.Tipus?.Nev == "evkozi_jegy_ertekeles" &&
                    element.SzamErtek
                ) {
                    lineData.push(element);
                    numOfGrades++;
                    switch (element.SzamErtek) {
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

            this.lineData.push({
                title: title,
                data: lineData,
                average: average,
                numOfGrades: numOfGrades,
                subject: "",
            });
            this.columnData.push({
                title: title,
                data: pieAndColumnData,
                average: average,
                numOfGrades: numOfGrades,
                subject: "",
            });
            this.pieData.push({
                title: title,
                data: pieAndColumnData,
                average: average,
                numOfGrades: numOfGrades,
                subject: "",
            });

            //filling literator for printing
            this.dataArray = [];
            for (let i = 0; i < this.pieData.length; i++) {
                this.dataArray.push(i);
            }
            this.showGraphs = true;
        }
    }

    showLine(lineData: LineChartData[] | any[]) {
        //draws line charts lineData.length times with lineData (div container id syntax: line_<number>)
        for (let i = 0; i < lineData.length; i++) {
            let id = "line" + i;
            let myChart = HighCharts.chart(id, {
                chart: {
                    type: "line",
                    //color
                    backgroundColor: this.theme.getChartBgColor(),
                },
                credits: {
                    enabled: false,
                },
                title: {
                    text: lineData[i].title,
                    //color
                    style: {
                        color: this.theme.getChartTextColor(),
                        fontWeight: "bold",
                    },
                },
                xAxis: {},
                yAxis: {
                    min: 1,
                    max: 5,
                    title: {
                        text: this.translator.instant("graphs.evaluations.line.yText"),
                        //color
                        style: {
                            color: this.theme.getChartTextColor(),
                            fontWeight: "bold",
                        },
                    },
                    plotLines: [
                        {
                            value: lineData[i].average,
                            color: this.theme.getChartPlotLineColor(0),
                            width: 2,
                            zIndex: 2,
                            dashStyle: "Dash",
                            label: {
                                text: this.translator.instant(
                                    "graphs.evaluations.line.averageText"
                                ),
                                //color
                                style: {
                                    color: this.theme.getChartTextColor(),
                                },
                            },
                        },
                    ],
                },
                series: [
                    {
                        type: undefined,
                        name: this.translator.instant("graphs.evaluations.line.seriesName"),
                        data: lineData[i].data.map(e => {
                            e.custom = {
                                pointFormat: `<b>${e.Tantargy?.Nev}</b> ${
                                    e.SulySzazalekErteke ? e.SulySzazalekErteke + "%" : "100%"
                                }<br><i>${e.Tema ? e.Tema : ""}</i><br>${new Date(
                                    e.KeszitesDatuma
                                ).toLocaleDateString()}<br>`,
                            };
                            //for the position
                            e.y = e.SzamErtek;
                            return e;
                        }),

                        width: 5,
                        zIndex: 3,
                        color: this.theme.getChartSeriesColor(),
                    },
                ],
                tooltip: {
                    //gotta love highcharts
                    headerFormat: "",
                    pointFormat: "{point.custom.pointFormat}",
                    backgroundColor: "white",
                },
                //color
                legend: {
                    itemStyle: {
                        color: this.theme.getChartTextColor(),
                    },
                },
            });
        }
    }

    showColumn(columnData: ChartData[]) {
        //draws column charts columnData.length times with columnData (div container id syntax: column_<number>)
        for (let i = 0; i < columnData.length; i++) {
            const element = columnData[i];
            let myChart = HighCharts.chart("column_" + i, {
                chart: {
                    type: "column",
                    //color
                    backgroundColor: this.theme.getChartBgColor(),
                },
                credits: {
                    enabled: false,
                },
                title: {
                    text: element.title,
                    //color
                    style: {
                        color: this.theme.getChartTextColor(),
                        fontWeight: "bold",
                    },
                },
                xAxis: {
                    categories: ["5", "4", "3", "2", "1"],
                },
                yAxis: {
                    title: {
                        text: this.translator.instant("graphs.evaluations.column.yText"),
                        //color
                        style: {
                            color: this.theme.getChartTextColor(),
                            fontWeight: "bold",
                        },
                    },
                },
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true,
                        },
                        //color
                        color: this.theme.getChartSeriesColor(),
                    },
                },
                series: [
                    {
                        name: this.translator.instant("graphs.evaluations.column.seriesName"),
                        data: element.data,
                        width: 5,
                        zIndex: 3,
                        type: undefined,
                    },
                ],
                //color
                legend: {
                    itemStyle: {
                        color: this.theme.getChartTextColor(),
                    },
                },
            });
        }
    }

    returnPieColors(): string[] {
        let returnVal: string[] = [];
        for (const key in this.theme.cardColors) {
            if (this.theme.cardColors.hasOwnProperty(key)) {
                const element = this.theme.cardColors[key];
                returnVal.push(element);
            }
        }
        return returnVal;
    }
    async showPie(pieData: ChartData[]) {
        //draws pie charts pieData.length times with pieData (div container id syntax: pie_<number>)

        for (let i = 0; i < pieData.length; i++) {
            const element = pieData[i];
            let myChart = HighCharts.chart("pie_" + i, {
                chart: {
                    type: "pie",
                    //color
                    backgroundColor: this.theme.getChartBgColor(),
                },
                credits: {
                    enabled: false,
                },
                title: {
                    text: element.title,
                    //color
                    style: {
                        color: this.theme.getChartTextColor(),
                        fontWeight: "bold",
                    },
                },
                xAxis: {},
                yAxis: {
                    title: {
                        text: this.translator.instant("graphs.evaluations.pie.yText"),
                    },
                },
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true,
                            format: "<b>{point.name}</b>: {point.percentage:.1f} %",
                            color: this.theme.getChartTextColor(),
                        },
                    },
                    pie: {
                        colors: this.returnPieColors(),
                    },
                },
                series: [
                    {
                        type: undefined,
                        name: this.translator.instant("graphs.evaluations.pie.seriesName"),
                        data: [
                            {
                                name: this.translator.instant("graphs.evaluations.pie.5Text"),
                                y: element.data[0],
                            },
                            {
                                name: this.translator.instant("graphs.evaluations.pie.4Text"),
                                y: element.data[1],
                            },
                            {
                                name: this.translator.instant("graphs.evaluations.pie.3Text"),
                                y: element.data[2],
                            },
                            {
                                name: this.translator.instant("graphs.evaluations.pie.2Text"),
                                y: element.data[3],
                            },
                            {
                                name: this.translator.instant("graphs.evaluations.pie.1Text"),
                                y: element.data[4],
                            },
                        ],
                        width: 5,
                        zIndex: 3,
                    },
                ],
            });
        }
    }
}
