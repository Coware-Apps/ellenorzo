import { Student } from "../_models/kreta-v2/student";
import { Router } from "@angular/router";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Evaluation } from "../_models/kreta-v3/evaluation";
import { Note } from "../_models/kreta-v3/note";
import { Absence } from "../_models/kreta-v3/absence";
import { Test } from "../_models/kreta-v3/test";
import { KretaService } from "../_services/kreta.service";
import { FormattedDateService } from "../_services/formatted-date.service";
import { PromptService } from "../_services/prompt.service";
import { CollapsibleStudent } from "../_models/kreta-v2/student";
import { Subscription, Subject } from "rxjs";
import { AppService } from "../_services/app.service";
import { UserManagerService } from "../_services/user-manager.service";
import { MenuController } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";
import { CollapsibleCombined } from "../_models/user";
import { MessageListItem } from "../_models/administration/message";
import { HwBackButtonService } from "../_services/hw-back-button.service";
import { KretaError } from "../_exceptions/kreta-exception";
import { FirebaseService } from "../_services/firebase.service";
import { ThemeService } from "../_services/theme.service";

@Component({
    selector: "app-home",
    templateUrl: "home.page.html",
    styleUrls: ["home.page.scss"],
})
export class HomePage implements OnInit, OnDestroy {
    public monthNames: string[];
    public formattedCombined: CollapsibleCombined[];
    public isEmpty: boolean = false;
    public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
    public error: KretaError;

    //categories
    public categories = {
        evaluations: true,
        absences: true,
        docs: true,
        messages: true,
    };

    private unsubscribe$: Subject<void>;
    private reloaderSubscription: Subscription;

    @Input() data: string;

    //for the selector
    customPopoverOptions: any = {
        subHeader: "Megjelenítés",
        cssClass: this.theme.getPopUpClass(),
    };

    constructor(
        public userManager: UserManagerService,
        public fDate: FormattedDateService,
        public Students: Student,
        public kreta: KretaService,
        public student: Student,
        public app: AppService,

        private hw: HwBackButtonService,
        private navRouter: Router,
        private firebase: FirebaseService,
        private prompt: PromptService,
        private menuCtrl: MenuController,
        private translator: TranslateService,
        private router: Router,
        private theme: ThemeService
    ) {
        this.monthNames = this.translator.instant("dates.monthNames");
    }

    public async ngOnInit() {
        this.reloaderSubscription = this.userManager.reloader.subscribe(val => {
            if (val == "reload") {
                this.formattedCombined = null;
                this.componentState = "loading";
                this.loadData();
            }
        });
        this.firebase.setScreenName("home");
        this.loadData(false, null);
    }

    ionViewWillEnter() {
        this.menuCtrl.enable(true);
        this.unsubscribe$ = new Subject();
        this.hw.registerHwBackButton(this.unsubscribe$, true);
    }

    ionViewWillLeave() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    ngOnDestroy(): void {
        if (this.reloaderSubscription) this.reloaderSubscription.unsubscribe();
    }

    loadData(forceRefresh: boolean = false, event?) {
        let requestsToDo = [];

        this.app.homeRequests.forEach(r => {
            if (r.show) {
                requestsToDo.push({
                    name: r.requestName,
                    cacheKey: r.cacheKey,
                    params: r.defaultParams,
                });
            }
        });

        this.userManager.currentUser
            .getAsyncAsObservableWithCache<[]>(requestsToDo, forceRefresh)
            .subscribe({
                next: d => {
                    if (d && d.length > 0) {
                        this.formattedCombined = this.formatCombined(d);
                        this.componentState = "loadedProgress";
                    }
                },
                complete: () => {
                    if (event) event.target.complete();

                    let empty = true;
                    if (this.formattedCombined)
                        this.formattedCombined.forEach(e => {
                            if (e.data.length > 0) empty = false;
                        });
                    this.componentState = empty ? "empty" : "loaded";
                },
                error: error => {
                    console.error(error);
                    this.error = error;

                    if (event) event.target.complete();

                    let empty = true;
                    if (this.formattedCombined)
                        this.formattedCombined.forEach(e => {
                            if (e.data.length > 0) empty = false;
                        });

                    if (empty) {
                        this.componentState = "error";
                        error.isHandled = true;
                    } else {
                        this.componentState = "loaded";
                    }

                    throw error;
                },
            });
    }

