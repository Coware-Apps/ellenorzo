import { Component, OnInit, ViewChild } from "@angular/core";
import { IonSlides, MenuController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import * as HighCharts from "highcharts";
import more from "highcharts/highcharts-more";
import { TranslateService } from "@ngx-translate/core";
import { SubjectAverage } from "../_models/kreta-v3/average";
import { FirebaseService } from "../_services/firebase.service";
import { ThemeService } from "../_services/theme.service";
import { AppService } from "../_services/app.service";
more(HighCharts);

@Component({
    selector: "app-color-picker",
    templateUrl: "./color-picker.page.html",
    styleUrls: ["./color-picker.page.scss"],
})
export class ColorPickerPage implements OnInit {
    @ViewChild("slides", { static: true }) slides: IonSlides;

    public color: string;
    public fiveColor: string;
    public fourColor: string;
    public threeColor: string;
    public twoColor: string;
    public oneColor: string;
    public noneColor: string;
    public focused: number;
    public title: string;
    public mockEvaluations = [];
    public mockAverages: SubjectAverage[] = [];

    constructor(
        public theme: ThemeService,
        public app: AppService,

        private storage: Storage,
        private firebase: FirebaseService,
        private menuCtrl: MenuController,
        private translator: TranslateService
    ) {
        this.color = "#00CC00";
        this.focused = 0;
        this.title = this.translator.instant("pages.evaluations.title");
    }

    async ngOnInit() {
        [5, 4, 3, 2, 1, 0].forEach(i => {
            this.mockEvaluations.push({
                Tantargy: {
                    Nev: this.translator.instant(
                        "pages.color-picker.evaluationCard.placeholderSubject"
                    ),
                },

                ErtekeloTanarNeve: this.translator.instant(
                    "pages.color-picker.evaluationCard.placeholderTeacher"
                ),
                Tema: this.translator.instant("pages.color-picker.evaluationCard.placeholderTheme"),
                Tipus: {
                    Nev: "evkozi_jegy_ertekeles",
                },
                SzamErtek: i,
                KeszitesDatuma: new Date(946684800).toString(),
                ErtekFajta: {
                    Nev: "Osztalyzat",
                },
            });
            if (i != 0)
                this.mockAverages.push({
                    Tantargy: {
                        Nev: this.translator.instant(
                            "pages.color-picker.averageCard.placeholderSubject"
                        ),
                        Uid: null,
                        Kategoria: null,
                    },
                    Atlag: i,
                    AtlagAlakulasaIdoFuggvenyeben: null,
                    SortIndex: i,
                    Uid: null,
                });
        });
        this.menuCtrl.enable(false);

        this.fiveColor = this.theme.cardColors.fiveColor;
        this.fourColor = this.theme.cardColors.fourColor;
        this.threeColor = this.theme.cardColors.threeColor;
        this.twoColor = this.theme.cardColors.twoColor;
        this.oneColor = this.theme.cardColors.oneColor;
        this.noneColor = this.theme.cardColors.noneColor;

        this.firebase.setScreenName("color-picker");
    }

    async ionViewWillEnter() {
        HighCharts.chart("pie_0", {
            chart: {
                type: "pie",
                //color
                backgroundColor: this.theme.getChartBgColor(),
            },
            credits: {
                enabled: false,
            },
            title: {
                text: this.translator.instant("pages.color-picker.pieChart.title"),
                //color
                style: {
                    color: this.theme.getChartTextColor(),
                    fontWeight: "bold",
                },
            },
            xAxis: {},
            yAxis: {
                title: {
                    text: "Darabszám",
                },
                plotLines: [
                    {
                        value: 4,
                        color: this.theme.getChartPlotLineColor(0),
                        width: 2,
                        zIndex: 9999,
                        dashStyle: "Dash",
                        label: {
                            text: "Átlag",
                            //color
                            style: {
                                color: this.theme.getChartTextColor(),
                            },
                        },
                    },
                ],
            },
            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: true,
                        format: "<b>{point.name}</b>: {point.percentage:.1f} %",
                        //color
                        color: this.theme.getChartTextColor(),
                    },
                    events: {
                        click: function (event) {
                            this.changeColor(parseInt(event.point.name.substring(0, 1)));
                            this.ionViewWillEnter();
                        }.bind(this),
                    },
                },
                pie: {
                    colors: [
                        this.fiveColor,
                        this.fourColor,
                        this.threeColor,
                        this.twoColor,
                        this.oneColor,
                    ],
                },
            },
            series: [
                {
                    type: undefined,
                    name: this.translator.instant("graphs.evaluations.pie.seriesName"),
                    data: [
                        {
                            name: this.translator.instant("graphs.evaluations.pie.5Text"),
                            y: 30,
                        },
                        {
                            name: this.translator.instant("graphs.evaluations.pie.4Text"),
                            y: 20,
                        },
                        {
                            name: this.translator.instant("graphs.evaluations.pie.3Text"),
                            y: 15,
                        },
                        {
                            name: this.translator.instant("graphs.evaluations.pie.2Text"),
                            y: 10,
                        },
                        {
                            name: this.translator.instant("graphs.evaluations.pie.1Text"),
                            y: 5,
                        },
                    ],
                    width: 5,
                    zIndex: 3,
                },
            ],
        });
    }

    async ionViewWillLeave() {
        await this.menuCtrl.enable(true);
    }

    async ionSlideWillChange() {
        this.focused = await this.slides.getActiveIndex();
        switch (this.focused) {
            case 0:
                this.title = this.translator.instant("pages.evaluations.title");
                break;
            case 1:
                this.title = this.translator.instant("pages.averages.title");
                break;
            case 2:
                this.title = this.translator.instant("pages.statistics.title");
                this.ionViewWillEnter();
                break;
        }
    }

    async getData(index: number) {
        if ((await this.slides.getActiveIndex()) == this.focused) {
            //the segment's ionChange event wasn't fired by a slide moving
            this.focused = index;
            this.slides.slideTo(index);
            switch (index) {
                case 0:
                    this.title = this.translator.instant("pages.evaluations.title");
                    break;
                case 1:
                    this.title = this.translator.instant("pages.averages.title");
                    break;
                case 2:
                    this.title = this.translator.instant("pages.statistics.title");
                    this.ionViewWillEnter();
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
                this.theme.cardColors.fiveColor = this.color;
                await this.storage.set("cardColor", this.theme.returnColorCodes());
                break;
            case 4:
                this.fourColor = this.color;
                this.theme.cardColors.fourColor = this.color;
                await this.storage.set("cardColor", this.theme.returnColorCodes());
                break;
            case 3:
                this.threeColor = this.color;
                this.theme.cardColors.threeColor = this.color;
                await this.storage.set("cardColor", this.theme.returnColorCodes());
                break;
            case 2:
                this.twoColor = this.color;
                this.theme.cardColors.twoColor = this.color;
                await this.storage.set("cardColor", this.theme.returnColorCodes());
                break;
            case 1:
                this.oneColor = this.color;
                this.theme.cardColors.oneColor = this.color;
                await this.storage.set("cardColor", this.theme.returnColorCodes());
                break;
            case 0:
                this.noneColor = this.color;
                this.theme.cardColors.noneColor = this.color;
                await this.storage.set("cardColor", this.theme.returnColorCodes());
                break;
        }
    }

    getContrast50(hexcolor: string) {
        hexcolor = hexcolor.substring(1);
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        var yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 128 ? "black" : "white";
    }

    styleEval() {
        return {
            "background-color": this.color,
            color: this.getContrast50(this.color),
        };
    }
}
