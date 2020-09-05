import { Component, OnInit, ViewChild } from "@angular/core";
import { Storage } from "@ionic/storage";
import { Lesson } from "../_models/kreta-v3/lesson";
import { ThemeService } from "../_services/theme.service";
import { AlertController, IonSlides, MenuController } from "@ionic/angular";
import { FormattedDateService } from "../_services/formatted-date.service";
import { Router } from "@angular/router";
import { DataService } from "../_services/data.service";
import { PromptService } from "../_services/prompt.service";
import { UserManagerService } from "../_services/user-manager.service";
import { Subject, Subscription } from "rxjs";
import { TranslateService } from "@ngx-translate/core";
import { takeUntil } from "rxjs/operators";
import { HwBackButtonService } from "../_services/hw-back-button.service";
import { KretaError } from "../_exceptions/kreta-exception";
import { FirebaseService } from "../_services/firebase.service";

@Component({
    selector: "app-list",
    templateUrl: "list.page.html",
    styleUrls: ["list.page.scss"],
})
export class ListPage implements OnInit {
    @ViewChild("slides", { static: true }) slides: IonSlides;

    public unfocusFooterButton: boolean;
    public days = [
        {
            name: this.translator.instant("dates.days.sunday.name"),
            shortName: this.translator.instant("dates.days.sunday.shortName"),
            data: [],
            index: 6,
            dayIndex: 0,
        },
        {
            name: this.translator.instant("dates.days.monday.name"),
            shortName: this.translator.instant("dates.days.monday.shortName"),
            data: [],
            index: 0,
            dayIndex: 1,
        },
        {
            name: this.translator.instant("dates.days.tuesday.name"),
            shortName: this.translator.instant("dates.days.tuesday.shortName"),
            data: [],
            index: 1,
            dayIndex: 2,
        },
        {
            name: this.translator.instant("dates.days.wednesday.name"),
            shortName: this.translator.instant("dates.days.wednesday.shortName"),
            data: [],
            index: 2,
            dayIndex: 3,
        },
        {
            name: this.translator.instant("dates.days.thursday.name"),
            shortName: this.translator.instant("dates.days.thursday.shortName"),
            data: [],
            index: 3,
            dayIndex: 4,
        },
        {
            name: this.translator.instant("dates.days.friday.name"),
            shortName: this.translator.instant("dates.days.friday.shortName"),
            data: [],
            index: 4,
            dayIndex: 5,
        },
        {
            name: this.translator.instant("dates.days.saturday.name"),
            shortName: this.translator.instant("dates.days.saturday.shortName"),
            data: [],
            index: 5,
            dayIndex: 6,
        },
    ];
    public focused: number = 0;
    public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
    public extraWeekIndex: number = 0;

    public unsubscribe$: Subject<void>;
    public error: KretaError;

    constructor(
        public storage: Storage,
        public userManager: UserManagerService,
        public alertCtrl: AlertController,
        private navRouter: Router,
        private dataService: DataService,

        private hw: HwBackButtonService,
        private theme: ThemeService,
        private fDate: FormattedDateService,
        private firebase: FirebaseService,
        private prompt: PromptService,
        private menuCtrl: MenuController,
        private translator: TranslateService
    ) {
        this.theme.currentTheme.subscribe(theme => {
            if (theme == "light") {
                this.unfocusFooterButton = false;
            } else {
                this.unfocusFooterButton = true;
            }
        });
    }