    async doRefresh(event?) {
        if (this.componentState == "error") {
            this.componentState = "loading";
        } else {
            this.componentState = "loadedProgress";
        }
        this.loadData(true, event);
    }

    private formatCombined(dataGroups: any[]): CollapsibleCombined[] {
        let allData = [];
        dataGroups.forEach(g => {
            if (g) allData = allData.concat(g);
        });

        let allDataByMonths = [];

        let months: number[] = [];
        if (allData && allData.length > 0) {
            allData.forEach(e => {
                const creatingMonth = new Date(this.getDateField(e)).getMonth();
                if (!months.includes(creatingMonth)) {
                    months.push(creatingMonth);
                }
            });
        }

        months.forEach((month, i) => {
            let monthlyData: any[] = [];
            allData.forEach(item => {
                if (new Date(this.getDateField(item)).getMonth() == month) {
                    monthlyData.push(item);
                }
            });

            monthlyData.sort(
                (a, b) =>
                    new Date(this.getDateField(b)).valueOf() -
                    new Date(this.getDateField(a)).valueOf()
            );

            allDataByMonths.push({
                index: i,
                header: this.monthNames[month],
                data: monthlyData,
                firstEntryCreatingTime: new Date(
                    this.getDateField(monthlyData[monthlyData.length - 1])
                ).valueOf(),
                showAll: true,
            });
            i++;
        });

        allDataByMonths.sort((a, b) => b.firstEntryCreatingTime - a.firstEntryCreatingTime);
        for (let i = 0; i < allDataByMonths.length; i++) {
            allDataByMonths[i].showAll = i == 0;
        }

        return allDataByMonths;

        return [];
    }

    private getDateField(item: any) {
        if (item.KeszitesDatuma) {
            return item.KeszitesDatuma;
        } else if (item.Datum) {
            return item.Datum;
        }
        return item.uzenetKuldesDatum;
    }

    showOrHideMonth(monthlyGrades: CollapsibleStudent) {
        monthlyGrades.showAll = monthlyGrades.showAll == true ? false : true;
    }

    getMoreData(item: any) {
        if (item.isAbsence) {
            this.prompt.absenceV3Alert(item);
        } else if (item.isNote) {
            this.prompt.noteV3Alert(item);
        } else if (item.isEvaluation) {
            this.prompt.evaluationV3Alert(item);
        }
    }

    themeIf(theme: string) {
        return !theme || theme == "" ? "" : " - " + theme;
    }

    async showPicker() {
        this.navRouter.navigateByUrl("/color-picker?from=home");
    }

    goToHomeSettings() {
        this.router.navigateByUrl("home/home-settings");
    }

    async openMessage(message: MessageListItem) {
        if (!message.isElolvasva) {
            await this.userManager.currentUser.setMessageAsRead(message.uzenetAzonosito);
        }
        this.router.navigateByUrl(`/messages/read-message?messageId=${message.azonosito}`);
    }

    filterClicked(c: string) {
        this.categories[c] = !this.categories[c];
    }

    isRequestEnabled(r: string) {
        return this.app.homeRequests.find(req => req.requestName == r)?.show ?? false;
    }

    getLongItemText(text: string) {
        return text.length > 100 ? text.substring(0, 100) + "..." : text;
    }

    isOpenableNeeded(text: string) {
        return text.length > 100 ? this.translator.instant("pages.home.readMoreText") : "";
    }

    urlify(text: string) {
        var urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        return text.replace(urlRegex, url => `<a href="${url}">${url}</a>`);
    }

    areAllRequestsEnabled(): boolean {
        return !!this.app.homeRequests.findIndex(r => !r.show);
    }

    isFilterApplied(): boolean {
        for (const key in this.categories) {
            if (this.categories.hasOwnProperty(key)) {
                const element = this.categories[key];

                if (element === false) return true;
            }
        }

        return false;
    }
}
