import { Component, OnInit } from "@angular/core";
import { Note } from "../_models/kreta-v3/note";
import { FormattedDateService } from "../_services/formatted-date.service";
import { KretaService } from "../_services/kreta.service";
import { PromptService } from "../_services/prompt.service";
import { CollapsifyService, UniversalSortedData } from "../_services/collapsify.service";
import { Subscription, Subject } from "rxjs";
import { AppService } from "../_services/app.service";
import { UserManagerService } from "../_services/user-manager.service";
import { HwBackButtonService } from "../_services/hw-back-button.service";
import { takeUntil } from "rxjs/operators";
import { KretaError } from "../_exceptions/kreta-exception";
import { FirebaseService } from "../_services/firebase.service";

@Component({
    selector: "app-notes",
    templateUrl: "./notes.page.html",
    styleUrls: ["./notes.page.scss"],
})
export class NotesPage implements OnInit {
    public collapsifiedData: UniversalSortedData[];
    public unsubscribe$: Subject<void>;
    public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
    public error: KretaError;

    private reloaderSubscription: Subscription;

    constructor(
        public kretaService: KretaService,
        public fDate: FormattedDateService,
        public app: AppService,

        private hw: HwBackButtonService,
        private userManager: UserManagerService,
        private firebase: FirebaseService,
        private prompt: PromptService,
        private collapsifyService: CollapsifyService
    ) {}

    async ngOnInit() {
        this.firebase.setScreenName("notes");
    }
    async ionViewWillEnter() {
        this.unsubscribe$ = new Subject();
        this.hw.registerHwBackButton(this.unsubscribe$);
        await this.loadData();
        this.reloaderSubscription = this.userManager.reloader.subscribe(value => {
            if (value == "reload") {
                this.loadData();
            }
        });
    }
    ionViewWillLeave() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        if (this.reloaderSubscription != null) {
            this.reloaderSubscription.unsubscribe();
        }
    }

    private async loadData(forceRefresh = false, event?) {
        this.userManager.currentUser
            .getAsyncAsObservableWithCache<[Note[]]>(
                [
                    {
                        name: "getNotesV3",
                        cacheKey: "v3Notes",
                        params: [],
                    },
                ],
                forceRefresh
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: d => {
                    if (d[0]) {
                        this.collapsifiedData = this.collapsifyService.collapsifyByMonths(
                            d[0],
                            "KeszitesDatuma",
                            "KeszitesDatuma"
                        );
                        this.componentState = "loadedProgress";
                    }
                },
                complete: () => {
                    if (event) event.target.complete();
                    if (this.collapsifiedData.length == 0) {
                        this.componentState = "empty";
                    } else {
                        this.componentState = "loaded";
                    }
                },
                error: error => {
                    console.error(error);
                    this.error = error;

                    if (event) event.target.complete();

                    if (!this.collapsifiedData) {
                        this.componentState = "error";
                        error.isHandled = true;
                    } else {
                        this.componentState = "loaded";
                    }

                    throw error;
                },
            });
    }
    async getMoreData(note: Note) {
        this.prompt.noteV3Alert(note);
    }
    doRefresh(event?: any) {
        if (this.componentState == "error") {
            this.componentState = "loading";
        } else {
            this.componentState = "loadedProgress";
        }
        this.loadData(true, event);
    }
}
