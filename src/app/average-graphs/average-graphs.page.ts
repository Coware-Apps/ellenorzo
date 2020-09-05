import { Component, OnInit, ViewChild } from "@angular/core";
import { Student, evaluation } from "../_models/kreta-v2/student";
import { IonSlides, MenuController } from "@ionic/angular";
import * as HighCharts from "highcharts";
import { WeighedAvgCalcService } from "../_services/weighed-avg-calc.service";
import { DataService } from "../_services/data.service";
import { PromptService } from "../_services/prompt.service";
import { TranslateService } from "@ngx-translate/core";
import { FirebaseService } from "../_services/firebase.service";
import { ThemeService } from "../_services/theme.service";
import { FormattedDateService } from "../_services/formatted-date.service";
import { AppService } from "../_services/app.service";
import { Evaluation } from "../_models/kreta-v3/evaluation";

@Component({
    selector: "app-average-graphs",
    templateUrl: "./average-graphs.page.html",
    styleUrls: ["./average-graphs.page.scss"],
})
export class AverageGraphsPage implements OnInit {
    @ViewChild("slides", { static: true }) slides: IonSlides;

    public newGrade;
    public newPercent;
    public focused: number;
    public unfilled: boolean;
    public subject: string;
    public classValue: number;
    public evaluations: Evaluation[];
    public displayEvaluations: Evaluation[];

    private average: number;
    private LineData: Evaluation[];
    private ColumnData: Array<number>;
    private IdIncrement = 0;

    constructor(
        public theme: ThemeService,
        public app: AppService,

        private wac: WeighedAvgCalcService,
        private data: DataService,
        private firebase: FirebaseService,
        private prompt: PromptService,
        private menuCtrl: MenuController,
        private translator: TranslateService,
        private fDate: FormattedDateService
    ) {
        this.ColumnData = [0, 0, 0, 0, 0];
        this.LineData = [];
        this.focused = 0;
        this.unfilled = false;
        this.evaluations = this.data.getData("evaluations");
        this.subject = this.data.getData("subject");
        this.classValue = this.data.getData("classValue");
    }

    ngOnInit() {
        this.menuCtrl.enable(false);
        this.fillStartData();
        this.firebase.setScreenName("average-graphs");
    }

    async ionViewWillLeave() {
        await this.menuCtrl.enable(true);
    }

    fillStartData() {
        this.displayEvaluations = this.filterEvaluations(this.evaluations);
        this.displayEvaluations.sort(
            (a, b) => new Date(a.KeszitesDatuma).valueOf() - new Date(b.KeszitesDatuma).valueOf()
        );

        this.displayEvaluations.forEach(element => {
            //line
            this.LineData.push(element);
            //column
            this.ColumnData[element.SzamErtek - 1]++;
        });

        this.average = Math.round(this.wac.averageV3(this.displayEvaluations) * 100) / 100;
        this.LineData.reverse();
    }

    filterEvaluations(evaluations: Evaluation[]): Evaluation[] {
        return evaluations.filter(
            e =>
                this.subject == e.Tantargy.Nev &&
                e.SzamErtek &&
                e.SzamErtek != 0 &&
                e.ErtekFajta?.Nev == "Osztalyzat" &&
                e.Tipus.Nev == "evkozi_jegy_ertekeles"
        );
    }

    async ionSlideWillChange() {
        this.focused = await this.slides.getActiveIndex();
    }

    changeGraph(event: any) {
        const position: number = event.detail.value;

        //Just angular being angular (ExpressionChangedAfterItHasBeenCheckedError)
        if (this.focused == position) return;

        this.slides.slideTo(position);
        this.focused = position;
    }

    async addGrade() {
        this.firebase.logEvent("add_new_grade");

        if (
            this.newGrade < 6 &&
            this.newGrade > 0 &&
            (this.newPercent == null || (this.newPercent > 0 && this.newPercent <= 350))
        ) {
            this.unfilled = false;

            const newEval = <Evaluation>{
                SzamErtek: this.newGrade,
                SulySzazalekErteke: this.newPercent ? this.newPercent : 100,
                extraId: this.IdIncrement,
                Tantargy: { Kategoria: null, Nev: this.subject, Uid: null },
                KeszitesDatuma: new Date().toDateString(),
                RogzitesDatuma: new Date().toDateString(),
                Tema: this.translator.instant("pages.average-graphs.addedGradeName"),
                ErtekFajta: {
                    Uid: "1,Osztalyzat",
                    Leiras: "Elégtelen (1) és Jeles (5) között az öt alapértelmezett érték",
                    Nev: "Osztalyzat",
                },
                Tipus: {
                    Uid: "1518,evkozi_jegy_ertekeles",
                    Leiras: "Évközi jegy/értékelés",
                    Nev: "evkozi_jegy_ertekeles",
                },
            };

            this.displayEvaluations.unshift(newEval);

            //line
            this.LineData.push(newEval);

            //average
            this.average = Math.round(this.wac.averageV3(this.displayEvaluations) * 100) / 100;

            //column
            this.ColumnData[this.newGrade - 1]++;

            this.drawGraphTypes("all");
            this.IdIncrement++;
            await this.prompt.dismissTopToast();
        } else {
            this.prompt.topToast(
                this.translator.instant("pages.average-graphs.wrongDataToastText"),
                true
            );
            this.unfilled = true;
        }
    }

