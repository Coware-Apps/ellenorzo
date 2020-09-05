import { Component, OnInit, ViewChild } from "@angular/core";
import { Student, evaluation } from "../_models/kreta-v2/student";
import { FormattedDateService } from "../_services/formatted-date.service";
import { IonSelect } from "@ionic/angular";
import { DataService } from "../_services/data.service";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { CollapsifyService } from "../_services/collapsify.service";
import { AppService } from "../_services/app.service";
import { UserManagerService } from "../_services/user-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { HwBackButtonService } from "../_services/hw-back-button.service";
import { takeUntil } from "rxjs/operators";
import { KretaError } from "../_exceptions/kreta-exception";
import { FirebaseService } from "../_services/firebase.service";
import { ThemeService } from "../_services/theme.service";
import { Evaluation } from "../_models/kreta-v3/evaluation";

interface SelectOption {
    name: string;
    id: string;
    show: boolean;
    empty: boolean;
    data: any;
}
@Component({
    selector: "app-evaluations",
    templateUrl: "./evaluations.page.html",
    styleUrls: ["./evaluations.page.scss"],
})
export class EvaluationsPage implements OnInit {
    @ViewChild("categorySelector") categorySelector: IonSelect;

    //for the selector
    customAlertOptions: any = {
        subHeader: this.translator.instant("pages.evaluations.categorySelectorTitle"),
        cssClass: this.theme.getPopUpClass(),
    };

    public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
    public selected: string;
    public selectOptions: SelectOption[] = [
        {
            name: this.translator.instant(`pages.evaluations.categorySelector.bySubject`),
            id: "bySubject",
            show: true,
            empty: false,
            data: [],
        },
        {
            name: this.translator.instant(`pages.evaluations.categorySelector.byDate`),
            id: "byDate",
            show: true,
            empty: false,
            data: [],
        },
        {
            name: this.translator.instant(`pages.evaluations.categorySelector.halfYear`),
            id: "halfYear",
            show: true,
            empty: false,
            data: [],
        },
        {
            name: this.translator.instant(`pages.evaluations.categorySelector.endYear`),
            id: "endYear",
            show: true,
            empty: false,
            data: [],
        },
        {
            name: this.translator.instant(`pages.evaluations.categorySelector.other`),
            id: "other",
            show: true,
            empty: false,
            data: [],
        },
    ];
    public unsubscribe$: Subject<void>;
    public error: KretaError;

    private evaluations: Evaluation[];

    constructor(
        public fDate: FormattedDateService,
        public app: AppService,

        private hw: HwBackButtonService,
        private data: DataService,
        private navRouter: Router,
        private firebase: FirebaseService,
        private userManager: UserManagerService,
        private collapsify: CollapsifyService,
        private translator: TranslateService,
        private theme: ThemeService
    ) {
        this.selected = "bySubject";
    }

    ngOnInit() {
        this.firebase.setScreenName("evaluations");
    }
    async ionViewWillEnter() {
        this.unsubscribe$ = new Subject();

        this.hw.registerHwBackButton(this.unsubscribe$);
        this.userManager.reloader.pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
            if (val == "reload") {
                this.componentState = "loading";
                this.loadData();
            }
        });
        this.loadData();
    }
    ionViewWillLeave() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    loadData(forceRefresh: boolean = false, event?) {
        this.userManager.currentUser
            .getAsyncAsObservableWithCache<[Evaluation[]]>(
                [
                    {
                        name: "getEvaluationsV3",
                        cacheKey: "v3Evaluations",
                        params: [null, null, true],
                    },
                ],
                forceRefresh
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: d => {
                    this.evaluations = d[0];
                    if (d[0]) {
                        this.selectOptions = this.formatEvaluations(d[0]);
                        this.componentState = "loadedProgress";
                    }
                },
                complete: () => {
                    if (event) event.target.complete();
                    //the empty components will appear per groups
                    this.componentState = "loaded";
                },
                error: error => {
                    console.error(error);
                    this.error = error;

                    if (event) event.target.complete();

                    //only setting the component state to `error` if none of the groups contain data
                    //the empty components will appear per groups
                    if (this.selectOptions.findIndex(opt => opt.data.length > 0) == -1) {
                        this.componentState = "error";
                        error.isHandled = true;
                    } else {
                        this.componentState = "loaded";
                    }

                    throw error;
                },
            });
    }
    allSubjetsOpened() {
        return this.selectOptions[0].data.find(d => d.showAll) != null;
    }
    collapseSubjects() {
        const openOrClose = !this.allSubjetsOpened();

        for (let i = 0; i < this.selectOptions[0].data.length; i++) {
            this.selectOptions[0].data[i].showAll = openOrClose;
        }
    }
    openCategorySelector(event: UIEvent) {
        this.categorySelector.interface = "popover";
        this.categorySelector.open(event);
    }
    async doRefresh(event?) {
        if (this.componentState == "error") {
            this.componentState = "loading";
        } else {
            this.componentState = "loadedProgress";
        }
        this.loadData(true, event);
    }
    formatEvaluations(evaluations: Evaluation[]): SelectOption[] {
        this.selectOptions.forEach(option => {
            switch (option.id) {
                case "bySubject":
                    option.data = this.collapsify.collapsifyEvaluationsBySubjects(
                        evaluations.filter(e => e.Tipus.Nev == "evkozi_jegy_ertekeles")
                    );
                    option.data.sort((x, y) => x.index - y.index);
                    let optionData = option.data;
                    optionData.map(collapsibleGroup => (collapsibleGroup.showAll = false));
                    option.data = optionData;
                    break;
                case "byDate":
                    option.data = this.collapsify.collapsifyByDates(
                        evaluations.filter(e => e.Tipus.Nev == "evkozi_jegy_ertekeles"),
                        "KeszitesDatuma"
                    );
                    break;
                case "halfYear":
                    option.data = evaluations.filter(e => e.Tipus.Nev == "felevi_jegy_ertekeles");
                    break;
                case "endYear":
                    option.data = evaluations.filter(e => e.Tipus.Nev == "evvegi_jegy_ertekeles");
                    break;
                case "other":
                    option.data = evaluations.filter(
                        e =>
                            e.Tipus.Nev != "evvegi_jegy_ertekeles" &&
                            e.Tipus.Nev != "evkozi_jegy_ertekeles" &&
                            e.Tipus.Nev != "felevi_jegy_ertekeles"
                    );
                    break;
            }
        });

        return this.selectOptions;
    }
    async selectorChanged(event) {
        this.selected = this.selectOptions.find(opt => opt.id == event.detail.value).id;
    }
    async showModal(subject: string) {
        let classValue: number;

        this.data.setData("subject", subject);
        this.data.setData("evaluations", this.evaluations);
        this.data.setData("classValue", classValue);
        this.navRouter.navigateByUrl("/average-graphs?fromRoute=evaluations");
    }
    isCurrentCategoryEmpty() {
        return this.selectOptions.find(opt => opt.id == this.selected).data.length == 0;
    }
}
