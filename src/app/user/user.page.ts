import { Component, OnInit } from "@angular/core";
import { Student } from "../_models/kreta-v3/student";
import { FormattedDateService } from "../_services/formatted-date.service";
import { Subject } from "rxjs";
import { UserManagerService } from "../_services/user-manager.service";
import { takeUntil } from "rxjs/operators";
import { FirebaseService } from "../_services/firebase.service";

@Component({
    selector: "app-user",
    templateUrl: "./user.page.html",
    styleUrls: ["./user.page.scss"],
})
export class UserPage implements OnInit {
    public componentState: "loaded" | "empty" | "error" | "loading" | "loadedProgress" = "loading";
    public student: Student;
    public unsubscribe$: Subject<void>;

    constructor(
        public fDate: FormattedDateService,

        private firebase: FirebaseService,
        private userManager: UserManagerService
    ) {}

    async ngOnInit() {
        this.firebase.setScreenName("user");
    }

    async ionViewWillEnter() {
        this.unsubscribe$ = new Subject();
        this.userManager.reloader.pipe(takeUntil(this.unsubscribe$)).subscribe(val => {
            if (val == "reload") {
                this.componentState = "loading";
                this.loadData();
            }
        });
        this.loadData();
    }

    private loadData(forceRefresh: boolean = false, event?) {
        this.userManager.currentUser
            .getAsyncAsObservableWithCache<[Student]>(
                [
                    {
                        name: "getStudentV3",
                        cacheKey: "v3Student",
                        params: [],
                    },
                ],
                forceRefresh
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe({
                next: d => {
                    this.student = d[0];
                },
                complete: () => {
                    if (event) event.target.complete();

                    this.componentState = this.student ? "loaded" : "empty";
                },
                error: error => {
                    console.error(error);

                    if (event) event.target.complete();

                    this.componentState = this.student ? "loaded" : "error";

                    throw error;
                },
            });
    }

    ionViewWillLeave() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    async doRefresh(event?) {
        this.componentState = "loadedProgress";
        this.loadData(true, event);
    }
}