    removeGrade(id: number) {
        let toRemoveId = this.displayEvaluations.findIndex(g => g.extraId == id);
        this.displayEvaluations.splice(toRemoveId, 1);

        //getting new average
        this.average = Math.round(this.wac.averageV3(this.displayEvaluations) * 100) / 100;

        //column
        this.ColumnData[this.newGrade - 1]--;

        //line
        this.LineData.splice(
            this.LineData.findIndex(e => e.extraId == this.IdIncrement),
            1
        );

        this.IdIncrement--;
        this.drawGraphTypes("all");
    }

    ionViewWillEnter() {
        this.drawGraphTypes("all");
    }

    drawGraphTypes(graphType: "gauge" | "line" | "column" | "all") {
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
                this.drawColumn("column");
                this.drawLine("line");
                this.drawGauge("gauge");
                break;

            default:
                break;
        }
    }

    drawGauge(id: string = "container") {
        HighCharts.chart(id, {
            chart: {
                type: "gauge",
                plotBackgroundColor: this.theme.getChartBgColor(),
                plotBorderWidth: 0,
                plotShadow: false,
                height: 300,
                backgroundColor: this.theme.getChartBgColor(),
            },

            plotOptions: {
                gauge: {
                    pivot: {
                        backgroundColor: {
                            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
                            stops: [
                                [0, this.theme.getChartSeriesColor()],
                                [1, this.theme.getChartSeriesColor()],
                            ],
                        },
                    },
                },
            },

            credits: {
                enabled: false,
            },

            title: {
                text:
                    this.subject +
                    " " +
                    this.translator.instant("pages.average-graphs.averageName"),
                style: {
                    color: this.theme.getChartTextColor(),
                    fontWeight: "bold",
                },
            },

            pane: {
                startAngle: -135,
                endAngle: 135,
                background: [
                    {
                        backgroundColor: {
                            linearGradient: {
                                x1: 0,
                                y1: 0,
                                x2: 0,
                                y2: 1,
                            },
                            stops: [
                                [0, this.theme.getChartBgColor()],
                                [1, this.theme.getChartBgColor()],
                            ],
                        },
                    },
                ],
            },

            // the value axis
            yAxis: {
                min: 1,
                max: 5,

                title: {},
                plotBands: [
                    {
                        from: 1,
                        to: 1.5,
                        color: "#f70505", // red
                    },
                    {
                        from: 1.5,
                        to: 2.5,
                        color: "#f75205", // orange
                    },
                    {
                        from: 2.5,
                        to: 3.5,
                        color: "#ffd000", // yellow
                    },
                    {
                        from: 3.5,
                        to: 4.5,
                        color: "#a2ff00", // light green
                    },
                    {
                        from: 4.5,
                        to: 5,
                        color: "#09d102", // green
                    },
                ],
            },

            series: [
                {
                    name: this.translator.instant("graphs.evaluations.gauge.averageText"),
                    data: [this.average],
                    type: undefined,
                    dial: {
                        backgroundColor: this.theme.getChartSeriesColor(),
                    },
                },
            ],
        });
    }

    drawLine(id: string = "container") {
        const displayData: any = this.LineData;

        HighCharts.chart(id, {
            chart: {
                type: "line",
                height: 300,
                //color
                backgroundColor: this.theme.getChartBgColor(),
            },
            credits: {
                enabled: false,
            },
            title: {
                text:
                    this.subject +
                    " " +
                    this.translator.instant("pages.average-graphs.averageName"),
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
                    text: " " + this.translator.instant("graphs.evaluations.line.yText"),
                    //color
                    style: {
                        color: this.theme.getChartTextColor(),
                        fontWeight: "bold",
                    },
                },
                plotLines: [
                    {
                        value: this.average,
                        color: this.theme.getChartPlotLineColor(0),
                        width: 2,
                        zIndex: 3,
                        dashStyle: "Dash",
                        label: {
                            text:
                                " " +
                                this.translator.instant("graphs.evaluations.line.averageText"),
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
                    data: displayData.map(e => {
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

    drawColumn(id: string = "container") {
        HighCharts.chart(id, {
            chart: {
                type: "column",
                height: 300,
                //color
                backgroundColor: this.theme.getChartBgColor(),
            },
            credits: {
                enabled: false,
            },
            title: {
                text:
                    this.subject +
                    " " +
                    this.translator.instant("pages.average-graphs.averageName"),
                //color
                style: {
                    color: this.theme.getChartTextColor(),
                    fontWeight: "bold",
                },
            },
            xAxis: {
                categories: ["1", "2", "3", "4", "5"],
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
                    data: this.ColumnData,
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

    themeIf(theme: string) {
        return !theme || theme == "" ? "" : " - " + theme;
    }

    showAlert(evaluation: Evaluation) {
        this.prompt.evaluationV3Alert(evaluation);
    }

    getEvaluationColor(e: Evaluation) {
        if (!e.SulySzazalekErteke || e.SulySzazalekErteke == 100) return this.theme.getContrast();
        if (e.SulySzazalekErteke == 50) return "green";
        if (e.SulySzazalekErteke == 150) return "#d1ab00";
        if (e.SulySzazalekErteke == 200) return "red";

        return "pink";
    }

    getEvaluationDate(e: Evaluation) {
        return this.fDate.formatDateWithZerosAndDots(e.KeszitesDatuma);
    }

    getWeightText(weight: number) {
        if (!weight) return "100%";
        return weight + "%";
    }
}