    async ngOnInit() {
        //firebase
        this.firebase.setScreenName("timetable");
        this.loadData(false, null, "current");
    }
    async ionViewWillEnter() {
        await this.menuCtrl.enable(true);
        this.unsubscribe$ = new Subject();
        this.hw.registerHwBackButton(this.unsubscribe$);

        this.userManager.reloader.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
            if (value == "reload") {
                this.componentState = "loading";
                this.loadData();
            }
        });
    }
    ionViewWillLeave() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    loadData(forceRefresh: boolean = false, event?, slideRequest?: "first" | "current") {
        this.userManager.currentUser
            .getAsyncAsObservableWithCache(
                [
                    {
                        name: "getLessonsV3",
                        cacheKey: "v3Lessons",
                        params: [
                            this.fDate.getWeekFirst(this.extraWeekIndex),
                            this.fDate.getWeekLast(this.extraWeekIndex),
                            true,
                        ],
                    },
                ],
                this.extraWeekIndex != 0 || forceRefresh,
                this.extraWeekIndex != 0
            )
            .subscribe({
                next: d => {
                    if (d[0]) {
                        this.displayData(d[0], slideRequest);
                        this.componentState = "loadedProgress";
                    } else {
                        if (this.extraWeekIndex != 0) {
                            this.days.map(d => (d.data = []));
                        }
                    }
                },
                complete: () => {
                    if (event) event.target.complete();

                    let empty = true;
                    this.days.forEach(d => {
                        if (d.data && d.data.length > 0) {
                            empty = false;
                        }
                    });
                    this.componentState = empty ? "empty" : "loaded";
                },
                error: error => {
                    console.error("ON PAGE", error);
                    this.error = error;

                    if (event) event.target.complete();

                    if (this.days.findIndex(d => d.data && d.data.length > 0) == -1) {
                        this.componentState = "error";
                        error.isHandled = true;
                    } else {
                        this.componentState = "loaded";
                    }

                    throw error;
                },
            });
    }

    displayData(timetable: Lesson[], slideRequest: "first" | "current") {
        this.days.map(d => (d.data = []));
        this.days.sort((a, b) => a.dayIndex - b.dayIndex);

        timetable.forEach(l => {
            let d = new Date(l.KezdetIdopont).getDay();
            this.days[d].data.push(l);
        });

        this.days = this.days.map(d => {
            d.data.sort(
                (a, b) => new Date(a.StartTime).valueOf() - new Date(b.StartTime).valueOf()
            );
            return d;
        });

        if (slideRequest == "first") {
            this.slides.slideTo(0);
            this.focused = 0;
        } else if (slideRequest == "current") {
            let displayDays = this.getDisplayDays();
            let slideTo = displayDays.findIndex(d => d.dayIndex == new Date().getDay());
            this.focused = slideTo;

            if (slideTo > -1) {
                this.slides.slideTo(slideTo);
            } else {
                this.slides.slideTo(0);
                this.focused = 0;
            }
        }
    }

    openHomeworks(lesson: Lesson) {
        this.dataService.setData("currentLesson", lesson);
        this.navRouter.navigateByUrl("/timetable-homeworks?id=currentLesson");
    }

    async doRefresh(event?) {
        if (this.componentState == "error") {
            this.componentState = "loading";
        } else {
            this.componentState = "loadedProgress";
        }
        this.loadData(true, event);
    }

    async ionSlideWillChange() {
        this.focused = await this.slides.getActiveIndex();
    }

    getStateClass(lesson: Lesson) {
        return {
            "ion-color": lesson.Allapot?.Nev == "Elmaradt" || lesson.HelyettesTanarNeve,
            "ion-color-danger": lesson.Allapot?.Nev == "Elmaradt",
            "ion-color-warning": lesson.HelyettesTanarNeve,
        };
    }

    async getNextWeek() {
        this.componentState = "loading";
        this.extraWeekIndex++;
        this.loadData(true, null, "first");
    }

    async getPrevWeek() {
        this.componentState = "loading";
        this.extraWeekIndex--;
        this.loadData(true, null, "first");
    }

    getHeaderString() {
        let first = this.fDate.getWeekFirstDate(this.extraWeekIndex);
        let last = this.fDate.getWeekLastDate(this.extraWeekIndex);

        let r =
            `${this.fDate.addZeroToNumberByLength(
                first.getMonth() + 1
            )}. ${this.fDate.addZeroToNumberByLength(first.toString().split(" ")[2])}.` +
            " - " +
            `${this.fDate.addZeroToNumberByLength(
                last.getMonth() + 1
            )}. ${this.fDate.addZeroToNumberByLength(last.toString().split(" ")[2])}.`;
        return r;
    }

    getDisplayDays() {
        let r = this.days;
        return r.sort((a, b) => a.index - b.index).filter(x => x.data.length > 0);
    }
}
