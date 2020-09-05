import { Component, OnInit } from "@angular/core";
import { SubjectAverage } from "../_models/kreta-v3/average";
import { Router } from "@angular/router";
import { DataService } from "../_services/data.service";
import { Subject } from "rxjs";
import { UserManagerService } from "../_services/user-manager.service";
import { HwBackButtonService } from "../_services/hw-back-button.service";
import { takeUntil } from "rxjs/operators";
import { KretaError } from "../_exceptions/kreta-exception";
import { FirebaseService } from "../_services/firebase.service";
import { Evaluation } from "../_models/kreta-v3/evaluation";

@Component({
    selector: "app-averages",
    templateUrl: "./averages.page.html",
    styleUrls: ["./averages.page.scss"],
})
export class AveragesPage implements OnInit {
    public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
    public evaluations: Evaluation[];
    public subjectAverages: SubjectAverage[] = [];
    public error: KretaError;

    public unsubscribe$: Subject<void>;

    constructor(
        private hw: HwBackButtonService,
        private navRouter: Router,
        private data: DataService,
        private firebase: FirebaseService,
        private userManager: UserManagerService
    ) {}

    async ngOnInit() {
        this.firebase.setScreenName("averages");
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

    private loadData(forceRefresh: boolean = false, event?) {
        this.userManager.currentUser
            .getAsyncAsObservableWithCache<[Evaluation[], SubjectAverage[]]>(
                [
                    {
                        name: "getEvaluationsV3",
                        cacheKey: "v3Evaluations",
                        params: [],
                    },
                    {
                        name: "getAveragesV3",
                        cacheKey: "v3Averages",
                        params: [],
                    },
                ],
                forceRefresh
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: d => {
                    this.evaluations = d[0];
                    this.subjectAverages = d[1];

                    if (d[0] && d[1]) {
                        this.evaluations = this.evaluations.filter(
                            e =>
                                e.SzamErtek &&
                                e.SzamErtek != 0 &&
                                e.ErtekFajta?.Nev == "Osztalyzat" &&
                                e.Tipus.Nev == "evkozi_jegy_ertekeles"
                        );
                        this.subjectAverages = this.subjectAverages.filter(sa => sa.Atlag);
                    }

                    this.setComponentState();
                },
                complete: () => {
                    if (event) event.target.complete();

                    this.setComponentState();
                },
                error: error => {
                    console.error(error);
                    this.error = error;

                    if (event) event.target.complete();

                    if (!this.evaluations || !this.subjectAverages) {
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
        if (!this.evaluations || !this.subjectAverages) {
            this.componentState = "error";
        } else if (this.subjectAverages.length == 0) {
            this.componentState = "empty";
        } else {
            this.componentState = "loaded";
        }
    }

    async showModal(subject: string, classValue: number) {
        if (!classValue) console.warn("No classvalue :(. Please implement me someday, KRÉTA devs");

        this.data.setData("subject", subject);
        this.data.setData("evaluations", this.evaluations);
        this.data.setData("classValue", classValue);
        this.navRouter.navigateByUrl("/average-graphs?fromRoute=averages");
    }

    async doRefresh(event?) {
        if (this.componentState == "error") {
            this.componentState = "loading";
        } else {
            this.componentState = "loadedProgress";
        }
        this.loadData(true, event);
    }
    getCountingGrades(subject: string) {
        return this.evaluations.filter(
            e =>
                e.Tantargy.Nev == subject &&
                e.SzamErtek &&
                e.SzamErtek != 0 &&
                e.ErtekFajta?.Nev == "Osztalyzat" &&
                e.Tipus.Nev == "evkozi_jegy_ertekeles"
        ).length;
    }
}
